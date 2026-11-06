ALTER TABLE "Order" RENAME COLUMN "order_type" TO "fulfillment_type";
ALTER TABLE "Order" ADD COLUMN "order_type" TEXT NOT NULL DEFAULT 'IMMEDIATE';
ALTER TABLE "Order" ADD COLUMN "scheduled_time" DATETIME;
