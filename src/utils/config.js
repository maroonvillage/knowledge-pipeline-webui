// src/utils/config.js
let config = null;

// export async function loadConfig() {
//   const response = await fetch('/config.json');
//   config = await response.json();
// }
export async function loadConfig() {
  try {
    const response = await fetch('/config.json');
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    const data = await response.json();
    window._APP_CONFIG = data; // optional global storage
    return data;
  } catch (err) {
    console.error('Error loading config.json:', err);
    throw err;
  }
}

export function getConfig() {
  config = loadConfig();
  if (!config) throw new Error("Config not loaded!");
  return config;
}
