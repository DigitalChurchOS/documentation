const fs = require('fs');

function getMp3Duration(filePath) {
  const buffer = fs.readFileSync(filePath);
  let offset = 0;
  
  // Look for ID3v2 tag and skip it
  if (buffer.toString('ascii', 0, 3) === 'ID3') {
    const size = (buffer[6] << 21) | (buffer[7] << 14) | (buffer[8] << 7) | buffer[9];
    offset = 10 + size;
  }
  
  // Find first sync frame (0xFF and 0xF0 bits)
  while (offset < buffer.length - 4) {
    if (buffer[offset] === 0xFF && (buffer[offset + 1] & 0xE0) === 0xE0) {
      break;
    }
    offset++;
  }
  
  if (offset >= buffer.length - 4) {
    return null;
  }
  
  // Read frame header
  const header = buffer.readUInt32BE(offset);
  
  // Parse bitrate and sample rate
  const version = (header >> 19) & 3; // 3 = MPEG Version 1
  const layer = (header >> 17) & 3;   // 1 = Layer 3
  const bitrateIndex = (header >> 12) & 15;
  const sampleRateIndex = (header >> 10) & 3;
  const padding = (header >> 9) & 1;
  
  const bitrates = [
    [0, 32, 64, 96, 128, 160, 192, 224, 256, 320, 352, 384, 416, 448, 0], // V1, L1
    [0, 32, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320, 384, 0], // V1, L2
    [0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320, 0]  // V1, L3
  ];
  
  const sampleRates = [44100, 48000, 32000, 0];
  
  const sampleRate = sampleRates[sampleRateIndex];
  const bitrate = bitrates[2][bitrateIndex] * 1000; // V1, L3
  
  if (!sampleRate || !bitrate) return null;
  
  // Look for Xing/Info header inside first frame
  let xingOffset = offset + 4;
  // Skip side info (32 bytes for joint stereo, 17 for mono)
  xingOffset += 32; 
  
  const isXing = buffer.toString('ascii', xingOffset, xingOffset + 4) === 'Xing' || 
                 buffer.toString('ascii', xingOffset, xingOffset + 4) === 'Info';
                 
  if (isXing) {
    const flags = buffer.readUInt32BE(xingOffset + 4);
    const hasFrames = flags & 1;
    if (hasFrames) {
      const numFrames = buffer.readUInt32BE(xingOffset + 8);
      const samplesPerFrame = 1152; // MPEG-1 Audio Layer III
      return numFrames * samplesPerFrame / sampleRate;
    }
  }
  
  // Fallback: estimate from file size and average bitrate
  const audioBytes = buffer.length - offset;
  return (audioBytes * 8) / bitrate;
}

const kingDuration = getMp3Duration('ecclesia-full-theme/assets/songs/KING-OF-ETERNITY.mp3');
const dominionDuration = getMp3Duration('ecclesia-full-theme/assets/songs/YOUR-DOMINION-IS-FOR-ETERNITY.mp3');

console.log('KING_OF_ETERNITY_DURATION:', kingDuration);
console.log('YOUR_DOMINION_IS_FOR_ETERNITY_DURATION:', dominionDuration);
