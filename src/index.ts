#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import fs from 'fs/promises';
import path from 'path';
import sqlite3 from 'sqlite3';
import { formatToMarkdown } from './formatters/markdown-formatter';
import { formatToHtml } from './formatters/html-formatter';
import { Endpoint } from './interfaces/endpoint.interface';

const server = new McpServer({
  name: "mcp-server-ts",
  version: "1.0.0",
}, {
  capabilities: {
    tools: {}
  }
});

// Tipo para armazenar histórico de versões
type EndpointVersion = {
  version: string;
  endpoint: Endpoint;
  createdAt: string;
  notes?: string;
};

// Tipo para configuração de deprecation
type DeprecationConfig = {
  deprecatedAt: string;
  removalDate?: string;
  alternativeEndpoint?: string;
  reason?: string;
  status: 'pending' | 'scheduled' | 'deprecated';
};

// Configuração de banco de dados SQLite
const DB_PATH = path.join(__dirname, 'api-docs.sqlite');

// Definir interface para linhas do banco de dados
interface EndpointRow {
  id: number;
  endpoint: string;
  method: string;
  description: string | null;
  group_name: string | null;
  parameters: string;
  example_request: string | null;
  example_response: string | null;
  snippets: string;
  version: string;
  created_at: string;
  updated_at: string;
  
  // Campos de deprecation
  deprecation_status: string | null;
  deprecation_date: string | null;
  removal_date: string | null;
  alternative_endpoint: string | null;
  deprecation_reason: string | null;
}

// Enum para tipos de mudança
enum VersionChangeType {
  PATCH = 'patch',
  MINOR = 'minor',
  MAJOR = 'major'
}

// Função para determinar tipo de mudança
function determineVersionChangeType(
  oldEndpoint: Endpoint, 
  newEndpoint: Endpoint
): VersionChangeType {
  // Comparações para determinar nível de mudança
  if (
    // Mudanças que quebram compatibilidade
    oldEndpoint.method !== newEndpoint.method ||
    JSON.stringify(oldEndpoint.parameters) !== JSON.stringify(newEndpoint.parameters)
  ) {
    return VersionChangeType.MAJOR;
  }

  if (
    // Mudanças que adicionam funcionalidades
    oldEndpoint.description !== newEndpoint.description ||
    oldEndpoint.group !== newEndpoint.group ||
    JSON.stringify(oldEndpoint.snippets) !== JSON.stringify(newEndpoint.snippets)
  ) {
    return VersionChangeType.MINOR;
  }

  // Mudanças pequenas ou sem impacto
  return VersionChangeType.PATCH;
}

class SqliteDocumentStore {
  private db: sqlite3.Database;

  constructor() {
    this.db = new sqlite3.Database(DB_PATH);
    this.initializeDatabase();
  }

  private initializeDatabase() {
    this.db.run(`
      CREATE TABLE IF NOT EXISTS endpoints (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        endpoint TEXT NOT NULL,
        method TEXT NOT NULL,
        description TEXT,
        group_name TEXT,
        parameters TEXT,
        example_request TEXT,
        example_response TEXT,
        snippets TEXT,
        version TEXT DEFAULT '1.0.0',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        
        deprecation_status TEXT,
        deprecation_date DATETIME,
        removal_date DATETIME,
        alternative_endpoint TEXT,
        deprecation_reason TEXT,
        
        UNIQUE(endpoint, method)
      )
    `);
  }

  async saveEndpoint(endpoint: Endpoint): Promise<void> {
    return new Promise((resolve, reject) => {
      const snippetsJson = JSON.stringify(endpoint.snippets || {});
      const parametersJson = JSON.stringify(endpoint.parameters || []);

      const stmt = this.db.prepare(`
        INSERT OR REPLACE INTO endpoints 
        (endpoint, method, description, group_name, parameters, example_request, example_response, snippets, version, updated_at) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `);

      stmt.run(
        endpoint.endpoint, 
        endpoint.method, 
        endpoint.description, 
        endpoint.group || null,
        parametersJson,
        endpoint.exampleRequest || null,
        endpoint.exampleResponse || null,
        snippetsJson,
        '1.0.0',
        (err: Error | null) => {
          if (err) reject(err);
          else resolve();
        }
      );
      stmt.finalize();
    });
  }

  async loadEndpoints(): Promise<Endpoint[]> {
    return new Promise((resolve, reject) => {
      this.db.all('SELECT * FROM endpoints', (err: Error | null, rows: EndpointRow[]) => {
        if (err) {
          reject(err);
          return;
        }

        const endpoints: Endpoint[] = rows.map(row => ({
          endpoint: row.endpoint,
          method: row.method as Endpoint['method'],
          description: row.description || '',
          group: row.group_name || undefined,
          parameters: JSON.parse(row.parameters || '[]'),
          exampleRequest: row.example_request || undefined,
          exampleResponse: row.example_response || undefined,
          snippets: JSON.parse(row.snippets || '{}')
        }));

        resolve(endpoints);
      });
    });
  }

  async removeEndpoint(endpoint: string): Promise<number> {
    return new Promise((resolve, reject) => {
      this.db.run('DELETE FROM endpoints WHERE endpoint = ?', [endpoint], function(this: sqlite3.RunResult, err: Error | null) {
        if (err) {
          reject(err);
          return;
        }
        resolve(this.changes || 0);
      });
    });
  }

  // Método público para acessar versões
  public getVersions(): Promise<string[]> {
    return new Promise((resolve, reject) => {
      this.db.all('SELECT DISTINCT version FROM endpoints', (err: Error | null, rows: {version: string}[]) => {
        if (err) reject(err);
        else resolve(rows.map(row => row.version));
      });
    });
  }

  // Método para gerar versão semântica com suporte a major, minor e patch
  private generateSemanticVersion(
    currentVersion: string, 
    changeType: VersionChangeType
  ): string {
    const [major, minor, patch] = currentVersion.split('.').map(Number);

    switch (changeType) {
      case VersionChangeType.MAJOR:
        return `${major + 1}.0.0`;
      case VersionChangeType.MINOR:
        return `${major}.${minor + 1}.0`;
      case VersionChangeType.PATCH:
      default:
        return `${major}.${minor}.${patch + 1}`;
    }
  }

  // Método para criar nova versão com análise de mudança
  async createEndpointVersion(
    endpoint: Endpoint, 
    versionNotes?: string, 
    forceChangeType?: VersionChangeType
  ): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        // Buscar versão atual do endpoint
        const existingVersions = await this.listEndpointVersions(endpoint.endpoint);
        const latestVersion = existingVersions.length > 0 
          ? existingVersions[0].version 
          : '1.0.0';

        // Determinar tipo de mudança
        const changeType = forceChangeType || (existingVersions.length > 0 
          ? determineVersionChangeType(
              existingVersions[0].endpoint, 
              endpoint
            )
          : VersionChangeType.PATCH);

        // Gerar nova versão
        const newVersion = this.generateSemanticVersion(latestVersion, changeType);

        const snippetsJson = JSON.stringify(endpoint.snippets || {});
        const parametersJson = JSON.stringify(endpoint.parameters || []);

        const stmt = this.db.prepare(`
          INSERT INTO endpoints 
          (endpoint, method, description, group_name, parameters, example_request, example_response, snippets, version, created_at, updated_at, change_type, version_notes) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, ?, ?)
        `);

        stmt.run(
          endpoint.endpoint, 
          endpoint.method, 
          endpoint.description, 
          endpoint.group || null,
          parametersJson,
          endpoint.exampleRequest || null,
          endpoint.exampleResponse || null,
          snippetsJson,
          newVersion,
          changeType,
          versionNotes || null,
          (err: Error | null) => {
            if (err) reject(err);
            else resolve(newVersion);
          }
        );
        stmt.finalize();
      } catch (error) {
        reject(error);
      }
    });
  }

  // Método para reverter para uma versão anterior
  async rollbackEndpoint(endpoint: string, targetVersion: string): Promise<Endpoint | null> {
    return new Promise((resolve, reject) => {
      this.db.get(
        'SELECT * FROM endpoints WHERE endpoint = ? AND version = ?', 
        [endpoint, targetVersion], 
        (err: Error | null, row: EndpointRow | undefined) => {
          if (err) {
            reject(err);
            return;
          }

          if (!row) {
            resolve(null);
            return;
          }

          const rolledBackEndpoint: Endpoint = {
            endpoint: row.endpoint,
            method: row.method as Endpoint['method'],
            description: row.description || '',
            group: row.group_name || undefined,
            parameters: JSON.parse(row.parameters || '[]'),
            exampleRequest: row.example_request || undefined,
            exampleResponse: row.example_response || undefined,
            snippets: JSON.parse(row.snippets || '{}')
          };

          resolve(rolledBackEndpoint);
        }
      );
    });
  }

  // Listar todas as versões de um endpoint
  async listEndpointVersions(endpoint: string): Promise<EndpointVersion[]> {
    return new Promise((resolve, reject) => {
      this.db.all(
        'SELECT * FROM endpoints WHERE endpoint = ? ORDER BY created_at DESC', 
        [endpoint], 
        (err: Error | null, rows: EndpointRow[]) => {
          if (err) {
            reject(err);
            return;
          }

          const versions: EndpointVersion[] = rows.map(row => ({
            version: row.version,
            endpoint: {
              endpoint: row.endpoint,
              method: row.method as Endpoint['method'],
              description: row.description || '',
              group: row.group_name || undefined,
              parameters: JSON.parse(row.parameters || '[]'),
              exampleRequest: row.example_request || undefined,
              exampleResponse: row.example_response || undefined,
              snippets: JSON.parse(row.snippets || '{}')
            },
            createdAt: row.created_at
          }));

          resolve(versions);
        }
      );
    });
  }

  // Método para comparar versões de endpoint
  async compareEndpointVersions(
    endpoint: string, 
    version1: string, 
    version2: string
  ): Promise<{
    differences: Record<string, { before: any, after: any }>,
    changeType: VersionChangeType
  }> {
    return new Promise((resolve, reject) => {
      this.db.all(
        'SELECT * FROM endpoints WHERE endpoint = ? AND version IN (?, ?)', 
        [endpoint, version1, version2], 
        (err: Error | null, rows: EndpointRow[]) => {
          if (err) {
            reject(err);
            return;
          }

          if (rows.length !== 2) {
            reject(new Error('Versões não encontradas'));
            return;
          }

          const [v1, v2] = rows.sort((a, b) => 
            a.version.localeCompare(b.version)
          );

          const differences: Record<string, { before: any, after: any }> = {};

          // Comparar campos
          const fieldsToCompare = [
            'method', 
            'description', 
            'group_name', 
            'parameters', 
            'example_request', 
            'example_response', 
            'snippets'
          ];

          fieldsToCompare.forEach(field => {
            const beforeValue = v1[field as keyof EndpointRow];
            const afterValue = v2[field as keyof EndpointRow];

            if (beforeValue !== afterValue) {
              differences[field] = {
                before: beforeValue,
                after: afterValue
              };
            }
          });

          const changeType = determineVersionChangeType(
            {
              endpoint: v1.endpoint,
              method: v1.method as Endpoint['method'],
              description: v1.description || '',
              group: v1.group_name || undefined,
              parameters: JSON.parse(v1.parameters || '[]'),
              exampleRequest: v1.example_request || undefined,
              exampleResponse: v1.example_response || undefined,
              snippets: JSON.parse(v1.snippets || '{}')
            },
            {
              endpoint: v2.endpoint,
              method: v2.method as Endpoint['method'],
              description: v2.description || '',
              group: v2.group_name || undefined,
              parameters: JSON.parse(v2.parameters || '[]'),
              exampleRequest: v2.example_request || undefined,
              exampleResponse: v2.example_response || undefined,
              snippets: JSON.parse(v2.snippets || '{}')
            }
          );

          resolve({ differences, changeType });
        }
      );
    });
  }

  // Método para marcar endpoint como deprecated
  async deprecateEndpoint(
    endpoint: string, 
    config: Partial<DeprecationConfig>
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      // Configurações padrão para deprecation
      const deprecationConfig: DeprecationConfig = {
        deprecatedAt: new Date().toISOString(),
        status: 'pending',
        ...config
      };

      // Atualizar endpoint com informações de deprecation
      const stmt = this.db.prepare(`
        UPDATE endpoints 
        SET 
          deprecation_status = ?, 
          deprecation_date = ?, 
          removal_date = ?, 
          alternative_endpoint = ?, 
          deprecation_reason = ?
        WHERE endpoint = ?
      `);

      stmt.run(
        deprecationConfig.status,
        deprecationConfig.deprecatedAt,
        deprecationConfig.removalDate || null,
        deprecationConfig.alternativeEndpoint || null,
        deprecationConfig.reason || null,
        endpoint,
        (err: Error | null) => {
          if (err) reject(err);
          else resolve();
        }
      );
      stmt.finalize();
    });
  }

  // Método para listar endpoints deprecated
  async listDeprecatedEndpoints(): Promise<Array<Endpoint & { deprecationConfig: DeprecationConfig }>> {
    return new Promise((resolve, reject) => {
      this.db.all(
        'SELECT * FROM endpoints WHERE deprecation_status IS NOT NULL AND deprecation_status != "active"', 
        (err: Error | null, rows: EndpointRow[]) => {
          if (err) {
            reject(err);
            return;
          }

          const deprecatedEndpoints = rows.map(row => ({
            ...{
              endpoint: row.endpoint,
              method: row.method as Endpoint['method'],
              description: row.description || '',
              group: row.group_name || undefined,
              parameters: JSON.parse(row.parameters || '[]'),
              exampleRequest: row.example_request || undefined,
              exampleResponse: row.example_response || undefined,
              snippets: JSON.parse(row.snippets || '{}')
            },            deprecationConfig: {
              deprecatedAt: row.deprecation_date || new Date().toISOString(),
              removalDate: row.removal_date || undefined,
              alternativeEndpoint: row.alternative_endpoint || undefined,
              reason: row.deprecation_reason || undefined,
              status: (row.deprecation_status || 'pending') as 'pending' | 'scheduled' | 'deprecated'
            }
          }));

          resolve(deprecatedEndpoints);
        }
      );
    });
  }

  // Método para verificar se um endpoint está deprecated
  async isEndpointDeprecated(endpoint: string): Promise<DeprecationConfig | null> {
    return new Promise((resolve, reject) => {
      this.db.get(
        'SELECT * FROM endpoints WHERE endpoint = ? AND deprecation_status IS NOT NULL AND deprecation_status != "active"', 
        [endpoint],
        (err: Error | null, row: EndpointRow | undefined) => {
          if (err) {
            reject(err);
            return;
          }

          if (!row) {
            resolve(null);
            return;
          }

          const deprecationConfig: DeprecationConfig = {
            deprecatedAt: row.deprecation_date || new Date().toISOString(),
            removalDate: row.removal_date || undefined,
            alternativeEndpoint: row.alternative_endpoint || undefined,
            reason: row.deprecation_reason || undefined,
            status: (row.deprecation_status || 'pending') as 'pending' | 'scheduled' | 'deprecated'
          };

          resolve(deprecationConfig);
        }
      );
    });
  }

  close() {
    this.db.close();
  }
}

// Substituir funções de persistência existentes
const sqliteStore = new SqliteDocumentStore();

// Função de validação de endpoint
function validateEndpoint(endpoint: Partial<Endpoint>): boolean {
  const requiredFields: (keyof Endpoint)[] = ['endpoint', 'method', 'description'];
  
  // Verificar campos obrigatórios
  for (const field of requiredFields) {
    if (!endpoint[field] || String(endpoint[field]).trim() === '') {
      console.error(`Validação falhou: campo ${field} é obrigatório`);
      return false;
    }
  }

  // Validar método HTTP
  const validHttpMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'];
  if (!validHttpMethods.includes(String(endpoint.method).toUpperCase())) {
    console.error(`Método HTTP inválido: ${endpoint.method}`);
    return false;
  }

  // Validar formato do endpoint
  const endpointRegex = /^\/[a-zA-Z0-9_\-\/]+$/;
  if (!endpointRegex.test(String(endpoint.endpoint))) {
    console.error(`Formato de endpoint inválido: ${endpoint.endpoint}`);
    return false;
  }

  // Validações adicionais para parâmetros
  if (endpoint.parameters) {
    for (const param of endpoint.parameters) {
      if (!param.name || param.name.trim() === '') {
        console.error('Nome de parâmetro inválido');
        return false;
      }

      const validTypes = ['string', 'number', 'boolean', 'array', 'object'];
      if (!validTypes.includes(param.type)) {
        console.error(`Tipo de parâmetro inválido: ${param.type}`);
        return false;
      }
    }
  }

  // Validar tamanho máximo de campos
  const MAX_LENGTH = 500;
  if (
    (endpoint.description && endpoint.description.length > MAX_LENGTH) ||
    (endpoint.exampleRequest && endpoint.exampleRequest.length > MAX_LENGTH) ||
    (endpoint.exampleResponse && endpoint.exampleResponse.length > MAX_LENGTH)
  ) {
    console.error('Campos de texto excedem o tamanho máximo permitido');
    return false;
  }

  return true;
}

// Atualizar definição de apiDocs
const apiDocs: Endpoint[] = [
  {
    endpoint: '/api/v1/users',
    method: 'GET',
    description: 'Lista todos os usuários do sistema.',
    group: 'Usuários',
    parameters: [],
    exampleRequest: 'GET /api/v1/users',
    exampleResponse: '{ "users": [ { "id": 1, "name": "Alice" } ] }',
    snippets: {
      curl: '# Busca todos os usuários usando cURL\ncurl -X GET http://localhost:3000/api/v1/users',
      python: '# Busca todos os usuários usando requests\n# Requer: pip install requests\nimport requests\n\n# Realiza a requisição GET\nresp = requests.get("http://localhost:3000/api/v1/users")\n\n# Imprime os usuários em formato JSON\nprint(resp.json())',
      javascript: '// Busca todos os usuários usando fetch\n// Funciona em navegadores modernos e Node.js\nfetch("http://localhost:3000/api/v1/users")\n  .then(resp => resp.json())  // Converte resposta para JSON\n  .then(console.log)          // Imprime os usuários',
      go: `// Busca todos os usuários em Go
// Demonstra tratamento de erros e leitura de resposta HTTP
package main

import (
    "fmt"       // Formatação de saída
    "net/http"  // Cliente HTTP
    "io/ioutil" // Leitura de corpo de resposta
)

func main() {
    // Realiza requisição GET
    resp, err := http.Get("http://localhost:3000/api/v1/users")
    
    // Verifica se houve erro na requisição
    if err != nil {
        fmt.Println("Erro ao buscar usuários:", err)
        return
    }
    defer resp.Body.Close() // Garante fechamento do corpo da resposta

    // Lê todo o corpo da resposta
    body, err := ioutil.ReadAll(resp.Body)
    if err != nil {
        fmt.Println("Erro ao ler resposta:", err)
        return
    }

    // Imprime o conteúdo da resposta
    fmt.Println(string(body))
}`,
      rust: `// Busca todos os usuários em Rust
// Usa async/await e tratamento de erros com Result
use reqwest;  // Cliente HTTP assíncrono
use tokio;    // Runtime assíncrono

#[tokio::main]  // Marca a função main como assíncrona
async fn main() -> Result<(), reqwest::Error> {
    // Realiza requisição GET de forma assíncrona
    let resp = reqwest::get("http://localhost:3000/api/v1/users")
        .await?      // Aguarda resposta, propaga erros
        .json::<serde_json::Value>()  // Converte para JSON
        .await?;     // Aguarda conversão
    
    // Imprime resposta JSON
    println!("{}", resp);
    Ok(())  // Indica execução bem-sucedida
}`,
      ruby: `# Busca todos os usuários em Ruby
# Usa biblioteca padrão para requisições HTTP
require 'net/http'  # Cliente HTTP
require 'json'      # Parsing de JSON

# Configura URI do endpoint
uri = URI('http://localhost:3000/api/v1/users')

# Realiza requisição GET
resp = Net::HTTP.get(uri)

# Converte resposta para objeto Ruby
users = JSON.parse(resp)

# Imprime usuários
puts users`,
      php: `<?php
// Busca todos os usuários em PHP
// Usa funções nativas para requisições HTTP

// URL do endpoint
$url = 'http://localhost:3000/api/v1/users';

// Realiza requisição GET
$resp = file_get_contents($url);

// Converte resposta para array associativo
$users = json_decode($resp, true);

// Imprime usuários
print_r($users);
?>`
    }
  },
  {
    endpoint: '/api/v1/users',
    method: 'POST',
    description: 'Cria um novo usuário no sistema.',
    group: 'Usuários',
    parameters: [
      { name: 'name', type: 'string', required: true, description: 'Nome completo do usuário' },
      { name: 'email', type: 'string', required: true, description: 'Endereço de email do usuário' }
    ],
    exampleRequest: 'POST /api/v1/users { "name": "Bob", "email": "bob@example.com" }',
    exampleResponse: '{ "id": 2, "name": "Bob", "email": "bob@example.com" }',
    snippets: {
      curl: '# Busca todos os usuários usando cURL\ncurl -X POST http://localhost:3000/api/v1/users \\\n     -H "Content-Type: application/json" \\\n     -d \'{"name":"Bob","email":"bob@example.com"}\'',
      python: '# Busca todos os usuários usando requests\n# Requer: pip install requests\nimport requests\n\n# Realiza a requisição POST\nresp = requests.post("http://localhost:3000/api/v1/users", \n    json={"name": "Bob", "email": "bob@example.com"})\n\n# Imprime os usuários em formato JSON\nprint(resp.json())',
      javascript: '// Busca todos os usuários usando fetch\n// Funciona em navegadores modernos e Node.js\nfetch("http://localhost:3000/api/v1/users", {\n  method: "POST",\n  headers: {"Content-Type": "application/json"},\n  body: JSON.stringify({name: "Bob", email: "bob@example.com"})\n})\n  .then(resp => resp.json())\n  .then(console.log)',
      go: `// Busca todos os usuários em Go
// Demonstra tratamento de erros e leitura de resposta HTTP
package main

import (
    "bytes"
    "encoding/json"
    "fmt"
    "net/http"
    "io/ioutil"
)

func main() {
    user := map[string]string{
        "name":  "Bob",
        "email": "bob@example.com",
    }
    jsonData, _ := json.Marshal(user)

    resp, err := http.Post(
        "http://localhost:3000/api/v1/users", 
        "application/json", 
        bytes.NewBuffer(jsonData)
    )
    if err != nil {
        fmt.Println("Erro:", err)
        return
    }
    defer resp.Body.Close()

    body, _ := ioutil.ReadAll(resp.Body)
    fmt.Println(string(body))
}`,
      rust: `// Busca todos os usuários em Rust
// Usa async/await e tratamento de erros com Result
use reqwest;  // Cliente HTTP assíncrono
use serde_json::json;
use tokio;    // Runtime assíncrono

#[tokio::main]  // Marca a função main como assíncrona
async fn main() -> Result<(), reqwest::Error> {
    let client = reqwest::Client::new();
    let user = json!({
        "name": "Bob",
        "email": "bob@example.com"
    });

    let resp = client.post("http://localhost:3000/api/v1/users")
        .json(&user)
        .send()
        .await?
        .json::<serde_json::Value>()
        .await?;
    
    println!("{}", resp);
    Ok(())  // Indica execução bem-sucedida
}`,
      ruby: `# Busca todos os usuários em Ruby
# Usa biblioteca padrão para requisições HTTP
require 'net/http'  # Cliente HTTP
require 'json'      # Parsing de JSON
require 'uri'       # Manipulação de URIs

# Configura URI do endpoint
uri = URI('http://localhost:3000/api/v1/users')
http = Net::HTTP.new(uri.host, uri.port)

# Configura requisição POST
req = Net::HTTP::Post.new(uri.path, {'Content-Type' => 'application/json'})
req.body = {
  name: 'Bob',
  email: 'bob@example.com'
}.to_json

# Realiza requisição POST
resp = http.request(req)

# Converte resposta para objeto Ruby
users = JSON.parse(resp.body)

# Imprime usuários
puts users`,
      php: `<?php
// Busca todos os usuários em PHP
// Usa funções nativas para requisições HTTP

// URL do endpoint
$url = 'http://localhost:3000/api/v1/users';

// Dados a serem enviados
$data = json_encode([
    'name' => 'Bob',
    'email' => 'bob@example.com'
]);

// Opções de requisição
$options = [
    'http' => [
        'method' => 'POST',
        'header' => "Content-Type: application/json\r\n",
        'content' => $data
    ]
];

// Cria contexto de stream
$context = stream_context_create($options);

// Realiza requisição POST
$resp = file_get_contents($url, false, $context);

// Converte resposta para array associativo
$user = json_decode($resp, true);

// Imprime usuários
print_r($user);
?>`
    }
  }
];

// Substituir funções de persistência existentes por métodos da classe SqliteDocumentStore
async function saveApiDocs(docs: Endpoint[]) {
  try {
    // Salvar no SQLite
    for (const doc of docs) {
      await sqliteStore.saveEndpoint(doc);
    }
    console.log('Documentação salva no SQLite com sucesso');
  } catch (error) {
    console.error('Erro ao salvar documentação no SQLite:', error);
  }
}

async function loadApiDocs(): Promise<Endpoint[]> {
  try {
    const docs = await sqliteStore.loadEndpoints();
    return docs.length > 0 ? docs : apiDocs;
  } catch (error) {
    console.warn('Não foi possível carregar documentação do SQLite. Usando documentação padrão.');
    return apiDocs;
  }
}

// Expandir tipo de ação para incluir deprecation
const ActionSchema = z.enum([
  "list",           // Listar endpoints
  "create",         // Criar endpoint
  "update",         // Atualizar endpoint
  "remove",         // Remover endpoint
  "search",         // Buscar endpoints
  "rollback",       // Reverter versão
  "list-versions",  // Listar versões
  "compare",        // Comparar versões
  "deprecate",      // Deprecar endpoint
  "list-deprecated",// Listar endpoints deprecated
  "check-deprecated"// Verificar status de deprecation
]);

type ActionType = z.infer<typeof ActionSchema>;

// Atualizar tool para suportar novas ações
server.tool(
  "dynamic-docs",
  {
    // Parâmetros existentes
    endpoint: z.string().optional().describe("Endpoint da API (opcional)"),
    search: z.string().optional().describe("Busca parcial por endpoint, descrição ou grupo"),
    method: z.string().optional().describe("Filtrar por método HTTP (GET, POST, etc.)"),
    group: z.string().optional().describe("Filtrar por grupo de endpoints"),
    format: z.enum(["json", "markdown", "html"]).optional().default("json").describe("Formato de resposta"),
    language: z.enum(["pt-BR", "en-US"]).optional().default("pt-BR").describe("Idioma da documentação"),
    
    // Expandir parâmetros para operações
    action: ActionSchema.optional().default("search").describe("Ação a ser realizada"),
    
    // Endpoint para adicionar/atualizar
    newEndpoint: z.object({
      endpoint: z.string(),
      method: z.string(),
      description: z.string(),
      group: z.string().optional(),
      parameters: z.array(z.object({
        name: z.string(),
        type: z.string(),
        required: z.boolean().optional().default(false),
        description: z.string()
      })).optional(),
      exampleRequest: z.string().optional(),
      exampleResponse: z.string().optional(),
      snippets: z.record(z.string()).optional()
    }).optional().describe("Novo endpoint para adicionar/atualizar"),

    // Identificador para remoção
    endpointToRemove: z.string().optional().describe("Endpoint a ser removido"),

    // Adicionar suporte a versionamento
    version: z.string().optional().describe("Versão do endpoint"),
    versionAction: z.enum([
      "list",           // Listar versões
      "create",         // Criar nova versão
      "rollback",       // Reverter para versão anterior
      "list-versions",  // Listar versões de um endpoint específico
      "compare"         // Comparar versões
    ]).optional().describe("Ação de versionamento"),
    
    // Parâmetros para versionamento
    versionEndpoint: z.string().optional().describe("Endpoint para ações de versionamento"),
    targetVersion: z.string().optional().describe("Versão alvo para rollback ou comparação"),
    compareVersion: z.string().optional().describe("Segunda versão para comparação"),
    changeType: z.enum(["patch", "minor", "major"]).optional().describe("Tipo forçado de mudança"),
    versionNotes: z.string().optional().describe("Notas para nova versão"),

    // Adicionar suporte a deprecation
    deprecationAction: z.enum([
      "deprecate",        // Marcar endpoint como deprecated
      "list-deprecated",  // Listar endpoints deprecated
      "check-deprecated"  // Verificar status de deprecation de um endpoint
    ]).optional().describe("Ação de deprecation"),
    
    // Parâmetros para deprecation
    deprecationEndpoint: z.string().optional().describe("Endpoint para ações de deprecation"),
    removalDate: z.string().optional().describe("Data planejada para remoção"),
    alternativeEndpoint: z.string().optional().describe("Endpoint alternativo"),
    deprecationReason: z.string().optional().describe("Motivo da deprecation")
  },
  async (args) => {
    // Determinar ação baseada em diferentes tipos de ação
    const action = 
      args.action || 
      args.versionAction || 
      args.deprecationAction || 
      "search";

    switch (action) {
      // Ações de deprecation
      case "deprecate":
        // Deprecar um endpoint
        if (!args.deprecationEndpoint) {
          throw new McpError(ErrorCode.MethodNotFound, 'Endpoint não especificado');
        }

        await sqliteStore.deprecateEndpoint(args.deprecationEndpoint, {
          removalDate: args.removalDate,
          alternativeEndpoint: args.alternativeEndpoint,
          reason: args.deprecationReason,
          status: args.removalDate ? 'scheduled' : 'pending'
        });

        return {
          content: [{
            type: "text", 
            text: `Endpoint ${args.deprecationEndpoint} marcado como deprecated`
          }]
        };

      case "list-deprecated":
        // Listar endpoints deprecated
        const deprecatedEndpoints = await sqliteStore.listDeprecatedEndpoints();
        
        return {
          content: [{
            type: "text", 
            text: JSON.stringify(deprecatedEndpoints, null, 2)
          }]
        };

      case "check-deprecated":
        // Verificar status de deprecation de um endpoint
        if (!args.deprecationEndpoint) {
          throw new McpError(ErrorCode.MethodNotFound, 'Endpoint não especificado');
        }

        const deprecationStatus = await sqliteStore.isEndpointDeprecated(args.deprecationEndpoint);
        
        return {
          content: [{
            type: "text", 
            text: deprecationStatus 
              ? JSON.stringify(deprecationStatus, null, 2)
              : 'Endpoint não está deprecated'
          }]
        };

      // Outras ações existentes...
      default:
        // Buscar endpoints
        let endpoints = await loadApiDocs();

        // Aplicar filtros
        if (args.search) {
          endpoints = endpoints.filter(doc =>
            doc.endpoint.includes(args.search || '') ||
            doc.description.includes(args.search || '') ||
            (doc.group && doc.group.includes(args.search || ''))
          );
        }
        if (args.method) {
          endpoints = endpoints.filter(doc => doc.method === args.method);
        }
        if (args.group) {
          endpoints = endpoints.filter(doc => doc.group === args.group);
        }

        // Formatar a saída
        let formattedOutput: string;
        switch (args.format) {
          case "markdown":
            formattedOutput = endpoints.map(formatToMarkdown).join('\n');
            break;
          case "html":
            formattedOutput = endpoints.map(formatToHtml).join('\n');
            break;
          default: // "json"
            formattedOutput = JSON.stringify(endpoints, null, 2);
        }

        return {
          content: [{ type: "text", text: formattedOutput }],
        };
    }
  }
);

(async () => {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  process.on('SIGINT', () => {
    sqliteStore.close();
    process.exit();
  });
})();
