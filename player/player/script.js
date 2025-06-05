const image = document.getElementById("cover"),
  title = document.getElementById("music-title"),
  artist = document.getElementById("music-artist"),
  currentTimeEl = document.getElementById("current-time"),
  durationEl = document.getElementById("duration"),
  progress = document.getElementById("progress"),
  playerProgress = document.getElementById("player-progress"),
  prevBtn = document.getElementById("prev"),
  nextBtn = document.getElementById("next"),
  playBtn = document.getElementById("play"),
  shuffleBtn = document.getElementById("shuffle"),
  repeatBtn = document.getElementById("repeat"),
  background = document.getElementById("bg-img");

// File selection elements
const fileSelectionModal = document.getElementById("fileSelectionModal");
const songList = document.getElementById("songList");
const songFileInput = document.getElementById("songFileInput");
const selectFilesButton = document.getElementById("selectFilesButton");
const continueWithoutFiles = document.getElementById("continueWithoutFiles");

const music = new Audio();
let songs = [];
let originalSongs = []; // Keep original order for un-shuffling
let musicIndex = 0;
let isPlaying = false;
let isShuffling = false;
let isRepeating = false;
let selectedFiles = new Map(); // Map to store selected files by filename

function initializePlayer() {
  // Get songs from localStorage
  const storedSongs = localStorage.getItem("currentPlayingPlaylist");
  console.log("Stored songs from localStorage:", storedSongs);
  
  if (!storedSongs) {
    console.error("No playlist found in localStorage");
    alert("No songs found in the playlist.");
    return false;
  }

  try {
    songs = JSON.parse(storedSongs);
    // Keep a copy of original order
    originalSongs = [...songs];
    console.log("Parsed songs:", songs);
    
    if (!Array.isArray(songs) || songs.length === 0) {
      throw new Error("No songs in playlist");
    }

    // Get the starting index
    musicIndex = parseInt(localStorage.getItem("currentSongIndex")) || 0;
    console.log("Starting with song index:", musicIndex);

    // Restore shuffle state
    isShuffling = localStorage.getItem("isShuffling") === "true";
    if (isShuffling) {
      shuffleBtn.classList.add("active");
    }

    return true;
  } catch (error) {
    console.error("Error initializing player:", error);
    alert("Error loading playlist: " + error.message);
    return false;
  }
}

// Helper function to clean and normalize filenames
function normalizeFileName(fileName) {
  return fileName
    .toLowerCase()
    .replace(/\.[^/.]+$/, "") // Remove extension
    .replace(/^.*?- /, "") // Remove everything before "- "
    .replace(/\[.*?\]/g, "") // Remove content in square brackets
    .replace(/\(.*?\)/g, "") // Remove content in parentheses
    .replace(/spotifydownloader\.com[-\s]*/i, "") // Remove spotifydownloader.com
    .replace(/\s+/g, " ") // Replace multiple spaces with single space
    .trim(); // Remove leading/trailing spaces
}

// Show file selection modal with song list
function showFileSelectionModal() {
  // Hide the player container while showing the modal
  document.querySelector('.container').style.display = 'none';
  document.querySelector('.background').style.display = 'none';

  songList.innerHTML = `
    <div class="selection-header">
      <h3>Select Your Songs</h3>
      <p class="selection-info">Please select all songs for this playlist</p>
    </div>
    <div class="song-selection-list">
      ${songs.map((song, index) => {
        const fileName = song.fileName || song.title;
        return `
          <div class="song-selection-item">
            <div class="song-details">
              <div class="song-title">${song.title}</div>
              <div class="song-filename">${fileName}</div>
            </div>
            <div class="song-status">⚠️ Not Selected</div>
          </div>
        `;
      }).join('')}
    </div>
  `;
  
  fileSelectionModal.style.display = "flex";
}

// Handle bulk file selection
function handleFileSelection(files) {
  const songItems = songList.querySelectorAll(".song-selection-item");
  
  // Create a Map of selected files by normalized filename
  const selectedFileMap = new Map();
  
  // First, keep existing selections
  for (const [songName, file] of selectedFiles) {
    const normalizedName = normalizeFileName(songName);
    selectedFileMap.set(normalizedName, file);
  }
  
  // Add new files to the map
  Array.from(files).forEach(file => {
    const normalizedName = normalizeFileName(file.name);
    selectedFileMap.set(normalizedName, file);
  });
  
  // Clear and rebuild selectedFiles with matched files
  selectedFiles.clear();
  
  // Match songs with files
  songs.forEach((song, index) => {
    const fileName = song.fileName || song.title;
    const normalizedFileName = normalizeFileName(fileName);
    
    // Try to find a matching file
    let matched = false;
    for (const [normalizedName, file] of selectedFileMap) {
      if (normalizedName.includes(normalizedFileName) || 
          normalizedFileName.includes(normalizedName) ||
          calculateSimilarity(normalizedName, normalizedFileName) > 0.8) {
        selectedFiles.set(fileName, file);
        matched = true;
        break;
      }
    }
    
    // Update status
    const statusElement = songItems[index].querySelector(".song-status");
    if (matched) {
      statusElement.innerHTML = '<span class="status-icon">✅</span> Selected';
      statusElement.classList.add('selected');
    } else {
      statusElement.innerHTML = '<span class="status-icon">⚠️</span> Not Selected';
      statusElement.classList.remove('selected');
    }
  });
  
  // Update selection info
  const remainingCount = songs.length - selectedFiles.size;
  const selectionInfo = songList.querySelector('.selection-info');
  if (remainingCount > 0) {
    selectionInfo.textContent = `Please select ${remainingCount} more song${remainingCount > 1 ? 's' : ''}`;
  } else {
    selectionInfo.textContent = 'All songs selected! You can continue.';
    // Show the player and start playing after a short delay
    setTimeout(() => {
      document.querySelector('.container').style.display = '';
      document.querySelector('.background').style.display = '';
      fileSelectionModal.style.display = "none";
  loadMusic(songs[musicIndex]);
    }, 1000);
  }
}

// Calculate similarity between two strings (Levenshtein distance based)
function calculateSimilarity(str1, str2) {
  const track1Words = str1.split(/\s+/);
  const track2Words = str2.split(/\s+/);
  
  // Count matching words
  const matches = track1Words.filter(word => 
    track2Words.some(w2 => w2.includes(word) || word.includes(w2))
  ).length;
  
  // Calculate similarity ratio
  const maxLength = Math.max(track1Words.length, track2Words.length);
  return matches / maxLength;
}

// Load and play the first song from the playlist
document.addEventListener("DOMContentLoaded", async function () {
  console.log("Player loading...");
  
  if (initializePlayer()) {
    // Show file selection modal first
    showFileSelectionModal();

    // Restore shuffle and repeat states
    isRepeating = localStorage.getItem("isRepeating") === "true";
    updateRepeatButton();
  }
});

function togglePlay() {
  if (isPlaying) {
    pauseMusic();
  } else {
    playMusic();
  }
}

function playMusic() {
  if (!music.src) {
    console.error("No song source available");
    alert("No song loaded. Please select a song.");
    return;
  }
  isPlaying = true;
  playBtn.classList.replace("fa-play", "fa-pause");
  playBtn.setAttribute("title", "Pause");

  music.play().catch((error) => {
    console.error("Playback failed:", error);
    alert("Failed to play the song. Please try again.");
    isPlaying = false;
    playBtn.classList.replace("fa-pause", "fa-play");
  });
}

function pauseMusic() {
  isPlaying = false;
  playBtn.classList.replace("fa-pause", "fa-play");
  playBtn.setAttribute("title", "Play");
  music.pause();
}

function loadMusic(song) {
  console.log("Loading song:", song);
  
  if (!song) {
    console.error("Error: No song provided to load");
    return;
  }

  try {
    // Update the UI
    title.textContent = song.title || "Unknown Title";
    artist.textContent = song.artist || "Unknown Artist";
    
    // Set cover image with fallback
    const coverUrl = song.cover || "../../assets/default-cover.png";
    image.src = coverUrl;
    background.src = coverUrl;

    // Try to find the file in our selected files
    const fileName = song.fileName || song.title;
    const file = selectedFiles.get(fileName);

    if (file) {
      // Clean up previous blob URL
      if (music.src.startsWith('blob:')) {
        URL.revokeObjectURL(music.src);
      }
      
      // Create new blob URL
      const audioUrl = URL.createObjectURL(file);
      music.src = audioUrl;
      
      // Save current index
      localStorage.setItem("currentSongIndex", musicIndex);
      console.log("Song loaded successfully");
      
      // Start playing
      playMusic();
    } else {
      console.warn(`File not selected for song: ${fileName}`);
      if (songs.length > 1) {
        changeMusic(1); // Skip to next song if file not found and there are other songs
      } else {
        alert("No audio file selected for this song. Please select the file.");
        showFileSelectionModal();
      }
    }
  } catch (error) {
    console.error("Error loading song:", error);
    alert("Failed to load song: " + error.message);
    if (songs.length > 1) {
      changeMusic(1);
    }
  }
}

function changeMusic(direction) {
  if (isRepeating) {
    // If repeating, just replay the current song
    music.currentTime = 0;
    playMusic();
    return;
  }

  if (isShuffling) {
    // Pick a random song that's not the current one
    let newIndex;
    do {
      newIndex = Math.floor(Math.random() * songs.length);
    } while (newIndex === musicIndex && songs.length > 1);
    musicIndex = newIndex;
  } else {
    // Normal sequential playback
  musicIndex = (musicIndex + direction + songs.length) % songs.length;
  }

  loadMusic(songs[musicIndex]);
}

function toggleShuffle() {
  isShuffling = !isShuffling;
  localStorage.setItem("isShuffling", isShuffling);
  updateShuffleButton();

  if (isShuffling) {
    // Save current song
    const currentSong = songs[musicIndex];
    
    // Shuffle the songs array
    songs = [...songs].sort(() => Math.random() - 0.5);
    
    // Put current song first
    const currentIndex = songs.findIndex(song => 
      song.fileName === currentSong.fileName && song.title === currentSong.title
    );
    if (currentIndex !== -1) {
      songs.splice(currentIndex, 1);
      songs.unshift(currentSong);
    }
    
    musicIndex = 0;
    
    // Clear and request file selection again
    selectedFiles.clear();
    showFileSelectionModal();
  } else {
    // Restore original order
    const currentSong = songs[musicIndex];
    songs = [...originalSongs];
    
    // Find the current song in the original order
    musicIndex = songs.findIndex(song => 
      song.fileName === currentSong.fileName && song.title === currentSong.title
    );
    if (musicIndex === -1) musicIndex = 0;
    
    // Clear and request file selection again
    selectedFiles.clear();
    showFileSelectionModal();
  }
}

function toggleRepeat() {
  isRepeating = !isRepeating;
  localStorage.setItem("isRepeating", isRepeating);
  updateRepeatButton();
}

function updateShuffleButton() {
  if (isShuffling) {
    shuffleBtn.classList.add("active");
  } else {
    shuffleBtn.classList.remove("active");
  }
}

function updateRepeatButton() {
  if (isRepeating) {
    repeatBtn.classList.add("active");
  } else {
    repeatBtn.classList.remove("active");
  }
}

function updateProgressBar() {
  const { duration, currentTime } = music;
  const progressPercent = (currentTime / duration) * 100;
  progress.style.width = `${progressPercent}%`;

  const formatTime = (time) => String(Math.floor(time)).padStart(2, "0");
  durationEl.textContent = `${formatTime(duration / 60)}:${formatTime(
    duration % 60
  )}`;
  currentTimeEl.textContent = `${formatTime(currentTime / 60)}:${formatTime(
    currentTime % 60
  )}`;
}

function setProgressBar(e) {
  const width = playerProgress.clientWidth;
  const clickX = e.offsetX;
  music.currentTime = (clickX / width) * music.duration;
}

// Event Listeners
playBtn.addEventListener("click", togglePlay);
prevBtn.addEventListener("click", () => changeMusic(-1));
nextBtn.addEventListener("click", () => changeMusic(1));
shuffleBtn.addEventListener("click", toggleShuffle);
repeatBtn.addEventListener("click", toggleRepeat);
music.addEventListener("ended", () => changeMusic(1));
music.addEventListener("timeupdate", updateProgressBar);
playerProgress.addEventListener("click", setProgressBar);

// Load the first song on page load
loadMusic(songs[musicIndex]);

/* Sidebar functionality */
const toggleDropdown = (dropdown, menu, isOpen) => {
  dropdown.classList.toggle("open", isOpen);
  menu.style.height = isOpen ? `${menu.scrollHeight}px` : 0;
};

const closeAllDropdowns = () => {
  document
    .querySelectorAll(".dropdown-container.open")
    .forEach((openDropdown) => {
      toggleDropdown(
        openDropdown,
        openDropdown.querySelector(".dropdown-menu"),
        false
      );
    });
};

document.querySelectorAll(".dropdown-toggle").forEach((dropdownToggle) => {
  dropdownToggle.addEventListener("click", (e) => {
    e.preventDefault();
    const dropdown = dropdownToggle.closest(".dropdown-container");
    const menu = dropdown.querySelector(".dropdown-menu");
    const isOpen = dropdown.classList.contains("open");
    closeAllDropdowns();
    toggleDropdown(dropdown, menu, !isOpen);
  });
});

document
  .querySelectorAll(".sidebar-toggler, .sidebar-menu-button")
  .forEach((button) => {
    button.addEventListener("click", () => {
      closeAllDropdowns();
      document.querySelector(".sidebar").classList.toggle("collapsed");
    });
  });

if (window.innerWidth <= 1024) {
  document.querySelector(".sidebar").classList.add("collapsed");
}

// Clean up object URLs when the page is unloaded
window.addEventListener('beforeunload', () => {
  if (music.src.startsWith('blob:')) {
    URL.revokeObjectURL(music.src);
  }
});

// Event Listeners for file selection
document.getElementById('selectFilesButton').addEventListener('click', () => {
  songFileInput.click();
});

songFileInput.addEventListener("change", (event) => {
  if (event.target.files && event.target.files.length > 0) {
    handleFileSelection(event.target.files);
  }
});
