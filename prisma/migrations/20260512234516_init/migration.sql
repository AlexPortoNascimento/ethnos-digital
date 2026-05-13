/*
  Warnings:

  - A unique constraint covering the columns `[name]` on the table `Kingdom` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Kingdom_name_key" ON "Kingdom"("name");
