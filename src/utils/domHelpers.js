// src/utils/domHelpers.js
import { wait } from './wait';
import { requestProfileAndSettings } from './messaging';

let cachedSettings = null; // Cache settings to avoid repeated storage reads

/**
 * Retrieves the cached settings, or fetches them if not available.
 * @returns {Promise<object>} The application settings, including selectorResilience.
 */
async function getSettings() {
  if (!cachedSettings) {
    const { settings } = await requestProfileAndSettings();
    cachedSettings = settings;
  }
  return cachedSettings;
}

/**
 * Finds an element by a given CSS selector, waiting for it to appear.
 * Uses selector resilience if multiple selectors are provided.
 * @param {string | string[]} selectors - A single CSS selector or an array of preferred selectors.
 * @param {number} timeout - Maximum time to wait for the element in milliseconds.
 * @param {number} interval - How often to check for the element in milliseconds.
 * @returns {Promise<HTMLElement | null>} The found HTMLElement or null if timeout.
 */
export async function findElement(selectors, timeout = 10000, interval = 500) {
  const selectorList = Array.isArray(selectors) ? selectors : [selectors];
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    for (const selector of selectorList) {
      const element = document.querySelector(selector);
      if (element) {
        console.log(`Found element with selector: ${selector}`);
        return element;
      }
    }
    await wait(interval);
  }
  console.warn(`Element not found within timeout for selectors: ${selectors}`);
  return null;
}

/**
 * Clicks an element after waiting for it to be present and clickable.
 * @param {string | string[]} selectors - CSS selectors for the element to click.
 * @param {number} timeout - Max time to wait.
 * @param {number} interval - Check interval.
 * @returns {Promise<boolean>} True if clicked, false otherwise.
 */
export async function clickElement(selectors, timeout = 10000, interval = 500) {
  const element = await findElement(selectors, timeout, interval);
  if (element) {
    // Attempt to scroll into view and click
    try {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      await wait(200); // Give it a moment to scroll
      element.click();
      console.log(`Clicked element: ${selectors}`);
      return true;
    } catch (e) {
      console.error(`Error clicking element ${selectors}:`, e);
      return false;
    }
  }
  console.error(`Failed to click element: ${selectors} (element not found or not clickable)`);
  return false;
}

/**
 * Types text into an input field.
 * @param {string | string[]} selectors - CSS selectors for the input field.
 * @param {string} text - The text to type.
 * @param {number} timeout - Max time to wait.
 * @param {number} interval - Check interval.
 * @returns {Promise<boolean>} True if text typed, false otherwise.
 */
export async function typeIntoElement(selectors, text, timeout = 10000, interval = 500) {
  const element = await findElement(selectors, timeout, interval);
  if (element && (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement)) {
    try {
      element.value = text;
      // Dispatch input event to trigger React/Vue listeners if present
      element.dispatchEvent(new Event('input', { bubbles: true }));
      element.dispatchEvent(new Event('change', { bubbles: true })); // Some frameworks use 'change'
      console.log(`Typed "${text}" into element: ${selectors}`);
      return true;
    } catch (e) {
      console.error(`Error typing into element ${selectors}:`, e);
      return false;
    }
  }
  console.error(`Failed to type into element: ${selectors} (element not found or not input/textarea)`);
  return false;
}

/**
 * Selects an option in a <select> element.
 * @param {string | string[]} selectors - CSS selectors for the select element.
 * @param {string} value - The value of the option to select.
 * @param {number} timeout - Max time to wait.
 * @param {number} interval - Check interval.
 * @returns {Promise<boolean>} True if option selected, false otherwise.
 */
export async function selectOption(selectors, value, timeout = 10000, interval = 500) {
    const element = await findElement(selectors, timeout, interval);
    if (element && element instanceof HTMLSelectElement) {
        try {
            const option = Array.from(element.options).find(opt => opt.value === value || opt.text === value);
            if (option) {
                element.value = option.value;
                element.dispatchEvent(new Event('change', { bubbles: true }));
                console.log(`Selected option "${value}" in element: ${selectors}`);
                return true;
            } else {
                console.warn(`Option "${value}" not found in select element: ${selectors}`);
                return false;
            }
        } catch (e) {
            console.error(`Error selecting option in element ${selectors}:`, e);
            return false;
        }
    }
    console.error(`Failed to select option in element: ${selectors} (element not found or not a select)`);
    return false;
}


/**
 * Gets the text content of an element.
 * @param {string | string[]} selectors - CSS selectors for the element.
 * @param {number} timeout - Max time to wait.
 * @param {number} interval - Check interval.
 * @returns {Promise<string|null>} The text content or null.
 */
export async function getElementText(selectors, timeout = 10000, interval = 500) {
  const element = await findElement(selectors, timeout, interval);
  return element ? element.textContent?.trim() : null;
}

/**
 * Checks if an element exists on the page.
 * @param {string | string[]} selectors - CSS selectors for the element.
 * @param {number} timeout - Max time to wait.
 * @param {number} interval - Check interval.
 * @returns {Promise<boolean>} True if element exists, false otherwise.
 */
export async function checkElementExists(selectors, timeout = 5000, interval = 200) {
  const element = await findElement(selectors, timeout, interval);
  return !!element;
}

/**
 * Generates an appropriate selector (or array of selectors) based on stored settings.
 * This function is key for selector resilience.
 * @param {string} selectorKey - The key from settings.selectorResilience (e.g., 'easyApplyButton').
 * @returns {Promise<string | string[]>} The selector(s) to use.
 */
export async function getResilientSelector(selectorKey) {
  const settings = await getSettings();
  const selector = settings?.selectorResilience?.[selectorKey];
  if (!selector) {
    console.warn(`No resilient selector found for key: ${selectorKey}. Using default (if any).`);
    // Fallback to a sensible default if the key is missing from settings
    // (though the initial state in useStore.js should prevent this for common ones)
    return `[data-automation-id="${selectorKey}"]` || `button[name="${selectorKey}"]`;
  }
  // If the stored selector is a comma-separated string, split it into an array
  if (typeof selector === 'string' && selector.includes(',')) {
    return selector.split(',').map(s => s.trim());
  }
  return selector;
}