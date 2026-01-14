DROP TABLE "settings" CASCADE;--> statement-breakpoint
ALTER TABLE "compression_presets" ADD COLUMN "aspect_ratio" text;--> statement-breakpoint
ALTER TABLE "compression_presets" DROP COLUMN "is_built_in";