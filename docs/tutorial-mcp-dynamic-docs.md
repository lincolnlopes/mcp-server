# Guia Completo: Documentação Dinâmica de API com MCP Dynamic Docs

## Introdução

No mundo em constante evolução do desenvolvimento de software, gerenciar a documentação de APIs de forma eficiente e flexível é um desafio crucial. O MCP Dynamic Docs surge como uma solução inovadora para este problema, oferecendo uma abordagem moderna e automatizada para documentação de APIs.

## Cenário: Sistema de Gerenciamento de E-commerce

Vamos criar um exemplo prático de como usar o MCP Dynamic Docs para documentar uma API de e-commerce, demonstrando todo o potencial da ferramenta.

### 1. Configuração Inicial

#### Instalação das Dependências
```bash
# Clonar o repositório
git clone https://github.com/seu-usuario/mcp-dynamic-docs.git
cd mcp-dynamic-docs

# Instalar dependências
npm install
npm run build
npm start
```

### 2. Criação do Primeiro Endpoint: Produtos

#### Adicionando o Endpoint de Produtos
```typescript
server.tool("dynamic-docs", {
  action: "create",
  newEndpoint: {
    endpoint: "/api/v1/produtos",
    method: "GET",
    description: "Lista todos os produtos disponíveis no e-commerce",
    group: "Produtos",
    parameters: [
      { 
        name: "categoria", 
        type: "string", 
        required: false, 
        description: "Filtrar produtos por categoria" 
      },
      { 
        name: "preco_maximo", 
        type: "number", 
        required: false, 
        description: "Filtrar produtos com preço até o valor especificado" 
      }
    ],
    exampleRequest: "GET /api/v1/produtos?categoria=eletronicos&preco_maximo=1000",
    exampleResponse: JSON.stringify({
      produtos: [
        { 
          id: 1, 
          nome: "Smartphone X", 
          categoria: "Eletrônicos", 
          preco: 899.99 
        },
        { 
          id: 2, 
          nome: "Tablet Y", 
          categoria: "Eletrônicos", 
          preco: 599.99 
        }
      ]
    }, null, 2),
    snippets: {
      python: `
# Buscar produtos de eletrônicos até R$ 1000
import requests

url = 'http://localhost:3000/api/v1/produtos'
params = {
    'categoria': 'eletronicos',
    'preco_maximo': 1000
}

response = requests.get(url, params=params)
produtos = response.json()
print(produtos)
      `,
      javascript: `
// Buscar produtos usando Fetch API
fetch('/api/v1/produtos?categoria=eletronicos&preco_maximo=1000')
  .then(response => response.json())
  .then(data => {
    console.log('Produtos encontrados:', data.produtos);
  })
  .catch(error => {
    console.error('Erro ao buscar produtos:', error);
  });
      `,
      curl: `
# Exemplo de requisição usando cURL
curl "http://localhost:3000/api/v1/produtos?categoria=eletronicos&preco_maximo=1000"
      `
    }
  }
})
```

### 3. Versionamento do Endpoint

#### Criando a Primeira Versão Evolutiva
```typescript
server.tool("dynamic-docs", {
  versionAction: "create",
  versionEndpoint: "/api/v1/produtos",
  changeType: "minor",
  versionNotes: "Adicionado campo de estoque e avaliação média",
  newEndpoint: {
    endpoint: "/api/v1/produtos",
    method: "GET",
    description: "Lista produtos com informações adicionais de estoque e avaliação",
    parameters: [
      { 
        name: "categoria", 
        type: "string", 
        required: false 
      },
      { 
        name: "preco_maximo", 
        type: "number", 
        required: false 
      },
      { 
        name: "em_estoque", 
        type: "boolean", 
        required: false, 
        description: "Filtrar apenas produtos em estoque" 
      }
    ],
    exampleResponse: JSON.stringify({
      produtos: [
        { 
          id: 1, 
          nome: "Smartphone X", 
          categoria: "Eletrônicos", 
          preco: 899.99,
          estoque: 50,
          avaliacao_media: 4.5
        }
      ]
    }, null, 2)
  }
})
```

#### Comparando Versões
```typescript
server.tool("dynamic-docs", {
  versionAction: "compare",
  versionEndpoint: "/api/v1/produtos",
  targetVersion: "1.0.0",
  compareVersion: "1.1.0"
})
```

### 4. Deprecation de Endpoint Antigo

#### Marcando Endpoint como Deprecated
```typescript
server.tool("dynamic-docs", {
  deprecationAction: "deprecate",
  deprecationEndpoint: "/api/v1/produtos-legado",
  removalDate: "2024-12-31",
  alternativeEndpoint: "/api/v1/produtos",
  deprecationReason: "Endpoint substituído por versão com mais informações"
})
```

### 5. Adicionando Endpoint de Pedidos

```typescript
server.tool("dynamic-docs", {
  action: "create",
  newEndpoint: {
    endpoint: "/api/v1/pedidos",
    method: "POST",
    description: "Criar um novo pedido no sistema de e-commerce",
    group: "Pedidos",
    parameters: [
      { 
        name: "produtos", 
        type: "array", 
        required: true, 
        description: "Lista de produtos no pedido" 
      },
      { 
        name: "cliente_id", 
        type: "number", 
        required: true, 
        description: "ID do cliente que está fazendo o pedido" 
      }
    ],
    exampleRequest: JSON.stringify({
      cliente_id: 123,
      produtos: [
        { produto_id: 1, quantidade: 2 },
        { produto_id: 2, quantidade: 1 }
      ]
    }, null, 2),
    exampleResponse: JSON.stringify({
      pedido_id: 456,
      status: "processando",
      total: 2399.97
    }, null, 2),
    snippets: {
      python: `
# Criar pedido usando Python
import requests

url = 'http://localhost:3000/api/v1/pedidos'
dados_pedido = {
    'cliente_id': 123,
    'produtos': [
        {'produto_id': 1, 'quantidade': 2},
        {'produto_id': 2, 'quantidade': 1}
    ]
}

response = requests.post(url, json=dados_pedido)
resultado = response.json()
print('Pedido criado:', resultado)
      `,
      javascript: `
// Criar pedido usando Fetch API
fetch('/api/v1/pedidos', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    cliente_id: 123,
    produtos: [
      { produto_id: 1, quantidade: 2 },
      { produto_id: 2, quantidade: 1 }
    ]
  })
})
.then(response => response.json())
.then(data => {
  console.log('Pedido criado:', data);
})
.catch(error => {
  console.error('Erro ao criar pedido:', error);
});
      `
    }
  }
})
```

## Benefícios do MCP Dynamic Docs

### 1. Documentação Flexível
- Suporte a múltiplos formatos de saída (JSON, Markdown, HTML)
- Geração automática de documentação
- Internacionalização

### 2. Versionamento Semântico
- Controle preciso de mudanças
- Comunicação clara de impacto de atualizações
- Histórico detalhado de evoluções

### 3. Gerenciamento de Deprecation
- Rastreamento de endpoints obsoletos
- Comunicação clara de alternativas
- Planejamento de remoção

## Melhores Práticas

1. **Documentação Consistente**
   - Sempre forneça descrições claras
   - Inclua exemplos de requisição e resposta
   - Adicione snippets em múltiplas linguagens

2. **Versionamento Responsável**
   - Use mudanças semânticas corretamente
   - Documente cada alteração
   - Mantenha compatibilidade quando possível

3. **Comunicação de Mudanças**
   - Use `versionNotes` para explicar alterações
   - Marque endpoints deprecated com antecedência
   - Forneça endpoints alternativos

## Conclusão

O MCP Dynamic Docs revoluciona a forma como documentamos e gerenciamos APIs. Combinando flexibilidade, automação e clareza, a ferramenta permite que equipes de desenvolvimento mantenham documentações sempre atualizadas e compreensíveis.

## Próximos Passos

- Implementar testes automatizados
- Adicionar suporte a mais linguagens de programação
- Integrar com ferramentas de geração de documentação
- Expandir validações e recursos de documentação

## Referências

- [Documentação Oficial do MCP](https://modelcontextprotocol.org/docs)
- [Repositório do Projeto](https://github.com/seu-usuario/mcp-dynamic-docs)
- [MCP Inspector](https://inspector.modelcontextprotocol.org/)

**Autor**: Lincoln Lopes
**Última Atualização**: [Data Atual]

## TSConfig Paths

Adicionado suporte a aliases de paths no `tsconfig.json`. Para resolver o problema de resolução de paths, a dependência `tsconfig-paths` foi instalada e o comando de execução no `package.json` foi ajustado:

```sh
npm install tsconfig-paths --save-dev
```

No `package.json`, altere o script de start para:

```json
"start": "ts-node -r tsconfig-paths/register src/index.ts"
```

Veja mais em [20250506-tsconfig-paths.md](fixes/20250506-tsconfig-paths.md).

## ErrorCode

Corrigido o uso do `ErrorCode` no SDK MCP. O valor `ErrorCode.ToolNotFound` foi substituído por `ErrorCode.MethodNotFound` para evitar erros de compilação e garantir compatibilidade com o SDK.

Veja mais em [20250505-errorcode.md](fixes/20250505-errorcode.md). 