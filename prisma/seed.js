import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando Seed...');

  // 1. Criar ou Resetar o Estado Global
  // Usamos upsert para garantir que o jogo de ID 1 exista
  const game = await prisma.gameState.upsert({
    where: { id: 1 },
    update: {
        currentAge: 1,
        dragonsFound: 0,
        gameStarted: true,
        activeTribes: 'GIANT,WIZARD,TROLL,SKELETON,ELF,ORC'
    },
    create: {
      id: 1,
      currentAge: 1,
      dragonsFound: 0,
      currentPlayerId: 1,
      gameStarted: true,
      activeTribes: 'GIANT,WIZARD,TROLL,SKELETON,ELF,ORC'
    },
  });

  // 2. Criar os Jogadores vinculados ao jogo 1
  await prisma.player.upsert({
    where: { id: 1 },
    update: { gameStateId: 1 },
    create: { id: 1, name: 'Jogador 1', points: 0, isBot: false, gameStateId: 1 }
  });

  await prisma.player.upsert({
    where: { id: 2 },
    update: { gameStateId: 1 },
    create: { id: 2, name: 'Jogador 2', points: 0, isBot: false, gameStateId: 1 }
  });

  // 3. Criar os 6 Reinos vinculados ao jogo 1
  const kingdomData = [
    { name: 'Red', glory1: 1, glory2: 3, glory3: 6 },
    { name: 'Blue', glory1: 1, glory2: 3, glory3: 6 },
    { name: 'Green', glory1: 2, glory2: 4, glory3: 8 },
    { name: 'Yellow', glory1: 2, glory2: 4, glory3: 8 },
    { name: 'Purple', glory1: 3, glory2: 5, glory3: 10 },
    { name: 'Orange', glory1: 3, glory2: 5, glory3: 10 },
  ];

  for (let i = 0; i < kingdomData.length; i++) {
    const k = kingdomData[i];
    await prisma.kingdom.upsert({
      where: { id: i + 1 },
      update: { gameStateId: 1 },
      create: {
        id: i + 1,
        name: k.name,
        gloryAge1: k.glory1,
        gloryAge2: k.glory2,
        gloryAge3: k.glory3,
        gameStateId: 1
      }
    });
  }

  // 4. Criar o Baralho (Cards) vinculado ao jogo 1
  await prisma.card.deleteMany({}); // Limpa cartas antigas

  const tribes = (game.activeTribes || '').split(',').filter(t => t !== '');
  const colors = ['RED', 'BLUE', 'GREEN', 'YELLOW', 'PURPLE', 'ORANGE'];
  
  let cardsToCreate = [];

  // Criar cartas das tribos
  for (const tribe of tribes) {
    for (const color of colors) {
      cardsToCreate.push({
        tribe,
        color,
        isDragon: false,
        location: 'DECK',
        gameStateId: 1 // VINCULO AQUI
      });
    }
  }

  // Adicionar os 3 Dragões
  for (let i = 0; i < 3; i++) {
    cardsToCreate.push({
      tribe: 'DRAGON',
      color: 'NONE',
      isDragon: true,
      location: 'DECK',
      gameStateId: 1 // VINCULO AQUI
    });
  }

  await prisma.card.createMany({
    data: cardsToCreate
  });

  console.log('✅ Seed finalizado com sucesso! Jogadores, Reinos e Cartas vinculados ao GameState 1.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });