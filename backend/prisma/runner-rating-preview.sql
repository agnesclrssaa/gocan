-- CreateTable
CREATE TABLE "RunnerRating" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "order_id" INTEGER NOT NULL,
    "customer_id" INTEGER NOT NULL,
    "runner_id" INTEGER NOT NULL,
    "stars" INTEGER NOT NULL,
    "review_text" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RunnerRating_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "Order" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "RunnerRating_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "RunnerRating_runner_id_fkey" FOREIGN KEY ("runner_id") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Canteen" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "location" TEXT,
    "building" TEXT NOT NULL DEFAULT '',
    "floor" INTEGER NOT NULL DEFAULT 1,
    "imageUrl" TEXT,
    "isOpen" BOOLEAN NOT NULL DEFAULT true,
    "avg_rating" REAL NOT NULL DEFAULT 0,
    "total_reviews" INTEGER NOT NULL DEFAULT 0
);
INSERT INTO "new_Canteen" ("avg_rating", "description", "id", "imageUrl", "isOpen", "location", "name", "total_reviews") SELECT "avg_rating", "description", "id", "imageUrl", "isOpen", "location", "name", "total_reviews" FROM "Canteen";
DROP TABLE "Canteen";
ALTER TABLE "new_Canteen" RENAME TO "Canteen";
CREATE TABLE "new_Menu" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "net_price" REAL NOT NULL DEFAULT 0,
    "online_price" REAL NOT NULL DEFAULT 0,
    "commission_rate" REAL NOT NULL DEFAULT 0.05,
    "canteenId" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "category" TEXT,
    "description" TEXT,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "deleted_at" DATETIME,
    CONSTRAINT "Menu_canteenId_fkey" FOREIGN KEY ("canteenId") REFERENCES "Canteen" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Menu" ("canteenId", "category", "deleted_at", "description", "id", "imageUrl", "isAvailable", "is_active", "is_deleted", "name", "price") SELECT "canteenId", "category", "deleted_at", "description", "id", "imageUrl", "isAvailable", "is_active", "is_deleted", "name", "price" FROM "Menu";
DROP TABLE "Menu";
ALTER TABLE "new_Menu" RENAME TO "Menu";
CREATE INDEX "Menu_canteenId_name_idx" ON "Menu"("canteenId", "name");
CREATE INDEX "Menu_canteenId_is_active_is_deleted_idx" ON "Menu"("canteenId", "is_active", "is_deleted");
CREATE TABLE "new_Order" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "customer_id" INTEGER,
    "canteenId" TEXT NOT NULL DEFAULT 'canteen-pak-brazil',
    "runner_id" INTEGER,
    "items" TEXT NOT NULL,
    "totalPrice" REAL NOT NULL,
    "subtotal" REAL NOT NULL DEFAULT 0,
    "delivery_fee" REAL NOT NULL DEFAULT 0,
    "service_fee" REAL NOT NULL DEFAULT 1000,
    "delivery_discount" REAL NOT NULL DEFAULT 0,
    "food_discount" REAL NOT NULL DEFAULT 0,
    "total_amount" REAL NOT NULL DEFAULT 0,
    "canteen_earnings" REAL NOT NULL DEFAULT 0,
    "runner_earnings" REAL NOT NULL DEFAULT 0,
    "platform_revenue" REAL NOT NULL DEFAULT 0,
    "order_type" TEXT NOT NULL DEFAULT 'IMMEDIATE',
    "fulfillment_type" TEXT NOT NULL DEFAULT 'delivery',
    "scheduled_time" DATETIME,
    "payment_method" TEXT NOT NULL DEFAULT 'QRIS',
    "payment_status" TEXT NOT NULL DEFAULT 'PENDING',
    "payment_reference" TEXT,
    "qris_payload" TEXT,
    "qris_expires_at" DATETIME,
    "pickup_qr_code" TEXT,
    "is_pickup_verified" BOOLEAN NOT NULL DEFAULT false,
    "building_name" TEXT,
    "destination_building" TEXT,
    "destination_floor" INTEGER,
    "destination_room" TEXT,
    "meeting_point" TEXT,
    "class_info" TEXT,
    "delivery_note" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "cancel_reason" TEXT,
    "cancel_note" TEXT,
    "courierId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Order_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Order_canteenId_fkey" FOREIGN KEY ("canteenId") REFERENCES "Canteen" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Order_courierId_fkey" FOREIGN KEY ("courierId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Order_runner_id_fkey" FOREIGN KEY ("runner_id") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Order" ("building_name", "cancel_note", "cancel_reason", "canteenId", "class_info", "courierId", "createdAt", "delivery_note", "fulfillment_type", "id", "is_pickup_verified", "items", "meeting_point", "order_type", "payment_method", "payment_reference", "payment_status", "pickup_qr_code", "qris_expires_at", "qris_payload", "scheduled_time", "status", "totalPrice", "updatedAt", "userId") SELECT "building_name", "cancel_note", "cancel_reason", "canteenId", "class_info", "courierId", "createdAt", "delivery_note", "fulfillment_type", "id", "is_pickup_verified", "items", "meeting_point", "order_type", "payment_method", "payment_reference", "payment_status", "pickup_qr_code", "qris_expires_at", "qris_payload", "scheduled_time", "status", "totalPrice", "updatedAt", "userId" FROM "Order";
DROP TABLE "Order";
ALTER TABLE "new_Order" RENAME TO "Order";
CREATE UNIQUE INDEX "Order_payment_reference_key" ON "Order"("payment_reference");
CREATE UNIQUE INDEX "Order_pickup_qr_code_key" ON "Order"("pickup_qr_code");
CREATE INDEX "Order_userId_createdAt_idx" ON "Order"("userId", "createdAt");
CREATE INDEX "Order_canteenId_status_idx" ON "Order"("canteenId", "status");
CREATE TABLE "new_User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'customer',
    "approval_status" TEXT NOT NULL DEFAULT 'PENDING',
    "rejection_reason" TEXT,
    "nrp" TEXT,
    "phone_number" TEXT,
    "avatar_url" TEXT,
    "default_building" TEXT,
    "default_room" TEXT,
    "ktm_url" TEXT,
    "bank_name" TEXT,
    "account_number" TEXT,
    "account_holder_name" TEXT,
    "canteenId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "User_canteenId_fkey" FOREIGN KEY ("canteenId") REFERENCES "Canteen" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_User" ("approval_status", "avatar_url", "canteenId", "createdAt", "default_building", "default_room", "email", "id", "name", "password", "role", "updatedAt") SELECT "approval_status", "avatar_url", "canteenId", "createdAt", "default_building", "default_room", "email", "id", "name", "password", "role", "updatedAt" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE INDEX "User_role_approval_status_createdAt_idx" ON "User"("role", "approval_status", "createdAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "RunnerRating_order_id_key" ON "RunnerRating"("order_id");

-- CreateIndex
CREATE INDEX "RunnerRating_runner_id_created_at_idx" ON "RunnerRating"("runner_id", "created_at");

-- CreateIndex
CREATE INDEX "RunnerRating_customer_id_created_at_idx" ON "RunnerRating"("customer_id", "created_at");
