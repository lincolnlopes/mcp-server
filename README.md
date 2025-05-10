# MCP Dynamic Docs Server

## Descrição do Projeto

Este projeto implementa um servidor MCP (Model Context Protocol) para gerenciamento dinâmico de documentação de API, com recursos avançados de versionamento, deprecation e internacionalização.

## Recursos Principais

### 🚀 Documentação Dinâmica
- Geração automática de documentação de API
- Suporte a múltiplos formatos de saída (JSON, Markdown)
- Internacionalização (português e inglês)

### 🔄 Versionamento Semântico
- Suporte a versionamento de endpoints
- Classificação automática de mudanças (Patch, Minor, Major)
- Comparação e rollback de versões

### 🚫 Gerenciamento de Deprecation
- Marcação de endpoints como deprecated
- Configuração de data de remoção
- Suporte a endpoints alternativos

## Tecnologias

- TypeScript
- Node.js
- MCP SDK
- Zod (validação)
- SQLite

## Instalação

1. Clone o repositório:
   ```bash
   git clone https://github.com/seu-usuario/mcp-dynamic-docs.git
   cd mcp-dynamic-docs
   ```

2. Instale as dependências:
   ```bash
   npm install
   ```

3. Compile o projeto:
   ```bash
   npm run build
   ```

4. Inicie o servidor:
   ```bash
   npm start
   ```

## Uso Básico

### Criação de Endpoint

```typescript
server.tool("dynamic-docs", {
  action: "create",
  newEndpoint: {
    endpoint: "/api/v1/users",
    method: "GET",
    description: "Lista usuários do sistema",
    parameters: [
      { 
        name: "group", 
        type: "string", 
        required: false, 
        description: "Filtrar usuários por grupo" 
      }
    ]
  }
})
```

### Versionamento

```typescript
// Criar nova versão
server.tool("dynamic-docs", {
  versionAction: "create",
  versionEndpoint: "/api/v1/users",
  changeType: "minor",
  versionNotes: "Adicionado filtro por grupo"
})

// Comparar versões
server.tool("dynamic-docs", {
  versionAction: "compare",
  versionEndpoint: "/api/v1/users",
  targetVersion: "1.0.0",
  compareVersion: "1.1.0"
})
```

### Deprecation

```typescript
// Deprecar endpoint
server.tool("dynamic-docs", {
  deprecationAction: "deprecate",
  deprecationEndpoint: "/api/v1/legacy-users",
  removalDate: "2024-12-31",
  alternativeEndpoint: "/api/v2/users",
  deprecationReason: "Endpoint substituído por versão mais moderna"
})
```

## Ferramentas de Inspeção

Para testar e inspecionar seu servidor MCP, utilize o [MCP Inspector oficial](https://inspector.modelcontextprotocol.org/).

## Documentação Detalhada

- [Guia de Versionamento](docs/versioning-guide.md)
- [Migração para McpServer](docs/20250508-migration-to-mcpserver.md)

## Contribuição

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -am 'Adiciona nova feature'`)
4. Faça um push para a branch (`git push origin feature/nova-feature`)
5. Crie um novo Pull Request

## Licença

Este projeto está licenciado sob a Licença MIT.

## Autor

**Lincoln Lopes**
- GitHub: [@lincolnlopes](https://github.com/lincolnlopes)
- Email: lincolnlopes@msn.com

## Referências

- [Model Context Protocol TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- [Documentação Oficial do MCP](https://modelcontextprotocol.org/docs)
