-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "deliveryStatus" TEXT NOT NULL DEFAULT 'SENT';

-- CreateTable
CREATE TABLE "DeliveryReceipt" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "deliveredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DeliveryReceipt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DeliveryReceipt_userId_messageId_key" ON "DeliveryReceipt"("userId", "messageId");

-- AddForeignKey
ALTER TABLE "DeliveryReceipt" ADD CONSTRAINT "DeliveryReceipt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeliveryReceipt" ADD CONSTRAINT "DeliveryReceipt_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "Message"("id") ON DELETE CASCADE ON UPDATE CASCADE;
