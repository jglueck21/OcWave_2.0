function setTheme(theme) {
  let themeColors = {
    blue: "#007bff",
    cyan: "#00a5b0",
    orange: "#ff7f00",
    purple: "#8e44ad",
    pink: "#ff5e78",
    gray: "#6c757d",
    yellow: "#f1c40f",
    green: "#28a745",
    brown: "#8b5a2b",
  };

  let newColor = themeColors[theme] || "#007bff"; // Default to blue if theme not found

  // Apply to both sidebar and accent color
  document.documentElement.style.setProperty("--sidebar-bg", newColor);
  document.documentElement.style.setProperty("--accent-color", newColor);

  // Save the color selection in localStorage
  localStorage.setItem("sidebar-theme", newColor);
}

// Apply saved theme on page load
window.onload = function () {
  let savedColor = localStorage.getItem("sidebar-theme");
  if (savedColor) {
    document.documentElement.style.setProperty("--sidebar-bg", savedColor);
    document.documentElement.style.setProperty("--accent-color", savedColor);
  }
};

// Load saved design from localStorage (default to "design1")
let selectedDesign = localStorage.getItem("playerDesign") || "normal"; // Default to Normal

function selectDesign(designId) {
  selectedDesign = designId;
  localStorage.setItem("playerDesign", selectedDesign);

  // Show popup
  showPopup(`${designId === "normal" ? "Normal" : "Vinyl"} Design saved!`);

  // Update the sidebar link immediately
  updatePlayerLink();
}

function showPopup(message) {
  const popup = document.getElementById("popup");
  popup.textContent = message;
  popup.style.display = "block";
  popup.style.opacity = "1";

  setTimeout(() => {
    popup.style.opacity = "0";
    setTimeout(() => {
      popup.style.display = "none";
    }, 500); // Wait for opacity transition before hiding
  }, 7000); // Show for 7 seconds
}

function updatePlayerLink() {
  let playerLink = document.getElementById("player-link");

  if (playerLink) {
    if (selectedDesign === "normal") {
      playerLink.href = "/player/player/player.html";
    } else if (selectedDesign === "vinyl") {
      playerLink.href = "/player/player-vinyl/player-vinyl.html";
    }
  }
}

// Run function when page loads
document.addEventListener("DOMContentLoaded", updatePlayerLink);
