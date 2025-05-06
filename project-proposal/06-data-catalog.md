# Projeto: Catálogo de Dados Empresariais com MCP

## Visão Geral
Desenvolver um servidor MCP que expõe metadados de bases de dados, planilhas e APIs internas, permitindo buscas, visualização de esquemas e até consultas SQL seguras. O objetivo é centralizar o conhecimento sobre os dados da empresa e facilitar o acesso controlado.

## Objetivos
- Centralizar a documentação e o acesso a fontes de dados.
- Permitir buscas rápidas por tabelas, colunas e descrições.
- Oferecer visualização de esquemas e exemplos de dados.
- Possibilitar consultas SQL seguras e auditáveis.

## Funcionalidades
- Exposição de metadados via MCP (ex: `data://db/tabela`, `data://sheet/aba1`).
- Busca por nome, tipo, descrição e relacionamento.
- Visualização de esquemas e amostras de dados.
- Execução de queries SQL com controle de permissões.
- Logs de acesso e auditoria.

## Público-alvo
- Engenheiros e analistas de dados.
- Equipes de BI e governança de dados.
- Desenvolvedores de integrações.

## Benefícios
- Redução do tempo para encontrar e entender dados.
- Menos dependência de especialistas para dúvidas recorrentes.
- Acesso controlado e auditável.

## Tecnologias sugeridas
- Node.js + TypeScript
- SDK MCP
- Conectores para bancos de dados (PostgreSQL, MySQL, etc) e planilhas (Google Sheets, Excel)

## MVP sugerido
- Expor via MCP o esquema de pelo menos um banco de dados.
- Permitir busca por tabelas e visualização de colunas.

## Possíveis extensões
- Suporte a múltiplas fontes e tipos de dados.
- Interface web para navegação e busca.
- Integração com ferramentas de BI e ETL. 