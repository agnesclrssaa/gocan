ALTER TABLE "Order" ADD COLUMN "payment_method" TEXT NOT NULL DEFAULT 'QRIS';
ALTER TABLE "Order" ADD COLUMN "payment_status" TEXT NOT NULL DEFAULT 'PENDING';
ALTER TABLE "Order" ADD COLUMN "payment_reference" TEXT;
ALTER TABLE "Order" ADD COLUMN "qris_payload" TEXT;
ALTER TABLE "Order" ADD COLUMN "qris_expires_at" DATETIME;
ALTER TABLE "Order" ADD COLUMN "pickup_qr_code" TEXT;
ALTER TABLE "Order" ADD COLUMN "is_pickup_verified" BOOLEAN NOT NULL DEFAULT false;

CREATE UNIQUE INDEX "Order_payment_reference_key" ON "Order"("payment_reference");
CREATE UNIQUE INDEX "Order_pickup_qr_code_key" ON "Order"("pickup_qr_code");
