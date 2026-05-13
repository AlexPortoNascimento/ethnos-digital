// prisma/seed.js

async function main() {
  console.log('🌱 Preparando dados base...');

  // Criamos apenas os 6 Reinos, que são fixos no tabuleiro
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
      where: { name: k.name }, // Use o nome como chave única se possível no schema
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
}