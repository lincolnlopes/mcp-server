# Migração de `Server` para `McpServer`

## Data da Documentação
**Data**: 08 de maio de 2025

## Contexto

No desenvolvimento inicial do nosso servidor MCP (Model Context Protocol), utilizávamos a classe `Server` do SDK. No entanto, identificamos a necessidade de migrar para `McpServer` devido a várias limitações e requisitos de desenvolvimento.

## Principais Motivações para Migração

### 1. Registro de Tools
- **Antes**: Método de registro de tools limitado e pouco flexível
- **Depois**: Suporte robusto para registro de tools com validação avançada

### 2. Tipagem e Validação
- Integração nativa com Zod para definição de schemas de parâmetros
- Validação automática de argumentos dos tools
- Suporte a descrições detalhadas e tipos complexos

### 3. Configuração Avançada
Exemplo de inicialização com `McpServer`:

```typescript
const server = new McpServer({
  name: "mcp-server-ts",
  version: "1.0.0",
}, {
  capabilities: {
    tools: {}
  }
});
```

### 4. Flexibilidade de Resposta
- Suporte a múltiplos tipos de conteúdo de resposta
- Melhor tratamento de erros e metadados

## Exemplo Comparativo

### Registro de Tool com `Server`
```typescript
// Limitações significativas
server.registerTool(/* configuração restrita */)
```

### Registro de Tool com `McpServer`
```typescript
server.tool(
  "dynamic-docs",
  {
    endpoint: z.string().optional().describe("Endpoint da API"),
    // Schemas ricos e descritivos
  },
  async (args) => {
    // Implementação flexível
  }
);
```

## Benefícios Obtidos
- Código mais robusto e tipado
- Melhor integração com o SDK MCP
- Validação automática de parâmetros
- Documentação de tools mais rica

## Considerações
- Requer atualização de importações
- Mudança no padrão de registro de tools
- Necessário adaptar o código existente

## Conclusão
A migração para `McpServer` representa um avanço significativo na arquitetura do nosso servidor, proporcionando maior flexibilidade e segurança no desenvolvimento.

## Recursos Avançados: Tool `dynamic-docs`

Além da migração para `McpServer`, desenvolvemos um tool `dynamic-docs` que demonstra as capacidades avançadas do novo sistema:

### Características Principais
- **Busca Flexível:** Suporte a busca por endpoint, descrição e grupo
- **Múltiplos Formatos de Saída:** 
  - JSON
  - Markdown
  - Formato compacto
- **Internacionalização:** Suporte a português e inglês
- **Filtros Dinâmicos:** 
  - Por método HTTP
  - Por grupo de endpoints
  - Por palavra-chave

### Exemplo de Implementação
```typescript
server.tool(
  "dynamic-docs",
  {
    search: z.string().optional(),
    method: z.string().optional(),
    group: z.string().optional(),
    format: z.enum(["json", "markdown", "compact"]),
    language: z.enum(["pt-BR", "en-US"])
  },
  async (args) => {
    // Lógica de busca e formatação dinâmica
  }
);
```

### Casos de Uso
- Buscar todos os endpoints de um grupo
- Gerar documentação em diferentes idiomas
- Filtrar e formatar documentação de forma flexível

Esta implementação exemplifica como o `McpServer` permite criar tools mais robustos e versáteis.

## Suporte Multilíngue e Snippets de Código

### Linguagens Suportadas
- Python
- JavaScript
- Go
- Rust
- Ruby
- PHP
- cURL (para testes de API)

### Características dos Snippets
- Comentários explicativos em cada linguagem
- Demonstração de tratamento de erros
- Exemplos de requisições GET e POST
- Conversão de respostas para estruturas nativas
- Boas práticas de cada linguagem

### Exemplo Comparativo: Requisição GET

```python
# Python
import requests
resp = requests.get("http://api.exemplo.com/users")
print(resp.json())
```

```javascript
// JavaScript
fetch("http://api.exemplo.com/users")
  .then(resp => resp.json())
  .then(console.log)
```

```go
// Go
resp, err := http.Get("http://api.exemplo.com/users")
if err != nil {
    log.Fatal(err)
}
defer resp.Body.Close()
```

### Benefícios
- Documentação mais acessível
- Suporte para diferentes ecossistemas de desenvolvimento
- Facilita adoção em projetos multilíngues

## Persistência de Documentação

### Recursos de Armazenamento
- Salvamento automático em arquivo JSON
- Carregamento de documentação existente
- Suporte a operações CRUD básicas

### Novas Ações no Tool `dynamic-docs`
- `search`: Busca de endpoints (padrão)
- `add`: Adicionar novo endpoint
- `list`: Listar todos os endpoints
- `update`: Atualizar endpoint existente (próxima implementação)
- `remove`: Remover endpoint (próxima implementação)

### Exemplo de Uso

```typescript
// Adicionar novo endpoint
server.tool("dynamic-docs", {
  action: "add",
  newEndpoint: {
    endpoint: "/api/v1/produtos",
    method: "GET",
    description: "Lista todos os produtos",
    group: "Produtos"
  }
})

// Listar todos os endpoints
server.tool("dynamic-docs", {
  action: "list"
})
```

### Benefícios
- Documentação persistente entre sessões
- Facilidade de manutenção de endpoints
- Preparação para versionamento futuro

### Considerações
- Arquivo salvo em `api-docs.json`
- Suporte inicial para persistência simples
- Futuras melhorias incluirão validações mais robustas

## Versionamento e Evolução do Projeto

### Versão 0.2.0: Persistência de Documentação

#### Recursos Principais
- Implementação de salvamento e carregamento de documentação
- Suporte a operações básicas de CRUD
- Validação robusta de endpoints
- Tratamento de erros consistente

#### Mudanças Técnicas
- Adição de persistência em arquivo JSON
- Validação de formato de endpoints
- Suporte a múltiplos formatos de saída
- Internacionalização básica

#### Exemplos de Uso

```typescript
// Adicionar um novo endpoint
server.tool("dynamic-docs", {
  action: "add",
  newEndpoint: {
    endpoint: "/api/v1/produtos",
    method: "GET",
    description: "Lista todos os produtos"
  }
})

// Listar endpoints
server.tool("dynamic-docs", {
  action: "list"
})
```

### Próximos Passos
- Implementar atualização e remoção de endpoints
- Adicionar suporte a banco de dados (SQLite)
- Criar mecanismo de versionamento de documentação
- Expandir validações de endpoint

### Considerações de Migração
- Código mais robusto e flexível
- Melhor tratamento de erros
- Preparação para recursos futuros
