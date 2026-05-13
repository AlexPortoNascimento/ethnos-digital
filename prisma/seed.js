// prisma/seed.js
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Preparando dados base...');
  console.log('🃏 Gerando baralho de cartas global...');

  // 1. Limpa as cartas anteriores para evitar duplicações
  await prisma.card.deleteMany({});

  // As cores correspondem aos nomes dos reinos configurados no jogo
  const CORES = ['GIANT', 'WIZARD', 'TROLL', 'SKELETON', 'DWARVE', 'ELF'];
  
  // Lista das tribos que estarão ativas nesta versão do jogo
  const TRIBOS_ATIVAS = ['GIANT', 'WIZARD', 'TROLL', 'SKELETON', 'DWARVE', 'ELF'];

  const cardsToCreate = [];

  // 2. Gerar as cartas das Tribos (2 cartas de cada cor para cada tribo)
  for (const tribe of TRIBOS_ATIVAS) {
    for (const color of CORES) {
      cardsToCreate.push({ tribe, color, isDragon: false });
      cardsToCreate.push({ tribe, color, isDragon: false });
    }
  }

  // 3. Gerar exatamente os 9 Dragões (3 para cada uma das 3 Eras)
  for (let i = 0; i < 9; i++) {
    cardsToCreate.push({ tribe: 'DRAGON', color: 'NONE', isDragon: true });
  }

  // 4. Salva em lote (Bulk Create) no banco de dados através do Prisma
  await prisma.card.createMany({
    data: cardsToCreate,
  });

  console.log(`✅ Baralho populado com sucesso! ${cardsToCreate.length} cartas criadas.`);
}

main()
  .catch((e) => {
    console.error('❌ Erro ao rodar o seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });