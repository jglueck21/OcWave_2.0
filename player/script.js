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
  background = document.getElementById("bg-img");

const music = new Audio();
let songs = JSON.parse(localStorage.getItem("currentPlayingPlaylist")) || []; // ✅ Load songs from localStorage
let musicIndex = parseInt(localStorage.getItem("currentSongIndex")) || 0;
let isPlaying = false;

// ✅ Load and play the first song from the playlist
document.addEventListener("DOMContentLoaded", function () {
  if (songs.length === 0) {
    alert("No songs found in the playlist.");
    return;
  }
  loadMusic(songs[musicIndex]);
  playMusic();
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
    alert("No song loaded. Please select a song.");
    return;
  }
  isPlaying = true;
  playBtn.classList.replace("fa-play", "fa-pause");
  playBtn.setAttribute("title", "Pause");

  music.play().catch((error) => {
    console.error("Playback failed:", error);
    alert("Failed to play the song. Check the file path.");
  });
}

function pauseMusic() {
  isPlaying = false;
  playBtn.classList.replace("fa-pause", "fa-play");
  playBtn.setAttribute("title", "Play");
  music.pause();
}

// ✅ Load the selected song
// ✅ Load the selected song
function loadMusic(song) {
  if (!song || !song.src) {
    alert("Error: Song file not found!");
    console.error("Error: The song object is missing or has no src:", song);
    return;
  }

  console.log("Trying to load song:", song); // ✅ Debug the whole song object
  console.log("Song file path:", song.src); // ✅ Debug the file path specifically

  music.src = song.src; // ✅ Load the song file path
  title.textContent = song.displayName;
  artist.textContent = song.artist;
  image.src = song.cover;
  background.src = song.cover;

  localStorage.setItem("currentSongIndex", musicIndex); // ✅ Save current song index
}

function changeMusic(direction) {
  musicIndex = (musicIndex + direction + songs.length) % songs.length;
  loadMusic(songs[musicIndex]);
  playMusic();
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

playBtn.addEventListener("click", togglePlay);
prevBtn.addEventListener("click", () => changeMusic(-1));
nextBtn.addEventListener("click", () => changeMusic(1));
music.addEventListener("ended", () => changeMusic(1));
music.addEventListener("timeupdate", updateProgressBar);
playerProgress.addEventListener("click", setProgressBar);

// ✅ Load the first song on page load
loadMusic(songs[musicIndex]);

/* --------------------------------------------------------------- */
// Toggle the visibility of a dropdown menu
const toggleDropdown = (dropdown, menu, isOpen) => {
  dropdown.classList.toggle("open", isOpen);
  menu.style.height = isOpen ? `${menu.scrollHeight}px` : 0;
};

// Close all open dropdowns
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

// Attach click event to all dropdown toggles
document.querySelectorAll(".dropdown-toggle").forEach((dropdownToggle) => {
  dropdownToggle.addEventListener("click", (e) => {
    e.preventDefault();

    const dropdown = dropdownToggle.closest(".dropdown-container");
    const menu = dropdown.querySelector(".dropdown-menu");
    const isOpen = dropdown.classList.contains("open");

    closeAllDropdowns(); // Close all open dropdowns
    toggleDropdown(dropdown, menu, !isOpen); // Toggle current dropdown visibility
  });
});

// Attach click event to sidebar toggle buttons
document
  .querySelectorAll(".sidebar-toggler, .sidebar-menu-button")
  .forEach((button) => {
    button.addEventListener("click", () => {
      closeAllDropdowns(); // Close all open dropdowns
      document.querySelector(".sidebar").classList.toggle("collapsed"); // Toggle collapsed class on sidebar
    });
  });

// Collapse sidebar by default on small screens
if (window.innerWidth <= 1024)
  document.querySelector(".sidebar").classList.add("collapsed");
