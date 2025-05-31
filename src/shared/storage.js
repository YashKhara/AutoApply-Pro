// src/shared/storage.js

/**
 * Retrieves data from chrome.storage.local.
 * @param {string | string[]} keys - A key or array of keys to retrieve.
 * @returns {Promise<any>} A promise that resolves with the retrieved data.
 */
export async function getStorage(keys) {
    return new Promise((resolve) => {
      chrome.storage.local.get(keys, (result) => {
        resolve(result[keys] || null); // Return the specific key's value, or null if not found
      });
    });
  }
  
  /**
   * Stores data in chrome.storage.local.
   * @param {object} data - An object containing key-value pairs to store.
   * @returns {Promise<void>} A promise that resolves once the data is stored.
   */
  export async function setStorage(data) {
    return new Promise((resolve) => {
      chrome.storage.local.set(data, () => {
        resolve();
      });
    });
  }
  
  /**
   * Clears all data from chrome.storage.local.
   * Useful for debugging or resetting the extension.
   * @returns {Promise<void>} A promise that resolves once storage is cleared.
   */
  export async function clearStorage() {
    return new Promise((resolve) => {
      chrome.storage.local.clear(() => {
        resolve();
      });
    });
  }
  
  /**
   * Removes specific items from chrome.storage.local.
   * @param {string | string[]} keys - A key or array of keys to remove.
   * @returns {Promise<void>} A promise that resolves once the items are removed.
   */
  export async function removeStorage(keys) {
    return new Promise((resolve) => {
      chrome.storage.local.remove(keys, () => {
        resolve();
      });
    });
  }