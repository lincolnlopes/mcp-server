# Correção: GitHub não reconhece o projeto como TypeScript

Durante a publicação do repositório, foi observado que o GitHub classificava o projeto como JavaScript, mesmo sendo desenvolvido majoritariamente em TypeScript.

## Motivo do erro
O GitHub utiliza a ferramenta Linguist para detectar a linguagem principal do repositório. Se o projeto contém arquivos JavaScript gerados (por exemplo, na pasta `build` ou `dist`), ou se há poucos arquivos `.ts` na raiz, o Linguist pode identificar incorretamente a linguagem predominante.

## Como identificar o problema
Na página principal do repositório, o badge de linguagem mostra "JavaScript" ao invés de "TypeScript".

## Solução aplicada
Para corrigir, foi criado um arquivo `.gitattributes` na raiz do projeto com o seguinte conteúdo:

```
*.ts linguist-language=TypeScript
build/* linguist-vendored
```

- A primeira linha força o Linguist a considerar arquivos `.ts` como TypeScript.
- A segunda linha marca a pasta `build` como "vendored" (código gerado), fazendo com que ela não seja considerada na análise da linguagem principal.

## Resultado
Após o commit do arquivo `.gitattributes`, o GitHub passou a reconhecer corretamente o projeto como TypeScript.

Essa abordagem pode ser adaptada para outros cenários, ajustando os padrões conforme a estrutura do projeto. 