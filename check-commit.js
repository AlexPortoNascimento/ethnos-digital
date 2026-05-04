import fs from 'fs';

const mensagem = fs.readFileSync(process.argv[2], 'utf8').trim();
// Regex para validar o formato "Número.Número Espaço Descrição"
const commitRegex = /^\d+\.\d+\s.+/;

if (!commitRegex.test(mensagem)) {
  console.error(
    `\n Erro: O padrão do commit está incorreto! \n` +
    ` Use o formato: "x.x Descrição", onde o número colocado é o número da tarefa definida no planning poker (Ex: "2.1 Configuração Inicial") \n`
  );
  process.exit(1);
}