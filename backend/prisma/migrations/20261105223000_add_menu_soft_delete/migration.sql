ALTER TABLE "Menu" ADD COLUMN "is_deleted" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Menu" ADD COLUMN "is_active" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Menu" ADD COLUMN "deleted_at" DATETIME;

CREATE INDEX "Menu_canteen_id_is_active_is_deleted_idx" ON "Menu"("canteenId", "is_active", "is_deleted");
