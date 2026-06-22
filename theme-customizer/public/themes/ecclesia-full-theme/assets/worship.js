// ====================================================
// Worship Experience Module — Clean Rebuild
// Architecture: HTML5 Audio drives lyrics sync via rAF
// ====================================================

// ── Song Database ──────────────────────────────────────
const songsDatabase = [
  {
    id: 'king-of-eternity',
    title: 'King of Eternity',
    artist: 'Grace City Worship',
    key: 'C',
    bpm: 72,
    audioUrl: 'assets/songs/KING-OF-ETERNITY.mp3',
    chords: ['C', 'F', 'Am', 'G', 'F', 'G', 'C'],
    slides: [
      { time: 0, chord: 'C', text: "[Intro]\n\n(Instrumental prelude)" },
      { time: 15, chord: 'C', text: "Precious Lamb of God on the throne" },
      { time: 35, chord: 'F', text: "From the cross to hell and back\nYou ascended, exalted above all" },
      { time: 55, chord: 'Am', text: "And You reign in great power and strength\nAs the glorious God\nMagnified and glorified" },
      { time: 75, chord: 'G', text: "Lord Jesus, God above all\nYou're the exalted King of glory\nForevermore" },
      { time: 95, chord: 'F', text: "Seated on the throne of truth\nWith profound power, grace, and beauty—\nForevermore" },
      { time: 115, chord: 'G', text: "You are the risen King, soon-coming King\nYou are the glory of God, the Father\nKing of eternity—\nYou reign forevermore" },
      { time: 140, chord: 'C', text: "Breath of Life\nYou existed before all things\nOh, God of grace" },
      { time: 160, chord: 'F', text: "And in You all is held together\nBy You, all things were created\nYou brought us into the most holy place\nMade us Your glory and righteousness" },
      { time: 185, chord: 'Am', text: "Lord, You wrought Your grace\nAnd holiness in us\nAnd made us dispensers of Your\nResurrection power" },
      { time: 210, chord: 'F', text: "From the cross to hell and back\nYou ascended, exalted above all\nAnd You reign in great power and strength\nAs the glorious God\nMagnified and glorified" },
      { time: 235, chord: 'G', text: "Lord Jesus, God above all\nYou're the exalted King of glory\nForevermore" },
      { time: 260, chord: 'Am', text: "Seated on the throne of truth\nWith profound power, grace, and beauty\nForevermore" },
      { time: 280, chord: 'G', text: "You are the risen King, the soon-coming King\nYou are the glory of God the Father\nKing of eternity\nYou reign forevermore" },
      { time: 305, chord: 'F', text: "All glory, all honour, and power\nAre Yours forever\nAll praise be to the Lamb on the throne" },
      { time: 325, chord: 'G', text: "He who was and is to come\nYour dominion is forever\nHoly, holy, most holy" },
      { time: 345, chord: 'Am', text: "Your wisdom is forever\nHoly, most holy\nYou alone are God forever\nThe glorious Christ\nThe God above all—You live forever" },
      { time: 365, chord: 'G', text: "You are the risen King, the soon-coming King\nYou are the glory of God the Father\nKing of eternity\nYou reign forevermore" },
      { time: 390, chord: 'C', text: "King of eternity\nYou reign forevermore\nKing of eternity\nYou reign forevermore\nForevermore" }
    ]
  },
  {
    id: 'your-dominion-is-for-eternity',
    title: 'Your Dominion Is For Eternity',
    artist: 'Grace City Music',
    key: 'G',
    bpm: 76,
    audioUrl: 'assets/songs/YOUR-DOMINION-IS-FOR-ETERNITY.mp3',
    chords: ['G', 'C', 'Em', 'D', 'C', 'D', 'G'],
    slides: [
      { time: 0, chord: 'G', text: "[Intro]\n\n(Orchestral prelude)" },
      { time: 15, chord: 'G', text: "Almighty God, You are so great\nYour Majesty is for eternity\nAll the earth resounds Your matchless name\nFaithful God, Holy God" },
      { time: 35, chord: 'C', text: "We affirm and extol Your mightiness\nGreat God, maker of the universe\nYour excellence is seen in all the earth\nFaithful God, Holy God" },
      { time: 60, chord: 'Em', text: "The Great I AM\nFaithful and true You are\nRighteous and lofty One" },
      { time: 85, chord: 'D', text: "The everlasting King of glory\nAbove all royalties is Your holy name\nYour dominion is for eternity" },
      { time: 110, chord: 'C', text: "The Great I AM\nFaithful and true You are\nRighteous and lofty One" },
      { time: 135, chord: 'D', text: "The everlasting King of glory\nAbove all royalties is Your holy name\nYour dominion is for eternity\nAlmighty God" },
      { time: 160, chord: 'G', text: "Yours is the kingdom,\nThe power and the glory\nAll authority is in Your name" },
      { time: 185, chord: 'C', text: "Your power is supreme\nIn all the earth\nFaithful God, Holy God" },
      { time: 210, chord: 'Em', text: "The Great I AM\nFaithful and true You are\nRighteous and lofty One" },
      { time: 235, chord: 'D', text: "The everlasting King of glory\nAbove all royalties is Your holy name\nYour dominion is for eternity" },
      { time: 260, chord: 'C', text: "The Great I AM\nFaithful and true You are\nRighteous and lofty One" },
      { time: 285, chord: 'D', text: "The everlasting King of glory\nAbove all royalties is Your holy name\nYour dominion is for eternity\nAlmighty God" },
      { time: 310, chord: 'G', text: "The soon coming King\nThe Lord of Hosts\nNations of men shall declare Your Lordship" },
      { time: 335, chord: 'C', text: "No more palaces and kings\nNor Kingdoms of men\nFor Your decree shall rule the nations\nAlmighty God" }
    ]
  }
];

// ── Synth Chord Frequencies ────────────────────────────
const chordFrequencies = {
  'Bb': [116.54, 146.83, 174.61, 233.08, 293.66],
  'Eb': [77.78, 155.56, 196.00, 233.08, 311.13],
  'Gm': [98.00, 146.83, 174.61, 220.00, 293.66],
  'F': [87.31, 130.81, 174.61, 220.00, 261.63],
  'C': [130.81, 164.81, 196.00, 261.63, 329.63],
  'Am': [110.00, 146.83, 174.61, 220.00, 261.63],
  'G': [98.00, 146.83, 196.00, 246.94, 293.66],
  'D': [73.42, 146.83, 220.00, 277.18, 329.63],
  'Bm': [123.47, 164.81, 185.00, 246.94, 293.66],
  'A': [110.00, 164.81, 220.00, 277.18, 329.63],
  'Em': [82.41, 164.81, 196.00, 246.94, 329.63]
};

// ── Application State ──────────────────────────────────
let activeSong = songsDatabase[0];
let activeSlideIndex = 0;
let isManualOverride = false;
let currentVolume = 0.8;
let rafId = null;             // requestAnimationFrame ID for sync loop

// Audio element — THE single source of truth for playback
const audio = new Audio();
audio.preload = 'auto';
audio.volume = currentVolume;

// Web Audio synth context (lazy-init on first user gesture)
let audioCtx = null;
let masterGainNode = null;
let activeOscillators = [];

// Projection window ref
let projectionWindow = null;

// Canvas animation
let bgCanvas = null;
let bgCtx = null;
let animFrameId = null;
let blobs = [];

// ── DOM Cache ──────────────────────────────────────────
let dom = {};

function cacheDOM() {
  dom.songListContainer = document.getElementById('songList');
  dom.searchInput = document.getElementById('songSearch');

  dom.tabBtns = document.querySelectorAll('.worship-tab-btn');
  dom.panes = document.querySelectorAll('.worship-pane');

  dom.themeBtns = document.querySelectorAll('.theme-btn');
  dom.fontBtns = document.querySelectorAll('.font-btn');
  dom.aspectBtns = document.querySelectorAll('.aspect-btn');
  dom.fontSizeSlider = document.getElementById('fontSizeSlider');
  dom.fontSizeVal = document.getElementById('fontSizeVal');
  dom.watermarkToggle = document.getElementById('watermarkToggle');
  dom.watermarkOverlay = document.getElementById('watermarkOverlay');

  dom.screenContainer = document.getElementById('worshipScreenContainer');
  dom.monitor = document.getElementById('worshipMonitor');
  dom.bgCanvas = document.getElementById('bgCanvas');
  dom.lyricContainer = document.getElementById('lyricContainer');
  dom.statusPill = document.getElementById('statusPill');

  dom.hitboxLeft = document.getElementById('hitboxLeft');
  dom.hitboxRight = document.getElementById('hitboxRight');

  dom.progressFill = document.getElementById('progressFill');
  dom.progressTimeline = document.getElementById('progressTimeline');
  dom.timelineMarkers = document.getElementById('timelineMarkers');
  dom.currentTimeDisplay = document.getElementById('currentTime');
  dom.durationDisplay = document.getElementById('duration');
  dom.playPauseBtn = document.getElementById('playPauseBtn');
  dom.playIcon = document.getElementById('playIcon');
  dom.prevBtn = document.getElementById('prevBtn');
  dom.nextBtn = document.getElementById('nextBtn');
  dom.manualModeBtn = document.getElementById('manualModeBtn');
  dom.volumeSlider = document.getElementById('volumeSlider');
  dom.fullscreenBtn = document.getElementById('fullscreenBtn');

  dom.modeBtns = document.querySelectorAll('.mode-btn');
  dom.drawerPanes = document.querySelectorAll('.drawer-pane');

  dom.notesArea = document.getElementById('personalNotesArea');
  dom.saveNotesBtn = document.getElementById('saveNotesBtn');
  dom.downloadNotesBtn = document.getElementById('downloadNotesBtn');

  dom.chatMessages = document.getElementById('chatMessages');
  dom.chatInput = document.getElementById('chatInput');
  dom.sendChatBtn = document.getElementById('sendChat');

  dom.socialTrimStart = document.getElementById('socialTrimStart');
  dom.socialTrimEnd = document.getElementById('socialTrimEnd');
  dom.socialTemplate = document.getElementById('socialTemplate');
  dom.socialWatermarkToggle = document.getElementById('socialWatermarkToggle');
  dom.renderClipBtn = document.getElementById('renderClipBtn');
  dom.exportOverlay = document.getElementById('exportOverlay');
  dom.exportProgress = document.getElementById('exportProgress');
  dom.exportStatusText = document.getElementById('exportStatusText');

  dom.launchProjectionBtn = document.getElementById('launchProjectionBtn');
}

// ── Initialization ─────────────────────────────────────
function initWorshipPage() {
  cacheDOM();
  setupAudioEvents();
  setupEventListeners();
  loadSongList();
  selectSong(songsDatabase[0].id);
  initBackgroundCanvas();
  loadPersonalNotes();
}

// ── Audio Element Events (the heart of playback) ───────
function setupAudioEvents() {
  // When audio metadata loads, we know the real duration
  audio.addEventListener('loadedmetadata', () => {
    if (dom.durationDisplay) {
      dom.durationDisplay.textContent = formatTime(audio.duration);
    }
  });

  // Playback progress — driven by the browser's audio engine
  audio.addEventListener('timeupdate', () => {
    if (audio.paused) return;
    updateProgressUI();
    if (!isManualOverride) {
      syncSlideToTime(audio.currentTime);
    }
  });

  // Track ended naturally
  audio.addEventListener('ended', () => {
    cancelAnimationFrame(rafId);
    rafId = null;
    updatePlayPauseIcon(false);
    stopSynth();
    dom.progressFill.style.width = '100%';
    dom.currentTimeDisplay.textContent = formatTime(audio.duration);
  });

  // Handle errors gracefully
  audio.addEventListener('error', (e) => {
    console.error('Audio error:', e);
    showToast('Could not load audio file');
  });
}

// ── Event Listeners ────────────────────────────────────
function setupEventListeners() {
  // Search
  if (dom.searchInput) {
    dom.searchInput.addEventListener('input', handleSongSearch);
  }

  // Sidebar Tabs
  dom.tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const tabId = btn.getAttribute('data-tab');
      dom.tabBtns.forEach(b => b.classList.remove('active'));
      dom.panes.forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      const targetPane = document.getElementById(tabId + 'Pane');
      if (targetPane) targetPane.classList.add('active');
    });
  });

  // Customizer: Themes
  dom.themeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      dom.themeBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const themeClass = btn.getAttribute('data-theme');
      dom.monitor.classList.remove('theme-dark-motion', 'theme-soft-ambient', 'theme-clean-minimal');
      dom.monitor.classList.add(themeClass);
      if (themeClass === 'theme-soft-ambient') {
        document.body.classList.add('worship-light-mode');
      } else {
        document.body.classList.remove('worship-light-mode');
      }
      initBackgroundCanvas();
      sendProjectionState();
    });
  });

  // Customizer: Fonts
  dom.fontBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      dom.fontBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const font = btn.getAttribute('data-font');
      let fontFamily = "'Outfit', sans-serif";
      if (font === 'serif') fontFamily = "'Playfair Display', serif";
      if (font === 'mono') fontFamily = "'JetBrains Mono', monospace";
      dom.monitor.style.setProperty('--worship-font-family', fontFamily);
      sendProjectionState();
    });
  });

  // Customizer: Font size slider
  if (dom.fontSizeSlider) {
    dom.fontSizeSlider.addEventListener('input', (e) => {
      const size = e.target.value;
      dom.fontSizeVal.textContent = size + 'px';
      dom.monitor.style.setProperty('--worship-lyric-size', size + 'px');
      sendProjectionState();
    });
  }

  // Customizer: Aspect ratio
  dom.aspectBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      dom.aspectBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const aspect = btn.getAttribute('data-aspect');
      dom.monitor.classList.remove('aspect-16-9', 'aspect-4-3', 'aspect-9-16');
      dom.monitor.classList.add('aspect-' + aspect);
      resizeCanvas();
    });
  });

  // Customizer: Watermark toggle
  if (dom.watermarkToggle) {
    dom.watermarkToggle.addEventListener('change', (e) => {
      dom.watermarkOverlay.style.display = e.target.checked ? 'flex' : 'none';
    });
  }

  // ── Player Controls ──────────────────────────────────
  if (dom.playPauseBtn) dom.playPauseBtn.addEventListener('click', togglePlayback);
  if (dom.prevBtn) dom.prevBtn.addEventListener('click', navigatePreviousSlide);
  if (dom.nextBtn) dom.nextBtn.addEventListener('click', navigateNextSlide);

  // Manual mode toggle
  if (dom.manualModeBtn) {
    dom.manualModeBtn.addEventListener('click', () => {
      isManualOverride = !isManualOverride;
      dom.manualModeBtn.classList.toggle('active', isManualOverride);
      updateStatusPill();
    });
  }

  // Volume slider — controls the ACTUAL audio element
  if (dom.volumeSlider) {
    dom.volumeSlider.addEventListener('input', (e) => {
      currentVolume = parseFloat(e.target.value);
      audio.volume = currentVolume;
      if (masterGainNode && audioCtx) {
        masterGainNode.gain.setValueAtTime(currentVolume, audioCtx.currentTime);
      }
    });
  }

  // Timeline scrub — seeks the ACTUAL audio element
  if (dom.progressTimeline) {
    dom.progressTimeline.addEventListener('click', handleTimelineScrub);
  }

  // Fullscreen
  if (dom.fullscreenBtn) {
    dom.fullscreenBtn.addEventListener('click', () => {
      if (!document.fullscreenElement) {
        dom.screenContainer.requestFullscreen().catch(err => {
          console.error(`Fullscreen error: ${err.message}`);
        });
      } else {
        document.exitFullscreen();
      }
    });
  }

  // Hitbox overlays for manual slide navigation
  if (dom.hitboxLeft) {
    dom.hitboxLeft.addEventListener('click', (e) => { e.stopPropagation(); navigatePreviousSlide(); });
  }
  if (dom.hitboxRight) {
    dom.hitboxRight.addEventListener('click', (e) => { e.stopPropagation(); navigateNextSlide(); });
  }

  // Keyboard shortcuts
  window.removeEventListener('keydown', handleGlobalKeydown);
  window.addEventListener('keydown', handleGlobalKeydown);

  // Mode selection (Personal / Meeting / Projection / Social)
  dom.modeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      dom.modeBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const mode = btn.getAttribute('data-mode');
      dom.drawerPanes.forEach(pane => pane.classList.remove('active'));
      const activePane = document.getElementById(mode + 'Drawer');
      if (activePane) activePane.classList.add('active');
      if (mode === 'meeting') startMeetingMode();
      else if (mode === 'social') setupSocialClipControls();
    });
  });

  // Notes
  if (dom.saveNotesBtn) dom.saveNotesBtn.addEventListener('click', savePersonalNotes);
  if (dom.downloadNotesBtn) dom.downloadNotesBtn.addEventListener('click', downloadPersonalNotes);

  // Chat
  if (dom.sendChatBtn) dom.sendChatBtn.addEventListener('click', sendChatMessage);
  if (dom.chatInput) {
    dom.chatInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') sendChatMessage();
    });
  }

  // Social clip
  if (dom.renderClipBtn) dom.renderClipBtn.addEventListener('click', handleSocialClipRender);

  // Projection
  if (dom.launchProjectionBtn) dom.launchProjectionBtn.addEventListener('click', launchProjectionWindow);

  // Clean up projection window on unload
  window.removeEventListener('beforeunload', handleBeforeUnload);
  window.addEventListener('beforeunload', handleBeforeUnload);
}

function handleGlobalKeydown(e) {
  if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA') return;
  if (e.code === 'Space') { e.preventDefault(); togglePlayback(); }
  else if (e.code === 'ArrowRight' || e.code === 'PageDown') { e.preventDefault(); navigateNextSlide(); }
  else if (e.code === 'ArrowLeft' || e.code === 'PageUp') { e.preventDefault(); navigatePreviousSlide(); }
}

function handleBeforeUnload() {
  if (projectionWindow && !projectionWindow.closed) projectionWindow.close();
}

// ════════════════════════════════════════════════════════
// CORE PLAYBACK ENGINE
// ════════════════════════════════════════════════════════

// Load song list into library sidebar
function loadSongList() {
  dom.songListContainer.innerHTML = '';
  songsDatabase.forEach(song => {
    const item = document.createElement('div');
    item.className = 'song-item';
    item.setAttribute('data-id', song.id);
    item.innerHTML = `
      <div class="song-info">
        <div class="song-title-row">
          <strong>${song.title}</strong>
          <span class="song-key-badge">${song.key}</span>
        </div>
        <div class="song-meta-row">
          <span>${song.artist}</span>
          <span>·</span>
          <span>${song.bpm} BPM</span>
        </div>
      </div>
      <div class="song-play-icon">
        <i data-lucide="play"></i>
      </div>
    `;
    item.addEventListener('click', () => selectSong(song.id, true));
    dom.songListContainer.appendChild(item);
  });
  lucide.createIcons();
}

// Search filter
function handleSongSearch() {
  const query = dom.searchInput.value.toLowerCase();
  dom.songListContainer.querySelectorAll('.song-item').forEach(item => {
    const song = songsDatabase.find(s => s.id === item.getAttribute('data-id'));
    const match = song.title.toLowerCase().includes(query) || song.artist.toLowerCase().includes(query);
    item.style.display = match ? 'flex' : 'none';
  });
}

// Select a song — loads audio, builds slides, resets state
function selectSong(songId, autoPlay = false) {
  const song = songsDatabase.find(s => s.id === songId);
  if (!song) return;

  // Stop current playback first
  audio.pause();
  cancelAnimationFrame(rafId);
  rafId = null;
  stopSynth();

  // Load the new audio source
  audio.src = song.audioUrl;
  audio.load(); // Force browser to fetch and buffer

  // Reset state
  activeSong = song;
  activeSlideIndex = 0;
  isManualOverride = false;
  if (dom.manualModeBtn) dom.manualModeBtn.classList.remove('active');

  // Highlight active song in sidebar
  dom.songListContainer.querySelectorAll('.song-item').forEach(item => {
    item.classList.toggle('active', item.getAttribute('data-id') === songId);
  });

  // Render lyric slides
  dom.lyricContainer.innerHTML = '';
  song.slides.forEach((slide, index) => {
    const div = document.createElement('div');
    div.className = `worship-lyric-slide ${index === 0 ? 'active' : ''}`;
    div.setAttribute('data-index', index);
    div.innerText = slide.text;
    dom.lyricContainer.appendChild(div);
  });

  // Render timeline markers
  dom.timelineMarkers.innerHTML = '';
  // Use audio.duration if available, fallback to last slide time + 30s
  const estDuration = song.slides[song.slides.length - 1].time + 30;
  song.slides.forEach(slide => {
    const pct = (slide.time / estDuration) * 100;
    const marker = document.createElement('div');
    marker.className = 'timeline-marker';
    marker.style.left = `${pct}%`;
    dom.timelineMarkers.appendChild(marker);
  });

  // Reset UI
  dom.currentTimeDisplay.textContent = '00:00';
  dom.durationDisplay.textContent = '--:--';
  dom.progressFill.style.width = '0%';
  updatePlayPauseIcon(false);

  // Social clip selectors
  if (dom.socialTrimStart) {
    dom.socialTrimStart.innerHTML = '';
    if (dom.socialTrimEnd) dom.socialTrimEnd.innerHTML = '';
    song.slides.forEach((slide, index) => {
      const shortText = slide.text.replace(/\[.*?\]/g, '').trim().substring(0, 30) + '...';
      const labelText = `Slide ${index + 1}: ${shortText}`;
      dom.socialTrimStart.add(new Option(labelText, index));
      if (dom.socialTrimEnd) dom.socialTrimEnd.add(new Option(labelText, index));
    });
    if (dom.socialTrimEnd) dom.socialTrimEnd.selectedIndex = song.slides.length - 1;
  }

  updateStatusPill();
  sendProjectionState();

  if (autoPlay) {
    // Lazy-init Web Audio context on user gesture
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      masterGainNode = audioCtx.createGain();
      masterGainNode.gain.setValueAtTime(currentVolume, audioCtx.currentTime);
      masterGainNode.connect(audioCtx.destination);
    }
    if (audioCtx.state === 'suspended') audioCtx.resume();

    audio.volume = currentVolume;
    audio.play().then(() => {
      updatePlayPauseIcon(true);
      startSyncLoop();
      playChordForSlide(activeSlideIndex);
    }).catch(err => {
      console.warn('Autoplay blocked on selection:', err.message);
      showToast('Click play on player to start music');
    });
  }
}

// Toggle play / pause — THE main control
function togglePlayback() {
  if (!audio.src) return;

  if (audio.paused) {
    // ── PLAY ──
    // Lazy-init Web Audio context on user gesture
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      masterGainNode = audioCtx.createGain();
      masterGainNode.gain.setValueAtTime(currentVolume, audioCtx.currentTime);
      masterGainNode.connect(audioCtx.destination);
    }
    if (audioCtx.state === 'suspended') audioCtx.resume();

    audio.volume = currentVolume;
    const playPromise = audio.play();
    if (playPromise) {
      playPromise.catch(err => {
        console.warn('Play blocked by browser:', err.message);
        showToast('Click play again — browser blocked autoplay');
      });
    }

    updatePlayPauseIcon(true);

    // Start high-precision sync loop via rAF
    startSyncLoop();

    // Play ambient synth chord (suppressed if MP3 is audible)
    playChordForSlide(activeSlideIndex);
  } else {
    // ── PAUSE ──
    audio.pause();
    cancelAnimationFrame(rafId);
    rafId = null;
    updatePlayPauseIcon(false);
    stopSynth();
  }
}

// High-precision sync loop using requestAnimationFrame
// This runs at ~60fps and keeps lyrics perfectly in sync with audio.currentTime
function startSyncLoop() {
  function tick() {
    if (audio.paused) return; // Stop loop when paused

    updateProgressUI();
    if (!isManualOverride) {
      syncSlideToTime(audio.currentTime);
    }

    rafId = requestAnimationFrame(tick);
  }
  rafId = requestAnimationFrame(tick);
}

// Update progress bar and time display
function updateProgressUI() {
  const duration = audio.duration || 1;
  const pct = (audio.currentTime / duration) * 100;
  dom.progressFill.style.width = `${pct}%`;
  dom.currentTimeDisplay.textContent = formatTime(audio.currentTime);
}

// Sync the active lyric slide to the current audio time
function syncSlideToTime(currentTime) {
  let matchedIndex = 0;
  for (let i = 0; i < activeSong.slides.length; i++) {
    if (currentTime >= activeSong.slides[i].time) {
      matchedIndex = i;
    } else {
      break;
    }
  }

  if (matchedIndex !== activeSlideIndex) {
    setActiveSlide(matchedIndex);
  }
}

// Switch to a specific slide
function setActiveSlide(index) {
  if (index < 0 || index >= activeSong.slides.length) return;
  activeSlideIndex = index;

  // Update CSS active class on slide elements
  dom.lyricContainer.querySelectorAll('.worship-lyric-slide').forEach(slide => {
    const slideIdx = parseInt(slide.getAttribute('data-index'));
    slide.classList.toggle('active', slideIdx === index);
  });

  // Trigger synth chord change
  if (!audio.paused) {
    playChordForSlide(index);
  }

  updateStatusPill();
  sendProjectionState();
}

// Manual slide navigation
function navigateNextSlide() {
  if (activeSlideIndex < activeSong.slides.length - 1) {
    isManualOverride = true;
    if (dom.manualModeBtn) dom.manualModeBtn.classList.add('active');
    setActiveSlide(activeSlideIndex + 1);
  }
}

function navigatePreviousSlide() {
  if (activeSlideIndex > 0) {
    isManualOverride = true;
    if (dom.manualModeBtn) dom.manualModeBtn.classList.add('active');
    setActiveSlide(activeSlideIndex - 1);
  }
}

// Timeline click/scrub — seeks the actual audio element
function handleTimelineScrub(e) {
  const rect = dom.progressTimeline.getBoundingClientRect();
  const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
  const duration = audio.duration || 0;

  if (duration > 0) {
    audio.currentTime = pct * duration;
    updateProgressUI();
    syncSlideToTime(audio.currentTime);
  }
}

// Update play/pause button icon
function updatePlayPauseIcon(playing) {
  if (dom.playIcon) {
    dom.playIcon.setAttribute('data-lucide', playing ? 'pause' : 'play');
    lucide.createIcons();
  }
}

// Status pill indicator
function updateStatusPill() {
  if (isManualOverride) {
    dom.statusPill.innerHTML = `Manual Override <button id="resumeSyncBtn">Resume Sync</button>`;
    dom.statusPill.classList.add('visible');
    const btn = document.getElementById('resumeSyncBtn');
    if (btn) {
      btn.addEventListener('click', () => {
        isManualOverride = false;
        if (dom.manualModeBtn) dom.manualModeBtn.classList.remove('active');
        syncSlideToTime(audio.currentTime);
        updateStatusPill();
      });
    }
  } else {
    dom.statusPill.innerHTML = `<i data-lucide="refresh-cw"></i> Auto-Synced`;
    dom.statusPill.classList.add('visible');
    lucide.createIcons();
    setTimeout(() => {
      if (!isManualOverride && !audio.paused) {
        dom.statusPill.classList.remove('visible');
      }
    }, 3000);
  }
}

// ════════════════════════════════════════════════════════
// WEB AUDIO SYNTH PAD ENGINE
// ════════════════════════════════════════════════════════

function playChordForSlide(slideIndex) {
  stopSynth();

  // Suppress synth when the real MP3 is playing
  if (!audio.paused && audio.duration > 0) return;

  const chordName = activeSong.slides[slideIndex].chord;
  const frequencies = chordFrequencies[chordName];
  if (!frequencies || !audioCtx) return;

  const time = audioCtx.currentTime;

  const filter = audioCtx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(600, time);
  filter.Q.setValueAtTime(1, time);
  filter.connect(masterGainNode);

  frequencies.forEach((freq, i) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = i % 2 === 0 ? 'triangle' : 'sawtooth';
    osc.frequency.setValueAtTime(freq, time);
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(0.08, time + 2.5);
    osc.connect(gain);
    gain.connect(filter);
    osc.start(time);
    activeOscillators.push({ osc, gain });
  });
}

function stopSynth() {
  if (!audioCtx) return;
  const time = audioCtx.currentTime;
  activeOscillators.forEach(voice => {
    try {
      voice.gain.gain.cancelScheduledValues(time);
      voice.gain.gain.setValueAtTime(voice.gain.gain.value, time);
      voice.gain.gain.exponentialRampToValueAtTime(0.001, time + 1.2);
      setTimeout(() => { try { voice.osc.stop(); } catch(e){} }, 1500);
    } catch(e) {}
  });
  activeOscillators = [];
}

// ════════════════════════════════════════════════════════
// ANIMATED BACKGROUND CANVAS
// ════════════════════════════════════════════════════════

function initBackgroundCanvas() {
  bgCanvas = dom.bgCanvas;
  bgCtx = bgCanvas.getContext('2d');
  resizeCanvas();
  window.removeEventListener('resize', resizeCanvas);
  window.addEventListener('resize', resizeCanvas);

  if (animFrameId) cancelAnimationFrame(animFrameId);

  if (dom.monitor.classList.contains('theme-clean-minimal')) {
    bgCtx.clearRect(0, 0, bgCanvas.width, bgCanvas.height);
    return;
  }

  blobs = [];
  const isAmbient = dom.monitor.classList.contains('theme-soft-ambient');
  const colors = isAmbient
    ? ['rgba(249, 115, 22, 0.25)', 'rgba(253, 186, 116, 0.3)', 'rgba(254, 215, 170, 0.25)']
    : ['rgba(249, 115, 22, 0.18)', 'rgba(234, 88, 12, 0.15)', 'rgba(250, 204, 21, 0.12)'];

  for (let i = 0; i < 3; i++) {
    blobs.push({
      x: Math.random() * bgCanvas.width,
      y: Math.random() * bgCanvas.height,
      radius: Math.random() * 150 + 150,
      dx: (Math.random() - 0.5) * 0.6,
      dy: (Math.random() - 0.5) * 0.6,
      color: colors[i]
    });
  }

  function draw() {
    bgCtx.fillStyle = isAmbient ? '#f5eae2' : '#0d0a08';
    bgCtx.fillRect(0, 0, bgCanvas.width, bgCanvas.height);
    blobs.forEach(blob => {
      const grad = bgCtx.createRadialGradient(blob.x, blob.y, 0, blob.x, blob.y, blob.radius);
      grad.addColorStop(0, blob.color);
      grad.addColorStop(1, 'transparent');
      bgCtx.fillStyle = grad;
      bgCtx.beginPath();
      bgCtx.arc(blob.x, blob.y, blob.radius, 0, Math.PI * 2);
      bgCtx.fill();
      blob.x += blob.dx;
      blob.y += blob.dy;
      if (blob.x < -100 || blob.x > bgCanvas.width + 100) blob.dx = -blob.dx;
      if (blob.y < -100 || blob.y > bgCanvas.height + 100) blob.dy = -blob.dy;
    });
    animFrameId = requestAnimationFrame(draw);
  }
  draw();
}

function resizeCanvas() {
  if (bgCanvas) {
    bgCanvas.width = bgCanvas.offsetWidth;
    bgCanvas.height = bgCanvas.offsetHeight;
  }
}

// ════════════════════════════════════════════════════════
// SECONDARY FEATURES
// ════════════════════════════════════════════════════════

// ── Personal Notes ─────────────────────────────────────
function loadPersonalNotes() {
  const saved = localStorage.getItem('worship_personal_notes');
  if (saved && dom.notesArea) dom.notesArea.value = saved;
}

function savePersonalNotes() {
  if (dom.notesArea) {
    localStorage.setItem('worship_personal_notes', dom.notesArea.value);
    showToast('Devotion notes auto-saved');
  }
}

function downloadPersonalNotes() {
  if (!dom.notesArea) return;
  const notes = dom.notesArea.value;
  const blob = new Blob([`Grace City Church Worship Devotional Notes\nSong: ${activeSong.title}\nDate: ${new Date().toLocaleDateString()}\n\nNotes:\n${notes}`], { type: 'text/plain' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `${activeSong.id}-worship-notes.txt`;
  a.click();
  showToast('Downloaded notes successfully');
}

// ── Meeting Mode Simulator ─────────────────────────────
let meetingInterval = null;
const mockMessages = [
  { user: 'Sister Emily', text: 'Amen! Beautiful presence in the room.' },
  { user: 'Pastor Daniel', text: 'Love singing Heaven Open, lets lift our voice!' },
  { user: 'Bro Carlos', text: 'Tuning in from home, seek first His kingdom!' },
  { user: 'Sarah Thompson', text: 'The lyrics are sync'd perfectly, this is awesome.' }
];

function startMeetingMode() {
  if (meetingInterval) clearInterval(meetingInterval);
  dom.chatMessages.innerHTML = `
    <div class="meeting-msg">
      <strong>Host Pastor</strong>
      <p>Welcome to our meeting worship session. We are synced to the leader's audio tracks.</p>
    </div>
  `;
  let index = 0;
  meetingInterval = setInterval(() => {
    if (index >= mockMessages.length) { clearInterval(meetingInterval); return; }
    appendChatMessage(mockMessages[index].user, mockMessages[index].text);
    index++;
  }, 6000);
}

function sendChatMessage() {
  const text = dom.chatInput.value.trim();
  if (!text) return;
  appendChatMessage('You', text, true);
  dom.chatInput.value = '';
  dom.chatMessages.scrollTop = dom.chatMessages.scrollHeight;
  setTimeout(() => {
    const responses = ['Praise God! Amen.', 'Thank you for sharing!', 'Standing in agreement.'];
    appendChatMessage('Online Host', responses[Math.floor(Math.random() * responses.length)]);
  }, 2000);
}

function appendChatMessage(user, text, isSelf = false) {
  const div = document.createElement('div');
  div.className = `meeting-msg ${isSelf ? 'self' : ''}`;
  div.innerHTML = `<strong>${user}</strong><p>${text}</p>`;
  dom.chatMessages.appendChild(div);
  dom.chatMessages.scrollTop = dom.chatMessages.scrollHeight;
}

// ── Social Clip Generator ──────────────────────────────
function setupSocialClipControls() {
  if (dom.socialTrimStart) {
    dom.socialTrimStart.addEventListener('change', updateSocialPreview);
    if (dom.socialTrimEnd) dom.socialTrimEnd.addEventListener('change', updateSocialPreview);
    if (dom.socialTemplate) dom.socialTemplate.addEventListener('change', updateSocialPreview);
    if (dom.socialWatermarkToggle) dom.socialWatermarkToggle.addEventListener('change', updateSocialPreview);
    updateSocialPreview();
  }
}

function updateSocialPreview() {
  const startIdx = parseInt(dom.socialTrimStart.value);
  const slideText = activeSong.slides[startIdx].text.replace(/\[.*?\]/g, '').trim();
  const template = dom.socialTemplate.value;
  const previewCard = document.querySelector('.social-clip-card');
  if (previewCard) {
    previewCard.style.width = template === 'square' ? '140px' : (template === 'wide' ? '180px' : '125px');
    previewCard.style.height = template === 'square' ? '140px' : (template === 'wide' ? '100px' : '165px');
    const textEl = previewCard.querySelector('.card-lyrics');
    textEl.textContent = slideText.substring(0, 80) + (slideText.length > 80 ? '...' : '');
    const watermarkEl = previewCard.querySelector('.card-logo');
    watermarkEl.style.display = dom.socialWatermarkToggle.checked ? 'block' : 'none';
  }
}

function handleSocialClipRender() {
  const activeSlideText = activeSong.slides[dom.socialTrimStart.value].text.replace(/\[.*?\]/g, '').trim();
  dom.exportOverlay.classList.add('visible');
  let pct = 0;
  dom.exportProgress.style.width = '0%';
  const statusSteps = [
    'Trimming clip segment...',
    'Rendering Web Audio background synth pad...',
    'Blending kinetic glowing motions...',
    'Injecting church branding watermark...',
    'Finalizing video clip package...'
  ];
  const interval = setInterval(() => {
    pct += 5;
    dom.exportProgress.style.width = `${pct}%`;
    const stepIdx = Math.min(Math.floor((pct / 100) * statusSteps.length), statusSteps.length - 1);
    dom.exportStatusText.textContent = statusSteps[stepIdx];
    if (pct >= 100) {
      clearInterval(interval);
      setTimeout(() => {
        dom.exportOverlay.classList.remove('visible');
        triggerSocialCardDownload(activeSlideText);
      }, 500);
    }
  }, 150);
}

function triggerSocialCardDownload(lyrics) {
  const template = dom.socialTemplate.value;
  const isSoft = dom.monitor.classList.contains('theme-soft-ambient');
  const width = template === 'square' ? 1080 : (template === 'wide' ? 1920 : 1080);
  const height = template === 'square' ? 1080 : (template === 'wide' ? 1080 : 1920);
  const textColor = isSoft ? '#2f251e' : '#ffffff';
  const svgText = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${isSoft ? '#f5eae2' : '#1e1b18'};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${isSoft ? '#fed7aa' : '#ea580c'};stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#grad)" />
      ${dom.socialWatermarkToggle && dom.socialWatermarkToggle.checked ? `
      <g transform="translate(60, 80)">
        <text font-family="Outfit, sans-serif" font-weight="900" font-size="28" fill="${textColor}" opacity="0.6" letter-spacing="4">GRACE CITY WORSHIP</text>
      </g>
      ` : ''}
      <g transform="translate(${width/2}, ${height/2})">
        <text font-family="Outfit, sans-serif" font-weight="800" font-size="44" fill="${textColor}" text-anchor="middle" dominant-baseline="middle" letter-spacing="-1">
          ${lyrics.split('\n').map((line, idx) => `
            <tspan x="0" dy="${idx === 0 ? 0 : 60}">${line.toUpperCase()}</tspan>
          `).join('')}
        </text>
      </g>
      <text x="${width/2}" y="${height - 80}" font-family="Outfit, sans-serif" font-size="20" fill="${textColor}" opacity="0.5" text-anchor="middle">Sing with us at gracecity.org</text>
    </svg>
  `;
  const blob = new Blob([svgText], { type: 'image/svg+xml' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `worship-clip-${activeSong.id}.svg`;
  a.click();
  showToast('Worship clip downloaded successfully');
}

// ── Projection Window ──────────────────────────────────
function launchProjectionWindow() {
  if (projectionWindow && !projectionWindow.closed) { projectionWindow.focus(); return; }
  const w = 960, h = 540;
  const left = (screen.width/2)-(w/2), top = (screen.height/2)-(h/2);
  projectionWindow = window.open("", "WorshipProjection", `width=${w},height=${h},left=${left},top=${top},menubar=no,toolbar=no,location=no,status=no`);
  const doc = projectionWindow.document;
  doc.open();
  doc.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Worship Screen — Projection View</title>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Outfit:wght@800&family=Playfair+Display:ital,wght@0,800;1,800&family=JetBrains+Mono:wght@800&display=swap">
      <style>
        body { margin:0;padding:0;background:#000;overflow:hidden;width:100vw;height:100vh;display:flex;justify-content:center;align-items:center;color:white;font-family:'Outfit',sans-serif; }
        .monitor { position:relative;width:100vw;height:100vh;display:flex;flex-direction:column;justify-content:center;align-items:center;transition:all .3s ease;overflow:hidden;background:#0d0a08; }
        canvas { position:absolute;top:0;left:0;width:100%;height:100%;z-index:1;pointer-events:none; }
        .lyric-container { position:relative;z-index:3;width:85%;text-align:center; }
        .slide-text { font-size:5.5vw;font-weight:800;line-height:1.4;letter-spacing:-0.02em;text-shadow:0 4px 28px rgba(0,0,0,0.65);white-space:pre-line;transition:opacity .3s ease; }
        .watermark { position:absolute;top:4vw;left:4vw;z-index:5;font-size:1.5vw;font-weight:800;letter-spacing:0.12em;text-transform:uppercase;opacity:0.45; }
      </style>
    </head>
    <body>
      <div class="monitor" id="monitor">
        <canvas id="projectionCanvas"></canvas>
        <div class="watermark" id="watermark">GRACE CITY WORSHIP</div>
        <div class="lyric-container"><div class="slide-text" id="slideText"></div></div>
      </div>
      <script>
        const canvas=document.getElementById('projectionCanvas'),ctx=canvas.getContext('2d');let blobs=[];
        function resize(){canvas.width=window.innerWidth;canvas.height=window.innerHeight;}
        window.addEventListener('resize',resize);resize();
        function initBlobs(isAmbient){blobs=[];const colors=isAmbient?['rgba(249,115,22,0.25)','rgba(253,186,116,0.3)','rgba(254,215,170,0.25)']:['rgba(249,115,22,0.18)','rgba(234,88,12,0.15)','rgba(250,204,21,0.12)'];for(let i=0;i<3;i++){blobs.push({x:Math.random()*canvas.width,y:Math.random()*canvas.height,radius:Math.random()*200+200,dx:(Math.random()-0.5)*0.8,dy:(Math.random()-0.5)*0.8,color:colors[i]});}}
        initBlobs(false);
        function draw(){const isAmbient=document.getElementById('monitor').classList.contains('ambient-style'),isMinimal=document.getElementById('monitor').classList.contains('minimal-style');if(isMinimal){ctx.fillStyle='#000';ctx.fillRect(0,0,canvas.width,canvas.height);requestAnimationFrame(draw);return;}ctx.fillStyle=isAmbient?'#f5eae2':'#0d0a08';ctx.fillRect(0,0,canvas.width,canvas.height);blobs.forEach(b=>{const g=ctx.createRadialGradient(b.x,b.y,0,b.x,b.y,b.radius);g.addColorStop(0,b.color);g.addColorStop(1,'transparent');ctx.fillStyle=g;ctx.beginPath();ctx.arc(b.x,b.y,b.radius,0,Math.PI*2);ctx.fill();b.x+=b.dx;b.y+=b.dy;if(b.x<-150||b.x>canvas.width+150)b.dx=-b.dx;if(b.y<-150||b.y>canvas.height+150)b.dy=-b.dy;});requestAnimationFrame(draw);}
        draw();
        window.updateSlide=function(text,themeClass,fontStyle,sizeVal,showWatermark){const textEl=document.getElementById('slideText');if(textEl.innerText!==text){textEl.style.opacity='0';setTimeout(()=>{textEl.innerText=text;textEl.style.opacity='1';},150);}const monitor=document.getElementById('monitor'),watermark=document.getElementById('watermark');monitor.classList.remove('ambient-style','minimal-style');monitor.style.background='#0d0a08';monitor.style.color='#ffffff';watermark.style.color='#ffffff';if(themeClass==='theme-soft-ambient'){monitor.classList.add('ambient-style');monitor.style.background='#f5eae2';monitor.style.color='#2f251e';watermark.style.color='#2f251e';}else if(themeClass==='theme-clean-minimal'){monitor.classList.add('minimal-style');monitor.style.background='#000000';monitor.style.color='#e5e5e5';watermark.style.color='#e5e5e5';}monitor.style.fontFamily=fontStyle;textEl.style.fontSize=sizeVal;watermark.style.display=showWatermark?'block':'none';}
      </script>
    </body>
    </html>
  `);
  doc.close();
  setTimeout(sendProjectionState, 500);
}

function sendProjectionState() {
  if (projectionWindow && !projectionWindow.closed && projectionWindow.updateSlide) {
    const text = activeSong.slides[activeSlideIndex].text;
    const themeClass = dom.themeBtns[0].parentNode.querySelector('.active').getAttribute('data-theme');
    const fontStyle = dom.monitor.style.getPropertyValue('--worship-font-family') || "'Outfit', sans-serif";
    const showWatermark = dom.watermarkToggle ? dom.watermarkToggle.checked : true;
    projectionWindow.updateSlide(text, themeClass, fontStyle, '5.5vw', showWatermark);
  }
}

// ── Utilities ──────────────────────────────────────────
function formatTime(secs) {
  if (!secs || isNaN(secs)) return '00:00';
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function showToast(msg) {
  const toast = document.createElement('div');
  toast.style.cssText = `
    position: fixed;
    bottom: 24px;
    right: 24px;
    background: #1d1812;
    color: white;
    padding: 12px 20px;
    border-radius: 12px;
    font-size: 13px;
    font-weight: 800;
    box-shadow: var(--shadow);
    z-index: 999;
    opacity: 0;
    transform: translateY(20px);
    transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  `;
  toast.innerText = msg;
  document.body.appendChild(toast);
  setTimeout(() => { toast.style.opacity = '1'; toast.style.transform = 'translateY(0)'; }, 50);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(20px)';
    setTimeout(() => toast.remove(), 300);
  }, 2500);
}

// ── Bootstrap ──────────────────────────────────────────
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initWorshipPage);
} else {
  initWorshipPage();
}
