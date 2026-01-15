CREATE TYPE "public"."provider_type" AS ENUM('aws-s3', 'cloudflare-r2', 'minio', 'aliyun-oss', 'tencent-cos', 'supabase');--> statement-breakpoint
CREATE TABLE "compression_presets" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"max_width" integer NOT NULL,
	"max_height" integer NOT NULL,
	"quality" integer NOT NULL,
	"format" text NOT NULL,
	"fit" text NOT NULL,
	"aspect_ratio" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "providers" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"type" "provider_type" NOT NULL,
	"access_key_id" text,
	"secret_access_key" text,
	"region" text,
	"endpoint" text,
	"bucket" text,
	"account_id" text,
	"project_url" text,
	"anon_key" text,
	"service_role_key" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"last_operation_at" timestamp with time zone
);
--> statement-breakpoint
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