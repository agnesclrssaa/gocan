ALTER TABLE "Canteen" ADD COLUMN "avg_rating" REAL NOT NULL DEFAULT 0;
ALTER TABLE "Canteen" ADD COLUMN "total_reviews" INTEGER NOT NULL DEFAULT 0;

CREATE TABLE "Rating" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user_id" INTEGER NOT NULL,
    "canteen_id" TEXT NOT NULL,
    "order_id" INTEGER NOT NULL,
    "stars" INTEGER NOT NULL,
    "review_text" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Rating_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Rating_canteen_id_fkey" FOREIGN KEY ("canteen_id") REFERENCES "Canteen" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Rating_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "Order" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "Rating_order_id_key" ON "Rating"("order_id");
CREATE INDEX "Rating_canteen_id_created_at_idx" ON "Rating"("canteen_id", "created_at");
