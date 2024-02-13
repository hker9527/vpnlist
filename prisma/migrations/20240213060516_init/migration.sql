-- CreateTable
CREATE TABLE "ASN" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "ASN_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServerCA" (
    "id" SERIAL NOT NULL,
    "content" TEXT NOT NULL,

    CONSTRAINT "ServerCA_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServerCert" (
    "id" SERIAL NOT NULL,
    "content" TEXT NOT NULL,

    CONSTRAINT "ServerCert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServerKey" (
    "id" SERIAL NOT NULL,
    "content" TEXT NOT NULL,

    CONSTRAINT "ServerKey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Server" (
    "ip" TEXT NOT NULL,
    "port" INTEGER NOT NULL,
    "country" TEXT NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lon" DOUBLE PRECISION NOT NULL,
    "speed" DOUBLE PRECISION NOT NULL,
    "proto" TEXT NOT NULL,
    "caId" INTEGER NOT NULL,
    "certId" INTEGER NOT NULL,
    "keyId" INTEGER NOT NULL,
    "asnId" TEXT NOT NULL,

    CONSTRAINT "Server_pkey" PRIMARY KEY ("ip")
);

-- CreateTable
CREATE TABLE "Tester" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lon" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "Tester_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Result" (
    "id" SERIAL NOT NULL,
    "testerId" INTEGER NOT NULL,
    "ip" TEXT NOT NULL,
    "site" TEXT NOT NULL,
    "duration" INTEGER NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Result_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Statistic" (
    "key" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "Statistic_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE UNIQUE INDEX "ServerCA_content_key" ON "ServerCA"("content");

-- CreateIndex
CREATE UNIQUE INDEX "ServerCert_content_key" ON "ServerCert"("content");

-- CreateIndex
CREATE UNIQUE INDEX "ServerKey_content_key" ON "ServerKey"("content");

-- CreateIndex
CREATE UNIQUE INDEX "Tester_name_key" ON "Tester"("name");

-- AddForeignKey
ALTER TABLE "Server" ADD CONSTRAINT "Server_caId_fkey" FOREIGN KEY ("caId") REFERENCES "ServerCA"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Server" ADD CONSTRAINT "Server_certId_fkey" FOREIGN KEY ("certId") REFERENCES "ServerCert"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Server" ADD CONSTRAINT "Server_keyId_fkey" FOREIGN KEY ("keyId") REFERENCES "ServerKey"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Server" ADD CONSTRAINT "Server_asnId_fkey" FOREIGN KEY ("asnId") REFERENCES "ASN"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Result" ADD CONSTRAINT "Result_testerId_fkey" FOREIGN KEY ("testerId") REFERENCES "Tester"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Result" ADD CONSTRAINT "Result_ip_fkey" FOREIGN KEY ("ip") REFERENCES "Server"("ip") ON DELETE RESTRICT ON UPDATE CASCADE;
