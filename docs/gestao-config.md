# Registro de Decisões de GCS e Arquitetura: Ethnos CLI

Este documento formaliza as decisões de **Gerência de Configuração de Software (GCS)** e as definições arquiteturais estabelecidas para o projeto, consolidando as estratégias de controle de versões, mudanças e integração.

---

## 1. Identificação e Controle de Versões (Ponto 2.1)
O objetivo desta seção é garantir que todos os itens de configuração (ICs) sejam identificados e organizados de forma lógica.

*   **Estrutura de Diretórios:** O repositório segue a organização rigorosa de pastas:
    *   `/docs`: Documentação de planejamento, requisitos, GCS e diagramas.
    *   `/src/engine`: Classes de domínio, lógica de regras e implementação das tribos (POO).
    *   `/src/database`: Modelagem de dados (Prisma), migrações e persistência SQLite.
    *   `/src/ui`: Interface de linha de comando (CLI) e interações via Inquirer.js.
*   **Baseline Inicial:** Estabelecida através de uma Tag Git (`v0.1.0`) para marcar o estado estável do ambiente de desenvolvimento.

---

## 2. Controle de Modificações (Ponto 2.2)
Toda alteração no projeto deve ser rastreável e justificada por uma necessidade documentada.

*   **Uso de Issues:** Nenhuma alteração de código será realizada sem uma Issue correspondente no GitHub.
*   **Templates de Issue:** Foram configurados modelos obrigatórios para **Nova Funcionalidade** e **Correção de Erros**, exigindo a declaração dos ICs afetados (`engine`, `ui`, `database`).
*   **Rastreabilidade Bidirecional:** Commits e Pull Requests devem referenciar o ID da Issue (ex: `Fixes #10`) para vincular a implementação à sua origem.

---

## 3. Estratégia de Ramificação e Proteção (Ponto 2.3)
A integridade da versão estável do jogo é protegida por regras automáticas de fluxo de trabalho.

*   **Workflow:** Utilização de branches de funcionalidade (`feature/nome-da-task`) para isolar o desenvolvimento.
*   **GitHub Rulesets (Proteção da Main):**
    *   Proibição de `Push` direto na branch `main`.
    *   Bloqueio de `Force Push` para preservar a integridade do histórico.
    *   Obrigatoriedade de **Pull Request (PR)** para toda e qualquer integração de código.
*   **Aprovações:** Configurado para exigir revisão de PR, garantindo que o código atenda aos critérios de aceite antes do merge.

---

## 4. Integração Contínua - CI (Ponto 2.4)
Garante que a baseline só seja atualizada se o novo código for tecnicamente válido.

*   **GitHub Actions:** Configuração do workflow `.github/workflows/ci.yml`.
*   **Gatilho:** Execução automática em cada Pull Request direcionado à `main`.
*   **Passos de Validação:**
    1.  Instalação de dependências (Node.js).
    2.  Validação de schema e geração do cliente Prisma.
    3.  Execução de testes automatizados (unitários e de integridade).
*   **Bloqueio de Merge:** O merge na `main` fica condicionado ao sucesso do status check do CI.

---

## 5. Escopo Técnico e Arquitetura
Decisões sobre a natureza do software e padrões de implementação.

*   **Plataforma:** Software de terminal (CLI), jogado localmente.
*   **Stack Tecnológica:** Node.js, Inquirer.js (Interface) e Prisma/SQLite (Persistência).
*   **Paradigma:** **Programação Orientada a Objetos (POO)**.
    *   **Polimorfismo:** Uso de interfaces/classes abstratas para as habilidades das tribos.
    *   **Encapsulamento:** Regras de negócio protegidas em classes especialistas (ex: `MoveValidator`, `ScoreCalculator`).
    *   **Injeção de Dependência:** Separação entre classes de UI, Lógica (Engine) e Repositórios de Dados.

---
**Data de Aprovação:** 04 de Maio de 2026
**Responsável:** Alexandre Porto