-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Card" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "tribe" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "isDragon" BOOLEAN NOT NULL DEFAULT false,
    "location" TEXT NOT NULL DEFAULT 'DECK',
    "order" INTEGER,
    "gameStateId" INTEGER,
    "ownerId" INTEGER,
    "bandId" INTEGER,
    CONSTRAINT "Card_gameStateId_fkey" FOREIGN KEY ("gameStateId") REFERENCES "GameState" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Card_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "Player" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Card_bandId_fkey" FOREIGN KEY ("bandId") REFERENCES "Band" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Card" ("bandId", "color", "id", "isDragon", "location", "order", "ownerId", "tribe") SELECT "bandId", "color", "id", "isDragon", "location", "order", "ownerId", "tribe" FROM "Card";
DROP TABLE "Card";
ALTER TABLE "new_Card" RENAME TO "Card";
CREATE TABLE "new_Kingdom" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "gloryAge1" INTEGER NOT NULL,
    "gloryAge2" INTEGER NOT NULL,
    "gloryAge3" INTEGER NOT NULL,
    "gameStateId" INTEGER,
    CONSTRAINT "Kingdom_gameStateId_fkey" FOREIGN KEY ("gameStateId") REFERENCES "GameState" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Kingdom" ("gloryAge1", "gloryAge2", "gloryAge3", "id", "name") SELECT "gloryAge1", "gloryAge2", "gloryAge3", "id", "name" FROM "Kingdom";
DROP TABLE "Kingdom";
ALTER TABLE "new_Kingdom" RENAME TO "Kingdom";
CREATE TABLE "new_Player" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 0,
    "isBot" BOOLEAN NOT NULL DEFAULT false,
    "gameStateId" INTEGER,
    CONSTRAINT "Player_gameStateId_fkey" FOREIGN KEY ("gameStateId") REFERENCES "GameState" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Player" ("id", "isBot", "name", "points") SELECT "id", "isBot", "name", "points" FROM "Player";
DROP TABLE "Player";
ALTER TABLE "new_Player" RENAME TO "Player";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
