# Guia de Versionamento de Endpoints no MCP Dynamic Docs

## Visão Geral

O sistema de versionamento de endpoints no MCP Dynamic Docs oferece um mecanismo avançado para gerenciar diferentes versões de documentação de API, com suporte a versionamento semântico e estratégias flexíveis de mudança.

## Tipos de Mudança

### Classificação de Versões

1. **Patch (v1.0.X)**
   - Correções pequenas
   - Sem alterações de funcionalidade
   - Compatibilidade total mantida
   - Exemplos: 
     - Correções de texto
     - Ajustes menores em descrições
     - Pequenas melhorias de documentação

2. **Minor (v1.X.0)**
   - Novas funcionalidades
   - Compatível com versões anteriores
   - Adição de recursos sem quebrar API
   - Exemplos:
     - Novos snippets de código
     - Adição de parâmetros opcionais
     - Expansão de descrições

3. **Major (X.0.0)**
   - Mudanças significativas
   - Possível quebra de compatibilidade
   - Alterações estruturais importantes
   - Exemplos:
     - Mudança de método HTTP
     - Alteração de parâmetros obrigatórios
     - Reestruturação completa do endpoint

## Funcionalidades Principais

### 1. Criação de Versões

```typescript
// Criação automática de versão
server.tool("dynamic-docs", {
  versionAction: "create",
  versionEndpoint: "/api/v1/users",
  versionNotes: "Adicionado novo parâmetro de filtro"
})

// Forçar tipo de mudança
server.tool("dynamic-docs", {
  versionAction: "create",
  versionEndpoint: "/api/v1/users",
  changeType: "major",  // Força versão major
  versionNotes: "Alteração significativa na estrutura"
})
```

### 2. Comparação de Versões

```typescript
// Comparar duas versões de endpoint
server.tool("dynamic-docs", {
  versionAction: "compare",
  versionEndpoint: "/api/v1/users",
  targetVersion: "1.0.0",
  compareVersion: "1.1.0"
})
```

### 3. Listagem de Versões

```typescript
// Listar todas as versões
server.tool("dynamic-docs", {
  versionAction: "list"
})

// Listar versões de um endpoint específico
server.tool("dynamic-docs", {
  versionAction: "list-versions",
  versionEndpoint: "/api/v1/users"
})
```

### 4. Rollback de Versão

```typescript
// Reverter para versão anterior
server.tool("dynamic-docs", {
  versionAction: "rollback",
  versionEndpoint: "/api/v1/users",
  targetVersion: "1.0.1"
})
```

## Estratégia de Determinação Automática

### Regras de Incremento

A determinação do tipo de mudança é feita automaticamente com base em comparações entre versões:

1. **Mudança Major**: 
   - Alteração de método HTTP
   - Modificação de parâmetros obrigatórios
   - Mudanças que quebram compatibilidade

2. **Mudança Minor**:
   - Adição de novos parâmetros opcionais
   - Alteração de descrições
   - Inclusão de novos snippets de código
   - Modificações que não afetam a funcionalidade principal

3. **Mudança Patch**:
   - Correções de texto
   - Ajustes menores
   - Sem impacto na funcionalidade ou estrutura

## Boas Práticas

- Documente sempre as mudanças no campo `versionNotes`
- Use versionamento semântico para comunicar claramente o impacto das alterações
- Mantenha compatibilidade sempre que possível
- Forneça endpoints alternativos em caso de deprecation

## Exemplo Completo de Versionamento

```typescript
// Fluxo completo de versionamento de um endpoint
server.tool("dynamic-docs", {
  versionAction: "create",
  versionEndpoint: "/api/v1/users",
  changeType: "minor",
  versionNotes: "Adicionado suporte a filtro por grupo de usuários",
  newEndpoint: {
    endpoint: "/api/v1/users",
    method: "GET",
    description: "Lista usuários com suporte a filtros avançados",
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

## Considerações Finais

O sistema de versionamento do MCP Dynamic Docs foi projetado para ser:
- Flexível
- Automatizado
- Fácil de usar
- Transparente

Ele ajuda equipes a gerenciarem a evolução de suas APIs de forma controlada e previsível. 