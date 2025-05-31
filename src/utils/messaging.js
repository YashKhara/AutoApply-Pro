// src/utils/messaging.js

/**
 * Sends a message to the background script and awaits a response.
 * @param {object} message - The message object to send. Must contain an 'action' property.
 * @returns {Promise<any>} A promise that resolves with the background script's response.
 */
export async function sendMessageToBackground(message) {
    console.log('Content Script: Sending message to background:', message);
    try {
      const response = await chrome.runtime.sendMessage(message);
      console.log('Content Script: Received response from background:', response);
      return response;
    } catch (error) {
      console.error('Content Script: Error sending message to background:', error);
      // Handle cases where the background script might not be listening or fails
      return { status: 'error', message: error.message };
    }
  }
  
  /**
   * Asks the background script to generate a cover letter using AI.
   * @param {object} profileData - The user's profile data.
   * @param {string} jobDescription - The job description text.
   * @returns {Promise<string|null>} Generated cover letter text or null.
   */
  export async function requestAICoverLetter(profileData, jobDescription) {
    return sendMessageToBackground({
      action: 'generateCoverLetter',
      profile: profileData,
      jobDescription: jobDescription
    });
  }
  
  /**
   * Asks the background script to answer a question using AI.
   * @param {object} profileData - The user's profile data.
   * @param {string} jobDescription - The job description text.
   * @param {string} questionText - The question to answer.
   * @returns {Promise<string|null>} Generated answer text or null.
   */
  export async function requestAIQuestionAnswer(profileData, jobDescription, questionText) {
    return sendMessageToBackground({
      action: 'answerQuestion',
      profile: profileData,
      jobDescription: jobDescription,
      question: questionText
    });
  }
  
  /**
   * Notifies the background script that a new, unhandled question was found.
   * @param {string} questionText - The text of the new question.
   * @returns {Promise<any>} Response from background.
   */
  export async function notifyNewQuestion(questionText) {
    return sendMessageToBackground({
      action: 'newQuestionFound',
      questionText: questionText
    });
  }
  
  /**
   * Notifies the background script about the outcome of an application attempt.
   * @param {object} details - Details about the application (e.g., status, jobTitle, company, url, error).
   * @returns {Promise<any>} Response from background.
   */
  export async function logApplicationOutcome(details) {
    return sendMessageToBackground({
      action: 'logApplication',
      ...details
    });
  }
  
  /**
   * Requests profile and settings data from the background script.
   * @returns {Promise<object>} An object containing profile and settings.
   */
  export async function requestProfileAndSettings() {
    return sendMessageToBackground({ action: 'getProfileAndSettings' });
  }
  
  /**
   * Requests a list of known questions and their answers from the background script.
   * @returns {Promise<object[]>} An array of question objects.
   */
  export async function requestKnownQuestions() {
    return sendMessageToBackground({ action: 'getKnownQuestions' });
  }