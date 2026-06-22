-- CreateTable
CREATE TABLE "tv_channels" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "slogan" TEXT,
    "description" TEXT,
    "logo_url" TEXT,
    "cover_image_url" TEXT,
    "social_links" TEXT NOT NULL DEFAULT '[]',
    "stream_type" TEXT NOT NULL DEFAULT 'managed',
    "stream_provider" TEXT,
    "stream_url" TEXT,
    "stream_key" TEXT,
    "status" TEXT NOT NULL DEFAULT 'offline',
    "is_auto_programming_enabled" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "tv_channels_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "tv_programs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "channel_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "speaker" TEXT,
    "category" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "tv_programs_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "tv_programs_channel_id_fkey" FOREIGN KEY ("channel_id") REFERENCES "tv_channels" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "tv_schedules" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "program_id" TEXT NOT NULL,
    "start_time" DATETIME NOT NULL,
    "end_time" DATETIME NOT NULL,
    "recurrence" TEXT NOT NULL DEFAULT 'none',
    "days_of_week" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "tv_schedules_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "tv_schedules_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "tv_programs" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "tv_playlists" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "channel_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "is_auto_programming" BOOLEAN NOT NULL DEFAULT false,
    "rotation_rule" TEXT NOT NULL DEFAULT 'random',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "tv_playlists_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "tv_playlists_channel_id_fkey" FOREIGN KEY ("channel_id") REFERENCES "tv_channels" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "tv_playlist_items" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "playlist_id" TEXT NOT NULL,
    "media_asset_id" TEXT,
    "title" TEXT NOT NULL,
    "video_url" TEXT NOT NULL,
    "duration_seconds" INTEGER,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "tv_playlist_items_playlist_id_fkey" FOREIGN KEY ("playlist_id") REFERENCES "tv_playlists" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "tv_playlist_items_media_asset_id_fkey" FOREIGN KEY ("media_asset_id") REFERENCES "media_assets" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "tv_broadcast_archives" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "channel_id" TEXT NOT NULL,
    "program_id" TEXT,
    "title" TEXT NOT NULL,
    "video_url" TEXT NOT NULL,
    "duration_seconds" INTEGER,
    "file_size" INTEGER,
    "recorded_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_media_asset" BOOLEAN NOT NULL DEFAULT false,
    "media_asset_id" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "tv_broadcast_archives_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "tv_broadcast_archives_channel_id_fkey" FOREIGN KEY ("channel_id") REFERENCES "tv_channels" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "tv_broadcast_archives_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "tv_programs" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "tv_broadcast_archives_media_asset_id_fkey" FOREIGN KEY ("media_asset_id") REFERENCES "media_assets" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "tv_chat_messages" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "channel_id" TEXT NOT NULL,
    "user_id" TEXT,
    "display_name" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "country_code" TEXT,
    "user_role" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "tv_chat_messages_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "tv_chat_messages_channel_id_fkey" FOREIGN KEY ("channel_id") REFERENCES "tv_channels" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "tv_reactions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "channel_id" TEXT NOT NULL,
    "reaction_type" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "tv_reactions_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "tv_reactions_channel_id_fkey" FOREIGN KEY ("channel_id") REFERENCES "tv_channels" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "tv_polls" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "channel_id" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "options" TEXT NOT NULL DEFAULT '[]',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "tv_polls_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "tv_polls_channel_id_fkey" FOREIGN KEY ("channel_id") REFERENCES "tv_channels" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "tv_poll_responses" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "poll_id" TEXT NOT NULL,
    "user_id" TEXT,
    "option" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "tv_poll_responses_poll_id_fkey" FOREIGN KEY ("poll_id") REFERENCES "tv_polls" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "tv_lower_thirds" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "channel_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "button_text" TEXT,
    "action_url" TEXT,
    "start_time" DATETIME NOT NULL,
    "end_time" DATETIME NOT NULL,
    "position" TEXT NOT NULL DEFAULT 'bottom-left',
    "audience" TEXT NOT NULL DEFAULT 'all',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "tv_lower_thirds_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "tv_lower_thirds_channel_id_fkey" FOREIGN KEY ("channel_id") REFERENCES "tv_channels" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "tv_channels_tenant_id_idx" ON "tv_channels"("tenant_id");

-- CreateIndex
CREATE INDEX "tv_channels_status_idx" ON "tv_channels"("status");

-- CreateIndex
CREATE UNIQUE INDEX "tv_channels_tenant_id_slug_key" ON "tv_channels"("tenant_id", "slug");

-- CreateIndex
CREATE INDEX "tv_programs_tenant_id_idx" ON "tv_programs"("tenant_id");

-- CreateIndex
CREATE INDEX "tv_programs_channel_id_idx" ON "tv_programs"("channel_id");

-- CreateIndex
CREATE UNIQUE INDEX "tv_programs_tenant_id_channel_id_slug_key" ON "tv_programs"("tenant_id", "channel_id", "slug");

-- CreateIndex
CREATE INDEX "tv_schedules_tenant_id_idx" ON "tv_schedules"("tenant_id");

-- CreateIndex
CREATE INDEX "tv_schedules_program_id_idx" ON "tv_schedules"("program_id");

-- CreateIndex
CREATE INDEX "tv_playlists_tenant_id_idx" ON "tv_playlists"("tenant_id");

-- CreateIndex
CREATE INDEX "tv_playlists_channel_id_idx" ON "tv_playlists"("channel_id");

-- CreateIndex
CREATE INDEX "tv_playlist_items_playlist_id_idx" ON "tv_playlist_items"("playlist_id");

-- CreateIndex
CREATE INDEX "tv_broadcast_archives_tenant_id_idx" ON "tv_broadcast_archives"("tenant_id");

-- CreateIndex
CREATE INDEX "tv_broadcast_archives_channel_id_idx" ON "tv_broadcast_archives"("channel_id");

-- CreateIndex
CREATE INDEX "tv_broadcast_archives_program_id_idx" ON "tv_broadcast_archives"("program_id");

-- CreateIndex
CREATE INDEX "tv_chat_messages_tenant_id_idx" ON "tv_chat_messages"("tenant_id");

-- CreateIndex
CREATE INDEX "tv_chat_messages_channel_id_idx" ON "tv_chat_messages"("channel_id");

-- CreateIndex
CREATE INDEX "tv_reactions_tenant_id_idx" ON "tv_reactions"("tenant_id");

-- CreateIndex
CREATE INDEX "tv_reactions_channel_id_idx" ON "tv_reactions"("channel_id");

-- CreateIndex
CREATE INDEX "tv_polls_tenant_id_idx" ON "tv_polls"("tenant_id");

-- CreateIndex
CREATE INDEX "tv_polls_channel_id_idx" ON "tv_polls"("channel_id");

-- CreateIndex
CREATE INDEX "tv_poll_responses_poll_id_idx" ON "tv_poll_responses"("poll_id");

-- CreateIndex
CREATE INDEX "tv_lower_thirds_tenant_id_idx" ON "tv_lower_thirds"("tenant_id");

-- CreateIndex
CREATE INDEX "tv_lower_thirds_channel_id_idx" ON "tv_lower_thirds"("channel_id");
