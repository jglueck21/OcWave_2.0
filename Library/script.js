// Load Playlists from Local Storage
let playlists = JSON.parse(localStorage.getItem("playlists")) || [];
let currentPlaylistIndex = null; // Track which playlist is open
let isDeleteMode = false; // ✅ Tracks if delete mode is active
let playlistToDeleteIndex = null; // ✅ Stores which playlist is being deleted

// Function to Render Playlists
function renderPlaylists() {
  playlists = JSON.parse(localStorage.getItem("playlists")) || [];

  const playlistContainer = document.getElementById("playlistContainer");
  playlistContainer.innerHTML = ""; // Clear current list

  playlists.forEach((playlist, index) => {
    const div = document.createElement("div");
    div.classList.add("playlist");

    div.innerHTML = `
          <img src="${playlist.cover}" alt="Playlist Cover">
          <h3>${playlist.name}</h3>
          <p>${playlist.songs ? playlist.songs.length : 0} Songs</p>
      `;

    div.addEventListener("click", function () {
      if (isDeleteMode) {
        confirmPlaylistDeletion(index); // ✅ Show confirmation popup
      } else {
        openPlaylist(index);
      }
    });

    playlistContainer.appendChild(div);
  });

  localStorage.setItem("playlists", JSON.stringify(playlists));
}

// Function to Open a Playlist (Redirect to Playlist View)
function openPlaylist(index) {
  const playlist = playlists[index];

  localStorage.setItem(
    "currentPlaylist",
    JSON.stringify({
      id: playlist.id, // ✅ Store unique ID
      name: playlist.name,
      cover: playlist.cover,
      songs: playlist.songs || [],
    })
  );

  window.location.href = "./playlist/playlist.html";
}

document.getElementById("addPlaylist").addEventListener("click", addPlaylist);

function addPlaylist() {
  let newPlaylist = {
    id: Date.now(), // ✅ Assign a unique ID using timestamp
    name: "New Playlist",
    cover: "https://i.scdn.co/image/ab67616d0000b27350904eaae45e83944df52cb8",
    songs: [],
  };

  playlists.push(newPlaylist);
  localStorage.setItem("playlists", JSON.stringify(playlists)); // ✅ Save new playlist
  renderPlaylists();
}

// ✅ Step 1: Show "Click a Playlist to Delete" Popup
document
  .getElementById("removePlaylist")
  .addEventListener("click", function () {
    isDeleteMode = true;
    document.getElementById("deletePlaylistPopup").style.display = "block"; // ✅ Show first popup
  });

// ✅ Step 2: Cancel Delete Mode
document.getElementById("cancelDelete").addEventListener("click", function () {
  isDeleteMode = false;
  document.getElementById("deletePlaylistPopup").style.display = "none"; // ✅ Hide popup
});

// ✅ Step 3: Show Confirmation Popup Before Deleting
function confirmPlaylistDeletion(index) {
  playlistToDeleteIndex = index;
  document.getElementById(
    "confirmDeleteMessage"
  ).textContent = `Are you sure you want to delete "${playlists[index].name}"?`;

  document.getElementById("confirmDeletePopup").style.display = "block"; // ✅ Show confirmation popup
  document.getElementById("deletePlaylistPopup").style.display = "none"; // ✅ Hide first popup
}

// ✅ Step 4: Confirm Deletion
document.getElementById("confirmDelete").addEventListener("click", function () {
  if (playlistToDeleteIndex !== null) {
    playlists.splice(playlistToDeleteIndex, 1);
    localStorage.setItem("playlists", JSON.stringify(playlists));
    renderPlaylists();

    // ✅ Hide popups and exit delete mode
    isDeleteMode = false;
    playlistToDeleteIndex = null;
    document.getElementById("confirmDeletePopup").style.display = "none";
  }
});

// ✅ Step 5: Cancel Playlist Deletion
document
  .getElementById("cancelConfirmDelete")
  .addEventListener("click", function () {
    document.getElementById("confirmDeletePopup").style.display = "none"; // ✅ Hide confirmation popup
    document.getElementById("deletePlaylistPopup").style.display = "block"; // ✅ Show first popup again
  });

// Initial Render when Page Loads
renderPlaylists();

/* ------------------------------------- Sidebar ----------------------------------- */
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
if (window.innerWidth <= 1024) {
  document.querySelector(".sidebar").classList.add("collapsed");
}
