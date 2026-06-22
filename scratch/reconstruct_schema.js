const fs = require('fs');

const schemaPath = 'prisma/schema.prisma';
let schema = fs.readFileSync(schemaPath, 'utf8').replace(/\r\n/g, '\n');

// 1. Inject into Tenant model
const tenantTarget = `  dynamicBlogPublishingEngineSettings   DynamicBlogPublishingEngineModuleSettings[]

  @@map("tenants")`;

const tenantReplacement = `  dynamicBlogPublishingEngineSettings   DynamicBlogPublishingEngineModuleSettings[]

  radioStations           RadioStation[]
  radioPrograms           RadioProgram[]
  radioSchedules          RadioSchedule[]
  radioPlaylists          RadioPlaylist[]
  radioBroadcastArchives  RadioBroadcastArchive[]
  radioChatMessages       RadioChatMessage[]
  radioReactions          RadioReaction[]

  tvChannels              TvChannel[]
  tvPrograms              TvProgram[]
  tvSchedules             TvSchedule[]
  tvPlaylists             TvPlaylist[]
  tvBroadcastArchives     TvBroadcastArchive[]
  tvChatMessages          TvChatMessage[]
  tvReactions             TvReaction[]
  tvPolls                 TvPoll[]
  tvLowerThirds           TvLowerThird[]

  @@map("tenants")`;

if (!schema.includes(tenantTarget)) {
  console.error("ERROR: Could not find Tenant relation inject point!");
  process.exit(1);
}
schema = schema.replace(tenantTarget, tenantReplacement);
console.log("Injected relations into Tenant model.");

// 2. Inject into MediaAsset model
const mediaTarget = `  assetTags      MediaAssetTag[]
  playlistItems  MediaPlaylistItem[]
  livestreams    Livestream[]`;

const mediaReplacement = `  assetTags      MediaAssetTag[]
  playlistItems  MediaPlaylistItem[]
  radioPlaylistItems RadioPlaylistItem[]
  tvPlaylistItems    TvPlaylistItem[]
  tvBroadcastArchives TvBroadcastArchive[]
  livestreams    Livestream[]`;

if (!schema.includes(mediaTarget)) {
  console.error("ERROR: Could not find MediaAsset relation inject point!");
  process.exit(1);
}
schema = schema.replace(mediaTarget, mediaReplacement);
console.log("Injected relations into MediaAsset model.");

// 3. Inject into PodcastEpisode model
const podcastTarget = `  tenant Tenant      @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  show   PodcastShow @relation(fields: [showId], references: [id], onDelete: Cascade)

  @@unique([tenantId, showId, slug])`;

const podcastReplacement = `  tenant Tenant      @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  show   PodcastShow @relation(fields: [showId], references: [id], onDelete: Cascade)

  radioPlaylistItems   RadioPlaylistItem[]
  radioBroadcastArchives RadioBroadcastArchive[]

  @@unique([tenantId, showId, slug])`;

if (!schema.includes(podcastTarget)) {
  console.error("ERROR: Could not find PodcastEpisode relation inject point!");
  process.exit(1);
}
schema = schema.replace(podcastTarget, podcastReplacement);
console.log("Injected relations into PodcastEpisode model.");

// 4. Append Radio and TV models
const radioModels = fs.readFileSync('scratch/radio_models_clean.prisma', 'utf8').replace(/\r\n/g, '\n');
const tvModels = fs.readFileSync('scratch/tv_models_clean.prisma', 'utf8').replace(/\r\n/g, '\n');

schema = schema.trim() + '\n\n' + radioModels.trim() + '\n\n' + tvModels.trim() + '\n';

fs.writeFileSync(schemaPath, schema);
console.log("Successfully reconstructed schema.prisma!");
