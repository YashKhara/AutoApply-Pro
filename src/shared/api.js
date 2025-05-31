// src/shared/api.js
import { getStorage } from './storage'; // We'll need settings, so import getStorage

/**
 * Calls the Google Gemini API to generate text (e.g., cover letter, question answer).
 * @param {string} promptText - The prompt to send to the Gemini API.
 * @returns {Promise<string|null>} A promise that resolves with the generated text, or null if an error occurs.
 */
export async function callGeminiAPI(promptText) {
  console.log("Calling Gemini API with prompt:", promptText);
  try {
    const settings = await getStorage('settings');
    const geminiApiKey = settings?.geminiApiKey;

    if (!geminiApiKey) {
      console.error("Gemini API Key is not set in settings.");
      return null;
    }

    // This URL might vary slightly based on the specific Gemini model and endpoint.
    // Ensure you use the correct endpoint for your Gemini setup (e.g., generative-language-client or a specific model like gemini-pro)
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${geminiApiKey}`;

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: promptText }]
        }]
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Gemini API Error Response:", errorData);
      throw new Error(`Gemini API request failed: ${response.status} ${response.statusText} - ${errorData?.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    // Gemini API response structure can vary, typically content is in candidates[0].content.parts[0].text
    const generatedText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!generatedText) {
      console.warn("Gemini API returned no generated text for prompt:", promptText, data);
      return null;
    }

    return generatedText;

  } catch (error) {
    console.error("Error calling Google Gemini API:", error);
    // You might want to notify the user in the popup about API errors
    return null;
  }
}

/**
 * Logs data to a Google Sheet.
 * @param {object} rowData - An object representing the row to append (e.g., { 'Job Title': '...', 'Company': '...', 'Status': '...' }).
 * @returns {Promise<boolean>} A promise that resolves to true if successful, false otherwise.
 */
export async function logToGoogleSheet(rowData) {
  console.log("Attempting to log to Google Sheet:", rowData);
  try {
    const settings = await getStorage('settings');
    const googleSheetLink = settings?.googleSheetLink;
    const googleSheetApiKey = settings?.googleSheetApiKey;

    if (!googleSheetLink || !googleSheetApiKey) {
      console.error("Google Sheet Link or API Key is not set in settings.");
      return false;
    }
    // Extract spreadsheet ID from the link
    const spreadsheetIdMatch = googleSheetLink.match(/\/d\/([a-zA-Z0-9_-]+)/);
    if (!spreadsheetIdMatch || !spreadsheetIdMatch[1]) {
      console.error("Invalid Google Sheet Link. Could not extract Spreadsheet ID.");
      return false;
    }
    const spreadsheetId = spreadsheetIdMatch[1];

    // Assuming the sheet we want to write to is named 'Applications' or similar.
    // You might need to make this configurable in settings too, or infer it.
    // For simplicity, let's assume the first sheet is 'Sheet1' or you configure the sheet name.
    // For now, let's target 'Sheet1'. You might need to change 'Sheet1' to your actual sheet name.
    const sheetName = 'Sheet1'; // *** IMPORTANT: User might need to configure this or ensure it's 'Sheet1' ***

    const API_URL = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${sheetName}:append?valueInputOption=RAW&key=${googleSheetApiKey}`;

    // Convert rowData object to an array of values in a specific order
    // This order must match your Google Sheet's column headers
    const headers = [
      'Timestamp', 'Bot Name', 'Job Title', 'Company', 'Application URL',
      'Status', 'Error Message', 'Cover Letter Generated', 'Questions Answered'
    ]; // Example headers - adjust as per your sheet

    const values = headers.map(header => {
      switch (header) {
        case 'Timestamp': return new Date().toLocaleString();
        case 'Bot Name': return rowData.botName || '';
        case 'Job Title': return rowData.jobTitle || '';
        case 'Company': return rowData.company || '';
        case 'Application URL': return rowData.applicationUrl || '';
        case 'Status': return rowData.status || 'Applied';
        case 'Error Message': return rowData.error || '';
        case 'Cover Letter Generated': return rowData.coverLetterGenerated ? 'Yes' : 'No';
        case 'Questions Answered': return rowData.questionsAnswered ? 'Yes' : 'No';
        default: return '';
      }
    });

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values: [values],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Google Sheets API Error Response:", errorData);
      throw new Error(`Google Sheets API request failed: ${response.status} ${response.statusText} - ${errorData?.error?.message || 'Unknown error'}`);
    }

    console.log("Successfully logged to Google Sheet.");
    return true;

  } catch (error) {
    console.error("Error logging to Google Sheet:", error);
    // You might want to notify the user in the popup about API errors
    return false;
  }
}