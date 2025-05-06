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

### Como usar o MCP Inspector

O MCP Inspector **não roda embutido no seu servidor MCP**. Ele é uma ferramenta externa, feita para se conectar ao seu endpoint MCP via HTTP, assim como Postman ou Insomnia, mas com suporte nativo ao protocolo MCP.

#### Opção 1: Usar o site oficial
- Acesse: [https://inspector.modelcontextprotocol.org/](https://inspector.modelcontextprotocol.org/)
- No campo de conexão, digite o endpoint do seu servidor, por exemplo: `http://localhost:3000/mcp`
- Clique em conectar para acessar a interface visual.

#### Opção 2: Rodar localmente
- Execute no terminal:
  ```bash
  npx @modelcontextprotocol/inspector http://localhost:3000/mcp
  ```
- Isso abrirá a interface do Inspector no navegador (geralmente em http://localhost:6274).

#### Observações
- O Inspector é sempre um cliente externo, não um plugin do seu servidor.
- Não tente acessar `/mcp` diretamente pelo navegador, pois ele faz GET e o endpoint espera POST.
- O Inspector faz as requisições POST corretamente e mostra tudo em uma interface amigável.
- Se estiver rodando em um servidor remoto, certifique-se de liberar a porta 3000 no firewall.

## Fixes e informações detalhadas

Para detalhes sobre problemas e correções aplicadas, consulte a pasta [`fixes/`](./fixes/), especialmente o arquivo [`fixes/20250505-errorcode.md`](./fixes/20250505-errorcode.md) para entender o caso do `ErrorCode` e como foi solucionado.

## Documentação oficial (alternativa)

Para mais detalhes, consulte a documentação oficial (em inglês, com opção de tradução automática pelo navegador):

- [Documentação oficial do Model Context Protocol](https://modelcontextprotocol.org/docs)

Ou utilize a tradução automática do Google Chrome ou [este link traduzido](https://modelcontextprotocol.org/docs) para acessar a documentação em português.

## Fontes e Referências

- [Build Your First MCP Server with TypeScript (Hackteam)](https://hackteam.io/blog/build-your-first-mcp-server-with-typescript-in-under-10-minutes/)
- [Copilot Developer Camp](https://microsoft.github.io/copilot-camp/)
- [Model Context Protocol TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- [Playwright MCP](https://github.com/microsoft/playwright-mcp)
- [Introducing Model Context Protocol (MCP) in Copilot Studio: Simplified Integration with AI Apps and Agents (Microsoft Blog)](https://www.microsoft.com/en-us/microsoft-copilot/blog/copilot-studio/introducing-model-context-protocol-mcp-in-copilot-studio-simplified-integration-with-ai-apps-and-agents/)
- [my-first-mcp-server (Yusuke Wada)](https://github.com/yusukebe/my-first-mcp-server)

## About the Author

**Lincoln Lopes** ([GitHub: lincolnlopes](https://github.com/lincolnlopes))

- Developer from Brazil
- Email: lincolnlopes@msn.com
- Main skills: TypeScript, JavaScript, Node.js, .NET, Docker, React, SQL, Git
