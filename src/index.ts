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

const server = new McpServer({
  name: "mcp-server-ts",
  version: "1.0.0",
}, {
  capabilities: {
    tools: {}
  }
});

// Definir tipo completo para endpoint
type Endpoint = {
  endpoint: string;
  method: string;
  description: string;
  group?: string;
  parameters?: {
    name: string;
    type: string;
    required: boolean;
    description: string;
  }[];
  exampleRequest?: string;
  exampleResponse?: string;
  snippets?: Record<string, string>;
};

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

// Caminho para o arquivo de documentação
const DOCS_FILE_PATH = path.join(__dirname, 'api-docs.json');

// Função para salvar documentação
async function saveApiDocs(docs: Endpoint[]) {
  try {
    await fs.writeFile(
      DOCS_FILE_PATH, 
      JSON.stringify(docs, null, 2), 
      'utf-8'
    );
    console.log('Documentação salva com sucesso');
  } catch (error) {
    console.error('Erro ao salvar documentação:', error);
  }
}

// Função para carregar documentação
async function loadApiDocs(): Promise<Endpoint[]> {
  try {
    const fileContents = await fs.readFile(DOCS_FILE_PATH, 'utf-8');
    return JSON.parse(fileContents);
  } catch (error) {
    console.warn('Não foi possível carregar documentação existente. Usando documentação padrão.');
    return apiDocs;
  }
}

// Modificar o tool para incluir update e remove
server.tool(
  "dynamic-docs",
  {
    // Parâmetros existentes
    endpoint: z.string().optional().describe("Endpoint da API (opcional)"),
    search: z.string().optional().describe("Busca parcial por endpoint, descrição ou grupo"),
    method: z.string().optional().describe("Filtrar por método HTTP (GET, POST, etc.)"),
    group: z.string().optional().describe("Filtrar por grupo de endpoints"),
    format: z.enum(["json", "markdown", "compact"]).optional().describe("Formato de resposta"),
    language: z.enum(["pt-BR", "en-US"]).optional().default("pt-BR").describe("Idioma da documentação"),
    
    // Expandir parâmetros para operações
    action: z.enum(["search", "add", "update", "remove", "list"]).optional().default("search").describe("Ação a ser realizada"),
    
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
    endpointToRemove: z.string().optional().describe("Endpoint a ser removido")
  },
  async (args) => {
    // Carregar documentação existente
    let docs = await loadApiDocs();

    // Lógica de ações
    switch (args.action) {
      case "add":
        if (args.newEndpoint) {
          // Validar novo endpoint
          if (!validateEndpoint(args.newEndpoint)) {
            throw new McpError(ErrorCode.MethodNotFound, 'Endpoint inválido');
          }

          // Verificar se endpoint já existe
          const existingEndpoint = docs.find(
            d => d.endpoint === args.newEndpoint?.endpoint && 
                 d.method === args.newEndpoint?.method
          );

          if (existingEndpoint) {
            throw new McpError(ErrorCode.MethodNotFound, 'Endpoint já existe');
          }

          docs.push(args.newEndpoint as Endpoint);
          await saveApiDocs(docs);
          return { 
            content: [{ 
              type: "text", 
              text: `Endpoint ${args.newEndpoint.endpoint} adicionado com sucesso` 
            }]
          };
        }
        break;

      case "update":
        if (args.newEndpoint) {
          // Validar endpoint
          if (!validateEndpoint(args.newEndpoint)) {
            throw new McpError(ErrorCode.MethodNotFound, 'Endpoint inválido');
          }

          // Encontrar índice do endpoint existente
          const index = docs.findIndex(
            d => d.endpoint === args.newEndpoint?.endpoint && 
                 d.method === args.newEndpoint?.method
          );

          if (index === -1) {
            throw new McpError(ErrorCode.MethodNotFound, 'Endpoint não encontrado');
          }

          // Atualizar endpoint
          docs[index] = args.newEndpoint as Endpoint;
          await saveApiDocs(docs);
          return { 
            content: [{ 
              type: "text", 
              text: `Endpoint ${args.newEndpoint.endpoint} atualizado com sucesso` 
            }]
          };
        }
        break;

      case "remove":
        if (args.endpointToRemove) {
          const initialLength = docs.length;
          docs = docs.filter(d => d.endpoint !== args.endpointToRemove);

          if (docs.length === initialLength) {
            throw new McpError(ErrorCode.MethodNotFound, 'Endpoint não encontrado');
          }

          await saveApiDocs(docs);
          return { 
            content: [{ 
              type: "text", 
              text: `Endpoint ${args.endpointToRemove} removido com sucesso` 
            }]
          };
        }
        break;

      // Manter lógicas existentes de search e list
      case "list":
        return {
          content: [{ 
            type: "text", 
            text: JSON.stringify(docs, null, 2) 
          }]
        };

      case "search":
      default:
        // Lógica de busca existente
        const searchDocs = (docs: Endpoint[]) => {
          return docs.filter(d => {
            if (args.endpoint && d.endpoint !== args.endpoint) return false;
            if (args.method && d.method.toLowerCase() !== args.method.toLowerCase()) return false;
            if (args.group && d.group?.toLowerCase() !== args.group.toLowerCase()) return false;
            
            if (args.search) {
              const searchLower = args.search.toLowerCase();
              return (
                d.endpoint.toLowerCase().includes(searchLower) ||
                d.description.toLowerCase().includes(searchLower) ||
                d.group?.toLowerCase().includes(searchLower)
              );
            }
            
            return true;
          });
        };

        let filteredDocs = searchDocs(docs);

        if (filteredDocs.length === 0) {
          throw new McpError(ErrorCode.MethodNotFound, 'Nenhum endpoint encontrado com os critérios informados');
        }

        // Formatação da resposta
        const formatResponse = (doc: Endpoint) => {
          // Localização de textos
          const texts = {
            "pt-BR": {
              parameters: "Parâmetros",
              exampleRequest: "Exemplo de requisição",
              exampleResponse: "Exemplo de resposta",
              snippets: "Snippets de código"
            },
            "en-US": {
              parameters: "Parameters",
              exampleRequest: "Example Request",
              exampleResponse: "Example Response",
              snippets: "Code Snippets"
            }
          }[args.language || "pt-BR"];

          // Formatos de saída
          switch (args.format) {
            case "compact":
              return {
                endpoint: doc.endpoint,
                method: doc.method,
                description: doc.description
              };
            
            case "markdown":
              const markdown = [
                `### ${doc.method} \`${doc.endpoint}\``,
                '',
                doc.description,
                '',
                `**${texts.parameters}:**`,
                doc.parameters && doc.parameters.length > 0
                  ? doc.parameters.map(p => 
                    `- \`${p.name}\` (${p.type})${p.required ? ' _(obrigatório)_' : ''}: ${p.description}`
                  ).join('\n')
                  : 'Nenhum',
                '',
                `**${texts.exampleRequest}:**`,
                '```',
                doc.exampleRequest || '',
                '```',
                '',
                `**${texts.exampleResponse}:**`,
                '```',
                doc.exampleResponse || '',
                '```',
                '',
                `**${texts.snippets}:**`,
                ...(doc.snippets ? Object.entries(doc.snippets).map(([lang, snippet]) => 
                  `- ${lang}:\n\`\`\`\n${snippet}\n\`\`\``
                ) : [])
              ].join('\n');

              return markdown;
            
            default: // JSON
              return doc;
          }
        };

        const formattedDocs = filteredDocs.map(formatResponse);

        return {
          content: [
            {
              type: "text",
              text: args.format === "markdown" 
                ? formattedDocs.join('\n---\n') 
                : JSON.stringify(formattedDocs, null, 2)
            }
          ]
        };
    }

    // Caso nenhuma ação seja realizada
    throw new McpError(ErrorCode.MethodNotFound, 'Ação inválida');
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);