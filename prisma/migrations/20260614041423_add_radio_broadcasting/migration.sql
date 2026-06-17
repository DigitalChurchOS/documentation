-- CreateTable
CREATE TABLE "radio_stations" (
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
    "is_auto_dj_enabled" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "radio_stations_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "radio_programs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "station_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "speaker" TEXT,
    "category" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "radio_programs_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "radio_programs_station_id_fkey" FOREIGN KEY ("station_id") REFERENCES "radio_stations" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "radio_schedules" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "program_id" TEXT NOT NULL,
    "start_time" DATETIME NOT NULL,
    "end_time" DATETIME NOT NULL,
    "recurrence" TEXT NOT NULL DEFAULT 'none',
    "days_of_week" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "radio_schedules_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "radio_schedules_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "radio_programs" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "radio_playlists" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "station_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "is_auto_dj" BOOLEAN NOT NULL DEFAULT false,
    "rotation_rule" TEXT NOT NULL DEFAULT 'random',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "radio_playlists_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "radio_playlists_station_id_fkey" FOREIGN KEY ("station_id") REFERENCES "radio_stations" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "radio_playlist_items" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "playlist_id" TEXT NOT NULL,
    "media_asset_id" TEXT,
    "podcast_episode_id" TEXT,
    "title" TEXT NOT NULL,
    "audio_url" TEXT NOT NULL,
    "duration_seconds" INTEGER,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "radio_playlist_items_playlist_id_fkey" FOREIGN KEY ("playlist_id") REFERENCES "radio_playlists" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "radio_playlist_items_media_asset_id_fkey" FOREIGN KEY ("media_asset_id") REFERENCES "media_assets" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "radio_playlist_items_podcast_episode_id_fkey" FOREIGN KEY ("podcast_episode_id") REFERENCES "podcast_episodes" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "radio_broadcast_archives" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "station_id" TEXT NOT NULL,
    "program_id" TEXT,
    "title" TEXT NOT NULL,
    "audio_url" TEXT NOT NULL,
    "duration_seconds" INTEGER,
    "file_size" INTEGER,
    "recorded_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_podcast_episode" BOOLEAN NOT NULL DEFAULT false,
    "podcast_episode_id" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "radio_broadcast_archives_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "radio_broadcast_archives_station_id_fkey" FOREIGN KEY ("station_id") REFERENCES "radio_stations" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "radio_broadcast_archives_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "radio_programs" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "radio_broadcast_archives_podcast_episode_id_fkey" FOREIGN KEY ("podcast_episode_id") REFERENCES "podcast_episodes" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "radio_chat_messages" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "station_id" TEXT NOT NULL,
    "user_id" TEXT,
    "display_name" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "radio_chat_messages_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "radio_chat_messages_station_id_fkey" FOREIGN KEY ("station_id") REFERENCES "radio_stations" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "radio_reactions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "station_id" TEXT NOT NULL,
    "reaction_type" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "radio_reactions_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "radio_reactions_station_id_fkey" FOREIGN KEY ("station_id") REFERENCES "radio_stations" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "radio_stations_tenant_id_idx" ON "radio_stations"("tenant_id");

-- CreateIndex
CREATE INDEX "radio_stations_status_idx" ON "radio_stations"("status");

-- CreateIndex
CREATE UNIQUE INDEX "radio_stations_tenant_id_slug_key" ON "radio_stations"("tenant_id", "slug");

-- CreateIndex
CREATE INDEX "radio_programs_tenant_id_idx" ON "radio_programs"("tenant_id");

-- CreateIndex
CREATE INDEX "radio_programs_station_id_idx" ON "radio_programs"("station_id");

-- CreateIndex
CREATE UNIQUE INDEX "radio_programs_tenant_id_station_id_slug_key" ON "radio_programs"("tenant_id", "station_id", "slug");

-- CreateIndex
CREATE INDEX "radio_schedules_tenant_id_idx" ON "radio_schedules"("tenant_id");

-- CreateIndex
CREATE INDEX "radio_schedules_program_id_idx" ON "radio_schedules"("program_id");

-- CreateIndex
CREATE INDEX "radio_playlists_tenant_id_idx" ON "radio_playlists"("tenant_id");

-- CreateIndex
CREATE INDEX "radio_playlists_station_id_idx" ON "radio_playlists"("station_id");

-- CreateIndex
CREATE INDEX "radio_playlist_items_playlist_id_idx" ON "radio_playlist_items"("playlist_id");

-- CreateIndex
CREATE INDEX "radio_broadcast_archives_tenant_id_idx" ON "radio_broadcast_archives"("tenant_id");

-- CreateIndex
CREATE INDEX "radio_broadcast_archives_station_id_idx" ON "radio_broadcast_archives"("station_id");

-- CreateIndex
CREATE INDEX "radio_broadcast_archives_program_id_idx" ON "radio_broadcast_archives"("program_id");

-- CreateIndex
CREATE INDEX "radio_chat_messages_tenant_id_idx" ON "radio_chat_messages"("tenant_id");

-- CreateIndex
CREATE INDEX "radio_chat_messages_station_id_idx" ON "radio_chat_messages"("station_id");

-- CreateIndex
CREATE INDEX "radio_reactions_tenant_id_idx" ON "radio_reactions"("tenant_id");

-- CreateIndex
CREATE INDEX "radio_reactions_station_id_idx" ON "radio_reactions"("station_id");
