// src/background/main.js
import { getStorage, setStorage } from '../shared/storage.js';
import { callGeminiAPI, logToGoogleSheet } from '../shared/api.js';

// Global state for running bots
let runningBots = {};

// Listener for messages from popup or content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    (async () => { // Use an async IIFE to allow await inside the listener
        console.log('Background: Received message:', request);

        switch (request.action) {
            case "toggleBot":
                handleBotToggle(request.bot);
                sendResponse({ status: "success" });
                break;

            case "getProfileAndSettings":
                // Send profile and settings data to content script
                const profile = await getStorage('profile');
                const settings = await getStorage('settings');
                sendResponse({ profile: profile || {}, settings: settings || {} });
                break;

            case "getKnownQuestions":
                // Send known questions to content script
                const questions = await getStorage('questions');
                sendResponse(questions || []);
                break;

            case "generateCoverLetter":
                // Call Gemini API for cover letter
                const coverLetterPrompt = request.settings.aiCoverLetterPrompt
                    .replace('{profile.json}', JSON.stringify(request.profile, null, 2))
                    .replace('{Job Description}', request.jobDescription);
                const coverLetter = await callGeminiAPI(coverLetterPrompt);
                sendResponse(coverLetter);
                break;

            case "answerQuestion":
                // Call Gemini API for question answer
                const questionPrompt = request.settings.aiQuestionPrompt
                    .replace('{the question}', request.question)
                    .replace('{profile.json}', JSON.stringify(request.profile, null, 2))
                    .replace('{Job Description}', request.jobDescription);
                const answer = await callGeminiAPI(questionPrompt);
                sendResponse(answer);
                break;

            case "newQuestionFound":
                // Add new question to storage and notify popup (or update badge)
                let storedQuestions = await getStorage('questions') || [];
                const newQuestion = {
                    id: Date.now(),
                    text: request.questionText,
                    answer: '', // Initially empty, user will fill in
                    isNew: true // Mark as new for UI distinction
                };
                storedQuestions.push(newQuestion);
                await setStorage({ questions: storedQuestions });

                // You might also want to update the extension badge text here
                // e.g., chrome.action.setBadgeText({ text: '!' });
                // and send a message to the popup if it's open to refresh its state.
                sendResponse({ status: "success", message: "Question added." });
                break;

            case "answerSubmitted":
                // Update the answer for an existing question in storage
                let existingQuestions = await getStorage('questions') || [];
                const qIndex = existingQuestions.findIndex(q => q.text === request.question);
                if (qIndex !== -1) {
                    existingQuestions[qIndex].answer = request.answer;
                    existingQuestions[qIndex].isNew = false; // Mark as no longer new
                    await setStorage({ questions: existingQuestions });
                    sendResponse({ status: "success", message: "Question answer updated." });
                } else {
                    sendResponse({ status: "error", message: "Question not found." });
                }
                break;

            case "logApplication":
                // Log application outcome to Google Sheet
                const logSuccess = await logToGoogleSheet(request);
                sendResponse({ status: logSuccess ? "success" : "error" });
                break;

            case "skipApplication":
                // This message indicates the content script should skip the current application
                // and proceed to the next job or stop. We'll handle the actual skipping logic
                // within the content script's state machine, but the background acknowledges.
                console.log("Background: Acknowledged application skip request.");
                sendResponse({ status: "acknowledged" });
                break;


            default:
                console.warn('Background: Unknown message action:', request.action);
                sendResponse({ status: "error", message: "Unknown action" });
        }
    })();
    return true; // Keep the message channel open for async sendResponse
});

async function handleBotToggle(bot) {
    if (bot.isOn) {
        if (!runningBots[bot.id]) {
            console.log(`Background: Starting bot: ${bot.botName}`);
            runningBots[bot.id] = { status: 'running', windowId: null };
            startAutomation(bot);
        }
    } else {
        if (runningBots[bot.id]) {
            console.log(`Background: Stopping bot: ${bot.botName}`);
            stopAutomation(bot.id);
        }
    }
}

async function startAutomation(bot) {
    try {
        const window = await chrome.windows.create({
            url: bot.linkedInUrl,
            type: 'normal',
            state: 'maximized' // Or 'minimized' if you prefer it runs in background
        });
        runningBots[bot.id].windowId = window.id;

        // Inject content script programmatically after tab is loaded
        chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
            if (tabId === window.tabs[0].id && info.status === 'complete' && info.url?.startsWith('https://www.linkedin.com/')) {
                console.log(`Background: Injecting content script into tab ${tabId}`);
                chrome.scripting.executeScript({
                    target: { tabId: tabId },
                    files: ['src/content/main.js']
                });
                chrome.tabs.sendMessage(tabId, { action: "startBotAutomation", bot: bot });
                chrome.tabs.onUpdated.removeListener(listener); // Clean up
            }
        });

    } catch (error) {
        console.error(`Background: Error starting bot ${bot.botName}:`, error);
        await logToGoogleSheet({
            botName: bot.botName,
            status: 'error',
            error: `Failed to start: ${error.message}`
        });
        stopAutomation(bot.id);
    }
}

function stopAutomation(botId) {
    if (runningBots[botId]) {
        const { windowId } = runningBots[botId];
        if (windowId) {
            chrome.windows.remove(windowId);
            console.log(`Background: Closed window ${windowId} for bot ${botId}`);
        }
        delete runningBots[botId];
        console.log(`Background: Stopped bot: ${botId}`);
    }
}

// Ensure bots are stopped if the extension is reloaded/updated
chrome.runtime.onSuspend.addListener(() => {
    console.log("Background: Extension suspended. Stopping all running bots.");
    Object.keys(runningBots).forEach(botId => stopAutomation(botId));
});

// Optional: Listener for when a tab managed by a bot is closed by the user
chrome.windows.onRemoved.addListener((windowId) => {
    const botIdToStop = Object.keys(runningBots).find(botId => runningBots[botId].windowId === windowId);
    if (botIdToStop) {
        console.log(`Background: User closed window ${windowId}. Stopping bot ${botIdToStop}.`);
        stopAutomation(botIdToStop);
        // Also update the popup state so the toggle button is off
        chrome.runtime.sendMessage({ action: "botStoppedByUser", botId: botIdToStop }).catch(e => console.warn("Could not notify popup:", e));
    }
});