-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "username" TEXT NOT NULL,
    "point" DOUBLE PRECISION NOT NULL,
    "refId" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_userId_key" ON "User"("userId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_refId_fkey" FOREIGN KEY ("refId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
