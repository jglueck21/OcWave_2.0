document.addEventListener("DOMContentLoaded", function () {
  let playlistData = JSON.parse(localStorage.getItem("currentPlaylist"));

  if (playlistData) {
    document.getElementById("playlistTitle").textContent = playlistData.name;
    document.getElementById("playlistCover").src = playlistData.cover;
    document.getElementById(
      "songCount"
    ).textContent = `${playlistData.songs.length} Songs`;

    const songList = document.getElementById("songList");
    songList.innerHTML = "";

    playlistData.songs.forEach((song, index) => {
      addSongToList(song, index);
    });

    localStorage.setItem("currentPlaylist", JSON.stringify(playlistData));
  } else {
    document.getElementById("playlistTitle").textContent =
      "Playlist Not Found!";
  }

  // ✅ Handle Edit Name Modal
  document
    .getElementById("editTitleButton")
    .addEventListener("click", function () {
      document.getElementById("editTitleModal").style.display = "flex";
      document.getElementById("newPlaylistTitle").value = playlistData.name;
    });

  document
    .getElementById("saveNewTitle")
    .addEventListener("click", function () {
      let newTitle = document.getElementById("newPlaylistTitle").value.trim();
      if (newTitle) {
        playlistData.originalName = playlistData.name; // Store the old name
        playlistData.name = newTitle;
        document.getElementById("playlistTitle").textContent = newTitle;
        localStorage.setItem("currentPlaylist", JSON.stringify(playlistData));
        updateLibraryData(); // ✅ Update the library
      }
      document.getElementById("editTitleModal").style.display = "none";
    });

  document
    .getElementById("cancelEditTitle")
    .addEventListener("click", function () {
      document.getElementById("editTitleModal").style.display = "none";
    });

  // ✅ Handle Cover Upload
  document
    .getElementById("coverUpload")
    .addEventListener("change", function (event) {
      let file = event.target.files[0];

      if (file) {
        let reader = new FileReader();
        reader.onload = function (e) {
          let newCover = e.target.result;

          document.getElementById("playlistCover").src = newCover;
          playlistData.cover = newCover;

          localStorage.setItem("currentPlaylist", JSON.stringify(playlistData)); // ✅ Save to currentPlaylist
          updateLibraryData(); // ✅ Also update the library
        };
        reader.readAsDataURL(file);
      }
    });

  // ✅ Handle Adding Songs
  document
    .getElementById("addSongButton")
    .addEventListener("click", function () {
      document.getElementById("fileInput").click();
    });

  document
    .getElementById("fileInput")
    .addEventListener("change", async function (event) {
      let file = event.target.files[0];

      if (file) {
        let songPath = URL.createObjectURL(file); // Generate temporary URL
        let songName = file.name.replace(".mp3", "").trim();

        // Remove common junk from YouTube/Spotify downloaders
        let unwantedPrefixes = [
          "y2mate.com -",
          "spotifyDown",
          "mp3juices -",
          "savefrom.net -",
          "ytmp3 -",
          "yt1s.com -",
          "flvto -",
        ];

        let unwantedSuffixes = [
          "(Official Video)",
          "(Official Music Video)",
          "(Lyrics)",
          "(Audio)",
          "(Visualizer)",
          "(HD)",
          "(4K)",
          "(HQ)",
        ];

        // Remove any unwanted prefix
        unwantedPrefixes.forEach((prefix) => {
          if (songName.toLowerCase().startsWith(prefix.toLowerCase())) {
            songName = songName.substring(prefix.length).trim();
          }
        });

        // Remove any unwanted suffix
        unwantedSuffixes.forEach((suffix) => {
          if (songName.toLowerCase().endsWith(suffix.toLowerCase())) {
            songName = songName
              .substring(0, songName.length - suffix.length)
              .trim();
          }
        });

        console.log("🎵 Cleaned Song Name:", songName); // ✅ Debug cleaned name

        console.log("🎵 Uploaded Song:", songName); // ✅ Debug uploaded file name

        // Fetch metadata
        let songData = await fetchSongMetadata(songName);

        console.log("📡 API Fetched Data:", songData); // ✅ Check if metadata is returned

        let newSong = {
          title: songData.title || songName,
          artist: songData.artist || "Unknown Artist",
          cover:
            songData.cover ||
            "https://upload.wikimedia.org/wikipedia/commons/a/ac/No_image_available.svg",
          src: songPath,
        };

        let playlistData = JSON.parse(
          localStorage.getItem("currentPlaylist")
        ) || { songs: [] };
        playlistData.songs.push(newSong);

        localStorage.setItem("currentPlaylist", JSON.stringify(playlistData));
        addSongToList(newSong, playlistData.songs.length - 1);

        document.getElementById(
          "songCount"
        ).textContent = `${playlistData.songs.length} Songs`;
        showSuccessMessage("Song added successfully!");
      }
    });

  // ✅ Function to Add a Song to the Playlist
  async function addSongToPlaylist(artist, title) {
    document.getElementById("loading").style.display = "block";

    let songData = await fetchSongMetadata(artist, title);

    if (!songData.cover || songData.artist === "Unknown Artist") {
      console.warn("🚨 Missing metadata, showing manual entry popup.");

      // Show the manual input form and stop loading
      document.getElementById("loading").style.display = "none";
      showManualEntryForm(songData.title, songData.artist);

      return;
    }

    let newSong = {
      title: songData.title || title,
      artist: songData.artist || artist,
      cover: songData.cover,
    };

    playlistData.songs.push(newSong);
    addSongToList(newSong, playlistData.songs.length - 1);
    document.getElementById(
      "songCount"
    ).textContent = `${playlistData.songs.length} Songs`;
    localStorage.setItem("currentPlaylist", JSON.stringify(playlistData));

    document.getElementById("loading").style.display = "none";
    showSuccessMessage("Song added successfully!");
  }

  // ✅ Confirm Manual Song Entry
  document
    .getElementById("confirmManualEntry")
    .addEventListener("click", async function () {
      let title = document.getElementById("manualTitle").value.trim();
      let artist = document.getElementById("manualArtist").value.trim();

      if (!title) {
        alert("Please enter a song title.");
        return;
      }

      if (!playlistData.songs) {
        playlistData.songs = [];
      }

      document.getElementById("loading").style.display = "block";

      let songData = await fetchSongMetadata(artist, title);

      let newSong = {
        title: songData.title || title,
        artist: songData.artist || artist,
        cover: songData.cover || "https://via.placeholder.com/50",
      };

      playlistData.songs.push(newSong);
      addSongToList(newSong, playlistData.songs.length - 1);
      document.getElementById(
        "songCount"
      ).textContent = `${playlistData.songs.length} Songs`;
      localStorage.setItem("currentPlaylist", JSON.stringify(playlistData));

      document.getElementById("loading").style.display = "none";
      document.getElementById("manualEntryForm").style.display = "none";
      showSuccessMessage("Song added successfully!");
    });

  // ✅ Handle Removing Songs
  document
    .getElementById("removeSongButton")
    .addEventListener("click", function () {
      let songs = document.querySelectorAll(".song-item");

      songs.forEach((song, index) => {
        song.classList.toggle("removable");

        song.addEventListener("click", function removeHandler() {
          if (song.classList.contains("removable")) {
            playlistData.songs.splice(index, 1);
            song.remove();
            document.getElementById(
              "songCount"
            ).textContent = `${playlistData.songs.length} Songs`;
            localStorage.setItem(
              "currentPlaylist",
              JSON.stringify(playlistData)
            );

            showSuccessMessage("Song removed successfully!");
            song.removeEventListener("click", removeHandler);
          }
        });
      });
    });

  // ✅ Fetch Metadata Function
  async function fetchSongMetadata(title) {
    console.log("🔍 Searching for:", title); // ✅ Log search term

    try {
      let response = await fetch(
        `https://itunes.apple.com/search?term=${encodeURIComponent(
          title
        )}&limit=1`
      );

      console.log("📡 API Response:", response); // ✅ Debug API raw response

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      let data = await response.json();
      console.log("📡 API Full Response:", data); // ✅ Debug full response

      if (data.results.length > 0) {
        let song = data.results[0];
        console.log("🎵 Fetched Song Data:", song); // ✅ Debug song details

        return {
          artist: song.artistName || "Unknown Artist",
          title: song.trackName || title,
          cover: song.artworkUrl100
            ? song.artworkUrl100.replace(/\d+x\d+/, "300x300")
            : "https://upload.wikimedia.org/wikipedia/commons/a/ac/No_image_available.svg",
        };
      } else {
        console.warn("🚨 No API results for:", title); // ✅ Log if no song found
        return { artist: "Unknown Artist", title, cover: null };
      }
    } catch (error) {
      console.error("❌ Error fetching song metadata:", error);
      return { artist: "Unknown Artist", title, cover: null };
    }
  }

  // ✅ Show Manual Entry Form
  function showManualEntryForm(title, artist) {
    let form = document.getElementById("manualEntryForm");
    form.style.display = "block";
    document.getElementById("manualTitle").value = title;
    document.getElementById("manualArtist").value = artist;
  }

  // ✅ Show Success Message
  function showSuccessMessage(message) {
    let successDiv = document.getElementById("successMessage");
    successDiv.textContent = message;
    successDiv.style.display = "block";

    setTimeout(() => {
      successDiv.style.display = "none";
    }, 3000);
  }

  // ✅ Add Song to List
  function addSongToList(song, index) {
    let songItem = document.createElement("div");
    songItem.classList.add("song-item");

    songItem.innerHTML = `
        <p class="song-number">${index + 1}</p>
        <img src="${song.cover}" alt="Song Cover" class="song-cover">
        <div class="song-info">
          <p class="song-title">${song.title}</p>
          <p class="song-artist">${song.artist}</p>
        </div>
      `;

    document.getElementById("songList").appendChild(songItem);
  }
});

document.getElementById("backToLibrary").addEventListener("click", function () {
  window.location.href = "/Library/library.html";
});

function updateLibraryData() {
  let playlists = JSON.parse(localStorage.getItem("playlists")) || [];
  let updatedPlaylist = JSON.parse(localStorage.getItem("currentPlaylist"));

  let index = playlists.findIndex((p) => p.id === updatedPlaylist.id); // ✅ Find by ID, not name
  if (index !== -1) {
    playlists[index] = updatedPlaylist; // ✅ Update the correct playlist
  }

  localStorage.setItem("playlists", JSON.stringify(playlists)); // ✅ Save updated library
}

document.querySelector(".play-button").addEventListener("click", function () {
  let currentPlaylist = JSON.parse(localStorage.getItem("currentPlaylist"));

  if (currentPlaylist.songs.length === 0) {
    alert("This playlist has no songs to play!");
    return;
  }

  localStorage.setItem(
    "currentPlayingPlaylist",
    JSON.stringify(currentPlaylist.songs)
  ); // ✅ Save songs for the player
  localStorage.setItem("currentSongIndex", "0"); // ✅ Start at the first song

  window.location.href = "../../player/player.html"; // ✅ Redirect to the player
});

let db;
const DB_NAME = "MusicAppDB";
const STORE_NAME = "playlists";
const DB_VERSION = 1;

// Open IndexedDB
function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = function (event) {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "name" });
      }
    };

    request.onsuccess = function (event) {
      db = event.target.result;
      resolve(db);
    };

    request.onerror = function (event) {
      reject("IndexedDB error: " + event.target.errorCode);
    };
  });
}
