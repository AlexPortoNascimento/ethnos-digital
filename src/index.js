import { PrismaClient } from '@prisma/client';
import { GameRepository } from './database/game.repository.js';
import { DeckService } from './engine/deck.service.js';
import { MoveValidator } from './engine/move.validator.js';
import { ScoreCalculator } from './engine/score.calculator.js';
import { GameEngine } from './engine/game.engine.js';
import { TerminalUI } from './ui/TerminalUI.js';

async function main() {
  const prisma = new PrismaClient();

  // Inicializa as camadas
  const repository = new GameRepository(prisma);
  const deckService = new DeckService(prisma);
  const validator = new MoveValidator();
  const scoreCalculator = new ScoreCalculator();

  // Injeta as dependências no motor principal
  const engine = new GameEngine(prisma, deckService, validator, scoreCalculator);
  const ui = new TerminalUI(engine);

  await ui.start();
}

main().catch(console.error);