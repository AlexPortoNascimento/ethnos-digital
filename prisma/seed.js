// prisma/seed.js
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Preparando dados base...');

  // 1. Criamos os 6 Reinos fixos no tabuleiro
  const kingdomData = [
    { name: 'GIANT', glory1: 1, glory2: 3, glory3: 6 },
    { name: 'WIZARD', glory1: 1, glory2: 3, glory3: 6 },
    { name: 'TROLL', glory1: 2, glory2: 4, glory3: 8 },
    { name: 'ORC', glory1: 2, glory2: 4, glory3: 8 },
    { name: 'DWARVE', glory1: 3, glory2: 5, glory3: 10 },
    { name: 'ELF', glory1: 3, glory2: 5, glory3: 10 },
  ];

  for (const k of kingdomData) {
    await prisma.kingdom.upsert({
      where: { name: k.name },
      update: {},
      create: {
        name: k.name,
        gloryAge1: k.glory1,
        gloryAge2: k.glory2,
        gloryAge3: k.glory3,
      }
    });
  }
  console.log('✅ Reinos base prontos.');

  console.log('🃏 Gerando baralho de cartas...');

  // 2. Limpa as cartas anteriores para evitar duplicações ao rodar o seed mais de uma vez
  await prisma.card.deleteMany({});

  // As cores correspondem aos nomes dos reinos configurados no jogo
  const CORES = ['GIANT', 'WIZARD', 'TROLL', 'ORC', 'DWARVE', 'ELF'];
  
  // Lista das tribos que estarão ativas nesta versão do jogo
  const TRIBOS_ATIVAS = ['GIANT', 'WIZARD', 'TROLL', 'ORC', 'DWARVE', 'ELF'];

  const cardsToCreate = [];

  // 3. Gerar as cartas das Tribos (2 cartas de cada cor para cada tribo)
  for (const tribe of TRIBOS_ATIVAS) {
    for (const color of CORES) {
      cardsToCreate.push({ tribe, color, isDragon: false });
      cardsToCreate.push({ tribe, color, isDragon: false });
    }
  }

  // 4. Gerar exatamente os 9 Dragões (3 para cada uma das 3 Eras)
  // Dragões não pertencem a nenhuma cor/reino específico, então usamos 'NONE'
  for (let i = 0; i < 9; i++) {
    cardsToCreate.push({ tribe: 'DRAGON', color: 'NONE', isDragon: true });
  }

  // 5. Salva em lote (Bulk Create) no banco de dados através do Prisma
  await prisma.card.createMany({
    data: cardsToCreate,
  });

  console.log(`✅ Baralho populado com sucesso! ${cardsToCreate.length} cartas criadas (${cardsToCreate.length - 9} cartas de tribo e 9 dragões).`);
}

main()
  .catch((e) => {
    console.error('❌ Erro ao rodar o seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });