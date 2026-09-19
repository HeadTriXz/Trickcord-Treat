CREATE TABLE "active_effects" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"guild_id" text NOT NULL,
	"user_id" text NOT NULL,
	"type" text NOT NULL,
	"consumed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "guild_settings" (
	"guild_id" text PRIMARY KEY NOT NULL,
	"chance" integer DEFAULT 20 NOT NULL,
	"interval" integer DEFAULT 300 NOT NULL,
	"timeout" integer DEFAULT 60 NOT NULL,
	"role_id" text,
	"allowed_channels" text[] DEFAULT '{}'::text[] NOT NULL,
	"ignored_channels" text[] DEFAULT '{}'::text[] NOT NULL,
	"ignored_roles" text[] DEFAULT '{}'::text[] NOT NULL
);
--> statement-breakpoint
CREATE TABLE "inventory_items" (
	"guild_id" text NOT NULL,
	"user_id" text NOT NULL,
	"item_id" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "inventory_items_guild_id_user_id_item_id_pk" PRIMARY KEY("guild_id","user_id","item_id")
);
--> statement-breakpoint
CREATE TABLE "members" (
	"guild_id" text NOT NULL,
	"user_id" text NOT NULL,
	"candy" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "members_guild_id_user_id_pk" PRIMARY KEY("guild_id","user_id")
);
--> statement-breakpoint
ALTER TABLE "inventory_items" ADD CONSTRAINT "inventory_items_guild_id_user_id_members_guild_id_user_id_fk" FOREIGN KEY ("guild_id","user_id") REFERENCES "public"."members"("guild_id","user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "active_effects_lookup_idx" ON "active_effects" USING btree ("guild_id","user_id","type") WHERE consumed_at IS NULL;