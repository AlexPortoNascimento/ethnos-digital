# Ethnos Digital

Este projeto é uma implementação para terminal (CLI) do jogo de tabuleiro **Ethnos**, desenvolvido como trabalho acadêmico para a disciplina de **Gerência de Projeto e Manutenção de Software (TCC00363)** - UFF Niterói.

---

## Pré-requisitos

Antes de iniciar, certifique-se de ter instalado:

- **Node.js** (versão 18 ou superior)
- **npm** (gerenciador de pacotes do Node)
- **Git**

---

## Preparação do Ambiente

Siga os passos abaixo para configurar o projeto localmente:

### 1. Clonar o repositório

```bash
git clone https://github.com/seu-usuario/ethnos-digital.git
cd ethnos-digital
```

### 2. Executar o Setup Automatizado

Este comando instala as dependências, configura os hooks do Git (Husky) e prepara o banco de dados SQLite com as tabelas e dados iniciais.

```bash
npm run setup
```

### 3. Banco de Dados

O projeto utiliza Prisma com SQLite. O banco de dados é persistente e salvo no arquivo `prisma/dev.db`.

#### Resetar o Banco

Para limpar todos os dados de partidas anteriores e reiniciar o estado do jogo (rodar o seed), utilize:

```bash
npm run db:reset
```

#### Visualizar Dados

Para abrir o navegador e gerenciar as tabelas de forma visual:

```bash
npx prisma studio
```

### 4. Como Jogar

Após concluir o setup, inicie a aplicação com o comando:

```bash
npm start
```

---

## 5. Tecnologias e Ferramentas

- Runtime: Node.js (Configurado como ES Modules)
- ORM: Prisma (Interface para o SQLite)
- CLI UI: Inquirer.js, Chalk, Boxen e Cli-table3
- Qualidade: Husky (Git Hooks para padronização de commits)

---

## 6. Estrutura de Arquivos (Prisma)

- `prisma/schema.prisma`: Definição das tabelas e relacionamentos do jogo.
- `prisma/seed.js`: Script que popula o banco com as configurações iniciais (Reinos, Glórias, etc).
- `prisma/migrations/`: Histórico de versões da estrutura do banco.

---

> Importante: Este projeto é uma versão simplificada para fins educacionais. Não inclui as tribos Merfolks ou Orcs.

> Os documentos referentes ao monitoramento do projeto e os slides da apresentação estão disponíveis na pasta `/docs`

---

2026.1 - Universidade Federal Fluminense

## Integrante

- Alexandre Nascimento
