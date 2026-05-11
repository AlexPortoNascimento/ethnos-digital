-- CreateTable
CREATE TABLE "Card" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "tribe" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "isDragon" BOOLEAN NOT NULL DEFAULT false,
    "location" TEXT NOT NULL DEFAULT 'DECK',
    "order" INTEGER,
    "ownerId" INTEGER,
    "bandId" INTEGER,
    CONSTRAINT "Card_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "Player" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Card_bandId_fkey" FOREIGN KEY ("bandId") REFERENCES "Band" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Player" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 0,
    "isBot" BOOLEAN NOT NULL DEFAULT false
);

-- CreateTable
CREATE TABLE "Kingdom" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "gloryAge1" INTEGER NOT NULL,
    "gloryAge2" INTEGER NOT NULL,
    "gloryAge3" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "ControlMarker" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "count" INTEGER NOT NULL DEFAULT 0,
    "playerId" INTEGER NOT NULL,
    "kingdomId" INTEGER NOT NULL,
    CONSTRAINT "ControlMarker_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ControlMarker_kingdomId_fkey" FOREIGN KEY ("kingdomId") REFERENCES "Kingdom" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Band" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "size" INTEGER NOT NULL,
    "leaderId" INTEGER,
    "playerId" INTEGER NOT NULL,
    CONSTRAINT "Band_leaderId_fkey" FOREIGN KEY ("leaderId") REFERENCES "Card" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Band_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "GameState" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT DEFAULT 1,
    "currentAge" INTEGER NOT NULL DEFAULT 1,
    "dragonsFound" INTEGER NOT NULL DEFAULT 0,
    "currentPlayerId" INTEGER NOT NULL DEFAULT 1,
    "gameStarted" BOOLEAN NOT NULL DEFAULT false,
    "activeTribes" TEXT
);

-- CreateIndex
CREATE UNIQUE INDEX "ControlMarker_playerId_kingdomId_key" ON "ControlMarker"("playerId", "kingdomId");

-- CreateIndex
CREATE UNIQUE INDEX "Band_leaderId_key" ON "Band"("leaderId");
