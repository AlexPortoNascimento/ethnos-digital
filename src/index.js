import { PrismaClient } from '@prisma/client';
import { GameRepository } from './database/game.repository.js';
import { DeckService } from './engine/deck.service.js';
import { MoveValidator } from './engine/move.validator.js';
import { GameEngine } from './engine/game.engine.js';

const prisma = new PrismaClient();

// Inicializa as camadas
const repository = new GameRepository(prisma);
const deckService = new DeckService(prisma);
const validator = new MoveValidator();
const scoreCalculator = new ScoreCalculator();

// Injeta as dependências no motor principal
const engine = new GameEngine(prisma, deckService, validator, scoreCalculator);

// Agora o motor está pronto para rodar!
await engine.initGame('id-do-save-01');

//Teste
console.log("Ethnos CLI iniciado!")
console.log("Versão 1.0")