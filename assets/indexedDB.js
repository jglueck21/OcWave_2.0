const DB_NAME = "OcWave";
const DB_VERSION = 1;
const STORE_NAME = "songs";

// Function to check available storage space
async function checkStorageQuota() {
  if (navigator.storage && navigator.storage.estimate) {
    const estimate = await navigator.storage.estimate();
    const usedPercentage = (estimate.usage / estimate.quota) * 100;
    console.log(`Storage quota: ${estimate.quota} bytes`);
    console.log(`Storage usage: ${estimate.usage} bytes`);
    console.log(`Storage usage percentage: ${usedPercentage.toFixed(2)}%`);
    return {
      ...estimate,
      usedPercentage
    };
  }
  return null;
}

// Function to clear old data if needed
async function clearOldDataIfNeeded() {
  try {
    const estimate = await checkStorageQuota();
    if (estimate) {
      // If storage usage is above 80%, try to clear some space
      if (estimate.usedPercentage > 80) {
        console.log("Storage usage high, attempting to clear old data...");
        
        // Get all songs and sort by last accessed
        const songs = await getSongs();
        if (songs.length > 10) { // Keep at least 10 songs
          // Sort songs by last accessed (if available) or by ID
          songs.sort((a, b) => {
            if (a.lastAccessed && b.lastAccessed) {
              return a.lastAccessed - b.lastAccessed;
            }
            return a.id - b.id;
          });
          
          // Remove the oldest 20% of songs
          const songsToRemove = Math.floor(songs.length * 0.2);
          console.log(`Removing ${songsToRemove} old songs to free up space`);
          
          for (let i = 0; i < songsToRemove; i++) {
            await deleteSong(songs[i].id);
          }
          
          return true; // Space was cleared
        }
      }
    }
    return false; // No space was cleared
  } catch (error) {
    console.error("Error managing storage:", error);
    return false;
  }
}

// Open or create the database
function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, {
          keyPath: "id",
          autoIncrement: true,
        });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function getDB() {
  return new Promise((resolve, reject) => {
    let request = indexedDB.open("OcWave", 1);

    request.onsuccess = function (event) {
      let db = event.target.result;
      console.log("✅ IndexedDB erfolgreich geöffnet:", db);

      // Prüfe, welche Object Stores existieren
      console.log("📦 Verfügbare Object Stores:", db.objectStoreNames);

      resolve(db);
    };

    request.onerror = function (event) {
      console.error("❌ Fehler beim Öffnen von IndexedDB:", event.target.error);
      reject(event.target.error);
    };
  });
}

async function addSong(song) {
  return new Promise(async (resolve, reject) => {
    try {
      const db = await openDatabase();
  const transaction = db.transaction(STORE_NAME, "readwrite");
  const store = transaction.objectStore(STORE_NAME);

      // Store only the file path and metadata, not the file content
      const songToStore = {
        title: song.title,
        artist: song.artist,
        cover: song.cover,
    length: song.length || "Unknown",
        filePath: song.src, // This should be the local file path
      };

      const request = store.add(songToStore);

      transaction.oncomplete = () => {
        console.log("✅ Song reference added to IndexedDB");
        resolve(request.result);
        db.close();
      };

      transaction.onerror = (event) => {
        console.error("❌ Transaction error:", event.target.error);
        reject(event.target.error);
        db.close();
      };

    } catch (error) {
      console.error("❌ Error in addSong:", error);
      reject(error);
    }
  });
}

// Get all songs from IndexedDB
async function getSongs() {
  return new Promise(async (resolve, reject) => {
    try {
    const db = await openDatabase();
    const transaction = db.transaction(STORE_NAME, "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

      request.onsuccess = () => {
        const songs = request.result;
        console.log("✅ Successfully retrieved song references:", songs);
        resolve(songs);
        db.close();
      };

      request.onerror = () => {
        console.error("❌ Error getting songs:", request.error);
        reject(request.error);
        db.close();
      };
    } catch (error) {
      console.error("❌ Error in getSongs:", error);
      reject(error);
    }
  });
}

// Clear all songs from IndexedDB
async function clearSongs() {
  return new Promise(async (resolve, reject) => {
    try {
  const db = await openDatabase();
  const transaction = db.transaction(STORE_NAME, "readwrite");
  const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();

      request.onsuccess = () => {
        console.log("✅ Successfully cleared all songs");
        resolve();
        db.close();
      };

      request.onerror = () => {
        console.error("❌ Error clearing songs:", request.error);
        reject(request.error);
        db.close();
      };
    } catch (error) {
      console.error("❌ Error in clearSongs:", error);
      reject(error);
    }
  });
}

// Delete a specific song by ID
async function deleteSong(songId) {
  return new Promise(async (resolve, reject) => {
    try {
  const db = await openDatabase();
  const transaction = db.transaction(STORE_NAME, "readwrite");
  const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(songId);

      request.onsuccess = () => {
        console.log(`✅ Successfully deleted song with ID ${songId}`);
        resolve();
        db.close();
      };

      request.onerror = () => {
        console.error(`❌ Error deleting song with ID ${songId}:`, request.error);
        reject(request.error);
        db.close();
      };
    } catch (error) {
      console.error("❌ Error in deleteSong:", error);
      reject(error);
    }
  });
}

// Export functions
export { addSong, clearSongs, deleteSong, getSongs };
