ALTER TABLE "Order" ADD COLUMN "order_type" TEXT NOT NULL DEFAULT 'delivery';
ALTER TABLE "Order" ADD COLUMN "building_name" TEXT;
ALTER TABLE "Order" ADD COLUMN "meeting_point" TEXT;
ALTER TABLE "Order" ADD COLUMN "class_info" TEXT;
ALTER TABLE "Order" ADD COLUMN "delivery_note" TEXT;
