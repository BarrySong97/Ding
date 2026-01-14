CREATE TABLE "upload_history" (
	"id" text PRIMARY KEY NOT NULL,
	"provider_id" text NOT NULL,
	"bucket" text NOT NULL,
	"key" text NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"size" integer,
	"mime_type" text,
	"uploaded_at" timestamp with time zone DEFAULT now() NOT NULL,
	"upload_source" text DEFAULT 'app',
	"is_compressed" boolean DEFAULT false,
	"original_size" integer,
	"compression_preset_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "upload_history" ADD CONSTRAINT "upload_history_provider_id_providers_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."providers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "upload_history_provider_bucket_idx" ON "upload_history" USING btree ("provider_id","bucket");--> statement-breakpoint
CREATE INDEX "upload_history_uploaded_at_idx" ON "upload_history" USING btree ("uploaded_at");--> statement-breakpoint
CREATE INDEX "upload_history_name_idx" ON "upload_history" USING btree ("name");--> statement-breakpoint
CREATE INDEX "upload_history_key_idx" ON "upload_history" USING btree ("key");