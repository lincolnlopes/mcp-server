# MCP Server

Este projeto é um servidor MCP (Model Context Protocol) implementado em Node.js com TypeScript.

## Como executar

1. Instale as dependências:
   ```bash
   npm install
   ```
2. Compile o projeto:
   ```bash
   npm run build
   ```
3. Inicie o servidor:
   ```bash
   npm start
   ```

O servidor ficará disponível em `http://localhost:3000/`.

## Endpoints principais

- `POST /mcp`: Endpoint principal para requisições MCP.
- `GET /`: Mensagem de status do servidor.

## Desenvolvimento

- O código fonte está em `src/`.
- O build gerado vai para `dist/`.
- O servidor utiliza Express e o SDK oficial do Model Context Protocol.

## Ferramentas de inspeção

Para testar e inspecionar seu servidor MCP, utilize o [MCP Inspector oficial](https://inspector.modelcontextprotocol.org/).

## Documentação oficial (alternativa)

Para mais detalhes, consulte a documentação oficial (em inglês, com opção de tradução automática pelo navegador):

- [Documentação oficial do Model Context Protocol](https://modelcontextprotocol.org/docs)

Ou utilize a tradução automática do Google Chrome ou [este link traduzido](https://modelcontextprotocol.org/docs) para acessar a documentação em português.
