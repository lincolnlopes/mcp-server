# MCP Dynamic Docs 📘

## Descrição do Projeto

MCP Dynamic Docs é uma solução avançada para documentação dinâmica de APIs, projetada com princípios SOLID para máxima flexibilidade e manutenibilidade.

## 🚀 Recursos Principais

- **Documentação Dinâmica**: Geração automática e flexível de documentação de API
- **Versionamento Semântico**: Controle preciso de mudanças de endpoint
- **Gerenciamento de Deprecation**: Rastreamento e comunicação de endpoints obsoletos
- **Arquitetura Modular**: Implementação seguindo princípios SOLID

## 🏗️ Arquitetura

### Componentes Principais

1. **Interfaces** (`@interfaces`)
   - Definições de tipos e contratos
   - Desacoplamento de implementações

2. **Repositório** (`@repositories`)
   - Persistência de dados com SQLite
   - Abstração de operações de banco de dados

3. **Serviços** (`@services`)
   - Lógica de negócio
   - Orquestração entre repositório e validadores

4. **Utilitários** (`@utils`)
   - Validadores
   - Funções auxiliares

## 📦 Instalação

```bash
# Clonar o repositório
git clone https://github.com/seu-usuario/mcp-dynamic-docs.git
cd mcp-dynamic-docs

# Instalar dependências
npm install

# Compilar o projeto
npm run build

# Iniciar o servidor
npm start
```

## 🧪 Testes

```bash
# Executar testes
npm test

# Verificar cobertura de testes
npm run test:coverage
```

## 🔍 Exemplo de Uso

```typescript
import { DocumentationServiceImpl } from './services/documentation.service';
import { SqliteEndpointRepository } from './repositories/sqlite-endpoint.repository';
import { EndpointValidatorImpl } from './utils/endpoint-validator';

const repository = new SqliteEndpointRepository();
const validator = new EndpointValidatorImpl();
const docService = new DocumentationServiceImpl(repository, validator);

// Criar um novo endpoint
await docService.createEndpoint({
  endpoint: '/api/v1/produtos',
  method: 'GET',
  description: 'Listar produtos disponíveis'
});

// Versionar o endpoint
const newVersion = await docService.versionEndpoint('/api/v1/produtos');

// Deprecar um endpoint antigo
await docService.deprecateEndpoint('/api/v1/produtos-legado', {
  reason: 'Substituído por nova versão',
  removalDate: '2024-12-31'
});
```

## 🌟 Princípios SOLID Aplicados

- **S**ingle Responsibility: Cada classe tem uma única responsabilidade
- **O**pen/Closed: Extensível sem modificação
- **L**iskov Substitution: Interfaces garantem comportamento consistente
- **I**nterface Segregation: Interfaces específicas e enxutas
- **D**ependency Inversion: Dependências abstratas, não concretas

## 🔧 Configurações

- TypeScript
- ESLint para qualidade de código
- Jest para testes
- Suporte a múltiplas linguagens

## 🚧 Próximos Passos

- [ ] Adicionar mais testes unitários
- [ ] Implementar geração de documentação em diferentes formatos
- [ ] Criar CLI para gerenciamento de documentação
- [ ] Adicionar suporte a autenticação de API

## 📄 Licença

MIT License

## 👥 Contribuições

Contribuições são bem-vindas! Por favor, leia nossas diretrizes de contribuição.

**Autor**: Lincoln Lopes
**Versão**: 1.0.0

## Referências

- [Model Context Protocol TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- [Documentação Oficial do MCP](https://modelcontextprotocol.org/docs)
