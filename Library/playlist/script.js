import { addSong, getSongs } from "../../assets/indexedDB.js";

document.addEventListener("DOMContentLoaded", async function () {
  try {
    // Show loading state
    document.getElementById("loading").style.display = "flex";
    
    let playlistData = JSON.parse(localStorage.getItem("currentPlaylist")) || null;

  if (playlistData) {
      try {
        // Sync with IndexedDB
        const dbSongs = await getSongs();
        console.log("Retrieved songs from IndexedDB:", dbSongs);
        
        // Map the songs, keeping existing data if found in IndexedDB
        playlistData.songs = playlistData.songs.map(song => {
          const dbSong = dbSongs.find(s => s.id === song.id);
          return dbSong || song;
        });
        
        updatePlaylistUI(playlistData);
        console.log("Playlist loaded successfully");
      } catch (dbError) {
        console.error("Error syncing with IndexedDB:", dbError);
        // Still update UI with localStorage data if IndexedDB fails
    updatePlaylistUI(playlistData);
      }
  } else {
      document.getElementById("playlistTitle").textContent = "Playlist Not Found!";
      showErrorMessage("No playlist data found");
  }

  setupEventListeners();
  } catch (error) {
    console.error("Error initializing playlist:", error);
    showErrorMessage("Failed to load playlist");
  } finally {
    // Hide loading state
    document.getElementById("loading").style.display = "none";
  }
});

// ✅ Funktion zur Aktualisierung der Playlist-UI
function updatePlaylistUI(playlistData) {
  try {
    if (!playlistData) {
      throw new Error("No playlist data provided");
    }

  document.getElementById("playlistTitle").textContent =
    playlistData.name || "Untitled Playlist";
    
  document.getElementById("playlistCover").src =
    playlistData.cover ||
    "https://upload.wikimedia.org/wikipedia/commons/a/ac/No_image_available.svg";
    
    document.getElementById("songCount").textContent = 
      `${playlistData.songs ? playlistData.songs.length : 0} Songs`;

  const songList = document.getElementById("songList");
  songList.innerHTML = "";

    if (playlistData.songs && playlistData.songs.length > 0) {
  playlistData.songs.forEach((song, index) => {
    addSongToList(song, index);
  });
    }

  localStorage.setItem("currentPlaylist", JSON.stringify(playlistData));
  } catch (error) {
    console.error("Error updating playlist UI:", error);
    // Don't show error message here since it might be called during error recovery
  }
}

let isRemoveMode = false;

function setupEventListeners() {
  console.log("📌 Initializing Event Listeners...");

  const editTitleButton = document.getElementById("editTitleButton");
  const addSongButton = document.getElementById("addSongButton");
  const removeSongButton = document.getElementById("removeSongButton");
  const playButton = document.getElementById("playButton");
  const shuffleButton = document.getElementById("shuffleButton");
  const fileInput = document.getElementById("fileInput");
  const songList = document.getElementById("songList");
  const normalPlayerBtn = document.getElementById("normalPlayer");
  const vinylPlayerBtn = document.getElementById("vinylPlayer");

  if (editTitleButton) {
    editTitleButton.addEventListener("click", function () {
      let playlistData = JSON.parse(localStorage.getItem("currentPlaylist"));
      if (playlistData) {
        document.getElementById("editTitleModal").style.display = "flex";
        document.getElementById("newPlaylistTitle").value = playlistData.name;
      }
    });
  }

  if (addSongButton) {
    addSongButton.addEventListener("click", function () {
      fileInput.click();
    });
  }

  if (removeSongButton) {
    removeSongButton.addEventListener("click", function() {
      isRemoveMode = !isRemoveMode;
      songList.classList.toggle("remove-mode");
      removeSongButton.classList.toggle("active");
      removeSongButton.innerHTML = isRemoveMode ? 
        '<span class="material-symbols-rounded">close</span>Done' : 
        '<span class="material-symbols-rounded">remove</span>Remove Songs';
    });
  }

  if (playButton) {
    playButton.addEventListener("click", async function() {
      let currentPlaylist = JSON.parse(localStorage.getItem("currentPlaylist"));
      if (!currentPlaylist || !currentPlaylist.songs || currentPlaylist.songs.length === 0) {
        showErrorMessage("This playlist has no songs to play!");
        return;
      }

      try {
        console.log("Current playlist before playing:", currentPlaylist);

        // Ensure each song has the required properties
        const validatedSongs = currentPlaylist.songs.map(song => ({
          title: song.title || "Unknown Title",
          artist: song.artist || "Unknown Artist",
          cover: song.cover || "https://upload.wikimedia.org/wikipedia/commons/a/ac/No_image_available.svg",
          audioUrl: song.audioUrl,
          fileName: song.fileName
        }));

        console.log("Validated songs:", validatedSongs);

        // Save the validated songs
        localStorage.setItem("currentPlayingPlaylist", JSON.stringify(validatedSongs));
        localStorage.setItem("currentSongIndex", "0");

        // Get the selected player design from settings
        const playerDesign = localStorage.getItem("playerDesign") || "normal";
        
        // Redirect to the appropriate player
        if (playerDesign === "vinyl") {
          window.location.href = "../../player/player-vinyl/player-vinyl.html";
        } else {
          window.location.href = "../../player/player/player.html";
        }
      } catch (error) {
        console.error("Error preparing playlist for playback:", error);
        showErrorMessage("Failed to prepare playlist for playback");
      }
    });
  }

  if (normalPlayerBtn) {
    normalPlayerBtn.addEventListener("click", function() {
      window.location.href = "../../player/player/player.html";
    });
  }

  if (vinylPlayerBtn) {
    vinylPlayerBtn.addEventListener("click", function() {
      window.location.href = "../../player/player-vinyl/player-vinyl.html";
    });
  }

  if (shuffleButton) {
    shuffleButton.addEventListener("click", async function() {
      let currentPlaylist = JSON.parse(localStorage.getItem("currentPlaylist"));
      if (!currentPlaylist || !currentPlaylist.songs || currentPlaylist.songs.length === 0) {
        showErrorMessage("This playlist has no songs to shuffle!");
        return;
      }

      try {
        // Save the shuffled list
        const shuffledSongs = [...currentPlaylist.songs].sort(() => Math.random() - 0.5);
        localStorage.setItem("currentPlayingPlaylist", JSON.stringify(shuffledSongs));
        localStorage.setItem("currentSongIndex", "0");
        localStorage.setItem("isShuffling", "true");

        // Get the selected player design from settings
        const playerDesign = localStorage.getItem("playerDesign") || "normal";
        
        // Redirect to the appropriate player
        if (playerDesign === "vinyl") {
          window.location.href = "../../player/player-vinyl/player-vinyl.html";
        } else {
          window.location.href = "../../player/player/player.html";
        }
      } catch (error) {
        console.error("Error shuffling playlist:", error);
        showErrorMessage("Failed to shuffle playlist");
      }
    });
  }

  if (fileInput) {
    fileInput.addEventListener("change", handleFileSelect);
  }

  // Event delegation for remove buttons
  if (songList) {
    songList.addEventListener("click", function(e) {
      if (e.target.classList.contains("remove-song") && isRemoveMode) {
        const songItem = e.target.closest(".song-item");
        if (songItem) {
          const index = parseInt(songItem.dataset.id);
          removeSongFromPlaylist(index);
        }
      }
    });
  }
}

async function handleFileSelect(event) {
  let file = event.target.files[0];
  console.log("📂 File selected:", file);

  if (file) {
    if (!file.type.startsWith('audio/')) {
      showErrorMessage("Please select a valid audio file");
      return;
    }

    try {
      document.getElementById("loading").style.display = "flex";
      
      let songName = file.name.replace(/\.(mp3|wav|ogg|m4a)$/i, "").trim();
      console.log("Processing song:", songName);

      let songData = await fetchSongMetadata(songName);
      console.log("Metadata fetched:", songData);

      // Create a blob URL for the file
      const audioUrl = URL.createObjectURL(file);
      console.log("Created audio URL:", audioUrl);

      let newSong = {
        title: songData.title || songName,
        artist: songData.artist || "Unknown Artist",
        cover: songData.cover ||
          "https://upload.wikimedia.org/wikipedia/commons/a/ac/No_image_available.svg",
        length: "Unknown",
        audioUrl: audioUrl,
        fileName: file.name
      };

      console.log("New song object:", newSong);

      // Show manual entry form if metadata is incomplete
      if (!songData.artist || !songData.cover) {
        showManualEntryForm(newSong);
        return;
      }

      await handleNewSong(newSong);
    } catch (error) {
      console.error("Error processing song:", error);
      showErrorMessage("Failed to process song: " + (error.message || "Unknown error"));
    } finally {
      document.getElementById("loading").style.display = "none";
    }
  }
}

function showManualEntryForm(song) {
  const manualEntry = document.getElementById("manualEntryForm");
  manualEntry.classList.add("show");
  
  document.getElementById("manualTitle").value = song.title || "";
  document.getElementById("manualArtist").value = song.artist || "";
  document.getElementById("manualCover").value = song.cover || "";

  const confirmButton = document.getElementById("confirmManualEntry");
  const handleConfirm = async () => {
    const newSong = {
      title: document.getElementById("manualTitle").value || song.title,
      artist: document.getElementById("manualArtist").value || "Unknown Artist",
      cover: document.getElementById("manualCover").value || 
        "https://upload.wikimedia.org/wikipedia/commons/a/ac/No_image_available.svg",
      length: "Unknown",
      audioUrl: song.audioUrl
    };

    try {
      await handleNewSong(newSong);
    } catch (error) {
      console.error("Error adding song:", error);
      showErrorMessage("Failed to add song: " + (error.message || "Unknown error"));
    } finally {
      manualEntry.classList.remove("show");
      confirmButton.removeEventListener("click", handleConfirm);
    }
  };

  confirmButton.addEventListener("click", handleConfirm);
}

async function handleNewSong(newSong) {
  // Check for duplicates
  let playlistData = JSON.parse(localStorage.getItem("currentPlaylist")) || { songs: [] };
  const isDuplicate = playlistData.songs.some(
    song => song.title === newSong.title && song.artist === newSong.artist
  );

  if (isDuplicate) {
    showModal("duplicateSongModal");

    const confirmButton = document.getElementById("confirmDuplicate");
    const cancelButton = document.getElementById("cancelDuplicate");
    
    return new Promise((resolve, reject) => {
      const handleConfirm = async () => {
        try {
          await addSongToPlaylist(newSong);
          hideModal("duplicateSongModal");
          resolve();
        } catch (error) {
          console.error("Error adding duplicate song:", error);
          showErrorMessage("Failed to add duplicate song: " + (error.message || "Unknown error"));
          reject(error);
        } finally {
          confirmButton.removeEventListener("click", handleConfirm);
          cancelButton.removeEventListener("click", handleCancel);
        }
      };
      
      const handleCancel = () => {
        hideModal("duplicateSongModal");
        confirmButton.removeEventListener("click", handleConfirm);
        cancelButton.removeEventListener("click", handleCancel);
        resolve();
      };

      confirmButton.addEventListener("click", handleConfirm);
      cancelButton.addEventListener("click", handleCancel);
    });
  } else {
    await addSongToPlaylist(newSong);
  }
}

async function addSongToPlaylist(newSong) {
  try {
    console.log("Adding song to playlist:", newSong.title);
    
    // Save to IndexedDB first
    const songId = await addSong(newSong);
    console.log("Song reference saved to IndexedDB with ID:", songId);
    newSong.id = songId;

    // Update playlist in localStorage
    let playlistData = JSON.parse(localStorage.getItem("currentPlaylist")) || { songs: [] };
    playlistData.songs.push(newSong);
    localStorage.setItem("currentPlaylist", JSON.stringify(playlistData));

    // Update UI
    addSongToList(newSong, playlistData.songs.length - 1);
    updateSongCount();
    updateLibraryData();

    showSuccessMessage("Song added successfully!");
  } catch (error) {
    console.error("Error saving song:", error);
    throw error;
  }
}

document.getElementById("saveNewTitle").addEventListener("click", function () {
  let newTitle = document.getElementById("newPlaylistTitle").value.trim();
  if (newTitle) {
    let playlistData = JSON.parse(localStorage.getItem("currentPlaylist"));
    if (playlistData) {
      playlistData.originalName = playlistData.name;
      playlistData.name = newTitle;
      updatePlaylistUI(playlistData);
      updateLibraryData();
    }
  }
  document.getElementById("editTitleModal").style.display = "none";
});

document.getElementById("cancelEditTitle").addEventListener("click", function () {
    document.getElementById("editTitleModal").style.display = "none";
  });

document.getElementById("coverUpload").addEventListener("change", function (event) {
    let file = event.target.files[0];
  if (!file) return;

  // Check file type
  if (!file.type.startsWith('image/')) {
    showErrorMessage("Please select a valid image file (JPG, PNG, etc.)");
    return;
  }

  // Check file size (max 2MB)
  const maxSize = 2 * 1024 * 1024; // 2MB in bytes
  if (file.size > maxSize) {
    const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
    showErrorMessage(
      `Image is too large (${sizeMB}MB). Please use an image smaller than 2MB. Try resizing the image or choosing a different one.`
    );
    return;
  }

      let reader = new FileReader();
  
      reader.onload = function (e) {
    // Create an image element to check dimensions
    let img = new Image();
    img.onload = function() {
      // Check if image dimensions are reasonable (max 1500x1500)
      if (img.width > 1500 || img.height > 1500) {
        showErrorMessage(
          `Image dimensions (${img.width}x${img.height}) are too large. Please use an image smaller than 1500x1500 pixels. Try resizing the image or choosing a different one.`
        );
        return;
      }

        let playlistData = JSON.parse(localStorage.getItem("currentPlaylist"));
        if (playlistData) {
        try {
          playlistData.cover = e.target.result;
          updatePlaylistUI(playlistData);
          updateLibraryData();
          showSuccessMessage("Cover image updated successfully!");
        } catch (error) {
          console.error("Error updating cover:", error);
          showErrorMessage("Failed to update cover image. Please try again with a different image.");
        }
      }
    };

    img.onerror = function() {
      showErrorMessage("Failed to load image. Please try another file format (JPG or PNG recommended).");
    };

    img.src = e.target.result;
  };

  reader.onerror = function() {
    showErrorMessage("Failed to read image file. Please try another image.");
  };

  try {
    reader.readAsDataURL(file);
  } catch (error) {
    console.error("Error reading file:", error);
    showErrorMessage("Failed to process image. Please try a different image file.");
    }
  });

// ✅ UI-Update-Funktion verbessert
function addSongToList(song, index) {
  let songItem = document.createElement("div");
  songItem.classList.add("song-item");
  songItem.dataset.id = index;

  songItem.innerHTML = `
          <img src="${song.cover}" alt="Song Cover" class="song-cover">
          <div class="song-info">
            <p class="song-title">${song.title}</p>
            <p class="song-artist">${song.artist}</p>
          </div>
          <button class="remove-song" onclick="removeSongFromPlaylist(${index})">❌</button>
        `;

  document.getElementById("songList").appendChild(songItem);
}

// ✅ Song-Anzahl aktualisieren
function updateSongCount() {
  let playlistData = JSON.parse(localStorage.getItem("currentPlaylist"));
  if (playlistData) {
    document.getElementById("songCount").textContent = `${playlistData.songs.length} Songs`;
  }
}

document.getElementById("backToLibrary").addEventListener("click", function () {
  window.location.href = "/Library/library.html";
});

// ✅ Song aus der Playlist entfernen
function removeSongFromPlaylist(index) {
  let playlistData = JSON.parse(localStorage.getItem("currentPlaylist"));
  if (playlistData) {
    playlistData.songs.splice(index, 1);
    localStorage.setItem("currentPlaylist", JSON.stringify(playlistData));
    updatePlaylistUI(playlistData);
    updateLibraryData();
  }
}

// ✅ Song-Metadaten abrufen
async function fetchSongMetadata(title) {
  console.log("🔍 Searching for:", title);

  try {
    let response = await fetch(
      `https://itunes.apple.com/search?term=${encodeURIComponent(title)}&limit=1`
    );

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    let data = await response.json();

    if (data.results.length > 0) {
      let song = data.results[0];
      return {
        artist: song.artistName || "Unknown Artist",
        title: song.trackName || title,
        cover: song.artworkUrl100
          ? song.artworkUrl100.replace(/\d+x\d+/, "300x300")
          : "https://upload.wikimedia.org/wikipedia/commons/a/ac/No_image_available.svg",
      };
    } else {
      return { artist: "Unknown Artist", title, cover: null };
    }
  } catch (error) {
    console.error("❌ Error fetching song metadata:", error);
    return { artist: "Unknown Artist", title, cover: null };
  }
}

// ✅ Update Library Data
function updateLibraryData() {
  let playlists = JSON.parse(localStorage.getItem("playlists")) || [];
  let updatedPlaylist = JSON.parse(localStorage.getItem("currentPlaylist"));

  if (!updatedPlaylist || !updatedPlaylist.id) {
    console.error("No valid playlist data to update");
    return;
  }

  // Find the playlist index by ID
  let index = playlists.findIndex((p) => p.id === updatedPlaylist.id);
  
  if (index !== -1) {
    // Update all playlist properties
    playlists[index] = {
      ...playlists[index],           // Keep any existing properties
      ...updatedPlaylist,            // Update with new properties
      id: updatedPlaylist.id,        // Ensure ID is preserved
      name: updatedPlaylist.name,    // Update name
      cover: updatedPlaylist.cover,  // Update cover
      songs: updatedPlaylist.songs   // Update songs
    };
    
    // Save back to localStorage
  localStorage.setItem("playlists", JSON.stringify(playlists));
    console.log("Updated playlist in library:", playlists[index]);
  } else {
    console.error("Could not find playlist with ID:", updatedPlaylist.id);
  }
}

function showSuccessMessage(message) {
  const successMessage = document.getElementById("successMessage");
  successMessage.textContent = message;
  successMessage.style.display = "block";
  successMessage.style.padding = "15px 20px";
  successMessage.style.backgroundColor = "#28a745";
  successMessage.style.color = "white";
  successMessage.style.borderRadius = "5px";
  successMessage.style.margin = "10px 0";
  successMessage.style.boxShadow = "0 2px 4px rgba(0,0,0,0.2)";
  
  setTimeout(() => {
    successMessage.style.display = "none";
  }, 5000);
}

function showErrorMessage(message) {
  const errorMessage = document.getElementById("errorMessage");
  errorMessage.textContent = message;
  errorMessage.style.display = "block";
  errorMessage.style.padding = "15px 20px";
  errorMessage.style.backgroundColor = "#ff4444";
  errorMessage.style.color = "white";
  errorMessage.style.borderRadius = "5px";
  errorMessage.style.margin = "10px 0";
  errorMessage.style.boxShadow = "0 2px 4px rgba(0,0,0,0.2)";
  
  // Scroll the error message into view
  errorMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
  
  setTimeout(() => {
    errorMessage.style.display = "none";
  }, 7000); // Show for 7 seconds instead of 3
}

function showModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.style.display = "flex";
  }
}

function hideModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.style.display = "none";
  }
}
