# Correção: Ajuste de paths no tsconfig para projetos MCP

Durante a configuração do projeto, foi identificado um problema ao importar módulos internos usando aliases definidos no `tsconfig.json`:

```
Cannot find module '@/utils/logger' or its corresponding type declarations.
```

## Motivo do erro
O TypeScript não resolve automaticamente os aliases definidos em `tsconfig.json` durante a execução do Node.js, pois esses aliases são apenas para o compilador. Isso pode causar erros ao rodar o código ou ao usar ferramentas como o Jest.

## Como identificar o problema
Ao tentar importar um módulo usando um alias, o erro acima aparece no terminal ou no editor, indicando que o caminho não foi resolvido.

## Solução aplicada
Para resolver, foi instalada a dependência `tsconfig-paths` e ajustado o comando de execução no `package.json`:

```sh
npm install tsconfig-paths --save-dev
```

No `package.json`, altere o script de start para:

```json
"start": "ts-node -r tsconfig-paths/register src/index.ts"
```

## Por que isso funciona?
O pacote `tsconfig-paths` lê as configurações de paths do `tsconfig.json` e faz o mapeamento correto dos aliases em tempo de execução, permitindo que o Node.js encontre os módulos corretamente.

## Resultado
Após a alteração, os imports com aliases passaram a funcionar normalmente:

```ts
import logger from '@/utils/logger';
```

Assim, o projeto pode usar aliases definidos no `tsconfig.json` tanto em tempo de desenvolvimento quanto de execução, sem erros de resolução de módulos. 