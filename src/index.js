import { PrismaClient } from '@prisma/client';
import { GameRepository } from './database/game.repository.js';
import { DeckService } from './engine/deck.service.js';
import { MoveValidator } from './engine/move.validator.js';
import { ScoreCalculator } from './engine/score.calculator.js';
import { GameEngine } from './engine/game.engine.js';

async function main() {
  const prisma = new PrismaClient();

  // Inicializa as camadas
  const repository = new GameRepository(prisma);
  const deckService = new DeckService(prisma);
  const validator = new MoveValidator();
  const scoreCalculator = new ScoreCalculator();

  // Injeta as dependências no motor principal
  const engine = new GameEngine(prisma, deckService, validator, scoreCalculator);

  // Agora o motor está pronto para rodar!
  await engine.initGame(1);

  if (engine.state.currentAge === 1 && engine.state.dragonsFound === 0) {
    await engine.startNewAge();
  }

  const ui = new TerminalUI(engine);
  await ui.start();
}

main().catch(console.error);