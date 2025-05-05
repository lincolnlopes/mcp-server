# Correção: Uso do ErrorCode no SDK MCP

Durante o desenvolvimento, foi encontrado o seguinte erro ao lançar exceções usando o SDK MCP:

```
Property 'ToolNotFound' does not exist on type 'typeof ErrorCode'.
```

## Motivo do erro
O enum `ErrorCode` do SDK não possui a propriedade `ToolNotFound`. Os valores válidos disponíveis são:
- `ConnectionClosed`
- `RequestTimeout`
- `ParseError`
- `InvalidRequest`
- `MethodNotFound`
- `InvalidParams`
- `InternalError`

## Como descobrimos os valores válidos do ErrorCode
Para garantir quais valores realmente existiam no enum `ErrorCode` exportado pelo SDK, foi utilizado o seguinte comando no terminal:

```sh
node -e "import('@modelcontextprotocol/sdk/types.js').then(({ErrorCode}) => console.log(Object.keys(ErrorCode)))"
```

### O que esse comando faz?
- `node -e` executa um código JavaScript diretamente no terminal.
- `import('@modelcontextprotocol/sdk/types.js')` faz a importação dinâmica do módulo de tipos do SDK.
- `.then(({ErrorCode}) => console.log(Object.keys(ErrorCode)))` pega o objeto `ErrorCode` e imprime todas as suas chaves (nomes das propriedades).

### Por que isso foi feito?
Esse comando foi usado para inspecionar dinamicamente o que o SDK realmente exporta, ajudando a evitar erros de digitação ou suposições incorretas sobre o enum. Isso é muito útil quando a documentação não está clara ou o autocomplete do editor não mostra todas as opções.

### Resultado do comando
O comando mostrou que os únicos valores válidos eram:
- `ConnectionClosed`
- `RequestTimeout`
- `ParseError`
- `InvalidRequest`
- `MethodNotFound`
- `InvalidParams`
- `InternalError`

## Correção aplicada
Para corrigir, foi substituído:
```ts
throw new McpError(ErrorCode.ToolNotFound, "Tool not found");
```
por:
```ts
throw new McpError(ErrorCode.MethodNotFound, "Tool not found");
```

Assim, o código utiliza um valor válido do enum `ErrorCode`, evitando erros de compilação e garantindo compatibilidade com o SDK. 