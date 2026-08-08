/*
  Warnings:

  - You are about to drop the column `fileUrl` on the `transporter_documents` table. All the data in the column will be lost.
  - Added the required column `storageKey` to the `transporter_documents` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "transporter_documents" DROP COLUMN "fileUrl",
ADD COLUMN     "storageKey" TEXT NOT NULL;
