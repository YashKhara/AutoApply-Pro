// src/content/main.js
import { sendMessageToBackground, requestProfileAndSettings, requestKnownQuestions, notifyNewQuestion, requestAICoverLetter, requestAIQuestionAnswer, logApplicationOutcome } from '../utils/messaging';
import { findElement, clickElement, typeIntoElement, getElementText, checkElementExists, getResilientSelector} from '../utils/domHelpers';
import { wait } from '../utils/wait'

console.log("AutoApply Pro Content Script Loaded!");

// Define the states for our automation state machine
const AUTOMATION_STATES = {
    INITIALIZING: 'INITIALIZING',
    NAVIGATING_JOBS: 'NAVIGATING_JOBS',
    SCANNING_JOBS: 'SCANNING_JOBS',
    JOB_DETAILS: 'JOB_DETAILS',
    EASY_APPLY_CLICKED: 'EASY_APPLY_CLICKED',
    FILLING_FORM_STEP: 'FILLING_FORM_STEP',
    GENERATING_COVER_LETTER: 'GENERATING_COVER_LETTER',
    ANSWERING_QUESTION: 'ANSWERING_QUESTION',
    WAITING_FOR_USER_INPUT: 'WAITING_FOR_USER_INPUT', // When modal is shown
    SUBMITTING_APPLICATION: 'SUBMITTING_APPLICATION',
    APPLICATION_COMPLETED: 'APPLICATION_COMPLETED',
    ERROR: 'ERROR',
    IDLE: 'IDLE' // When no more jobs or stopped
};

let currentBot = null;
let profileData = null;
let appSettings = null;
let knownQuestions = [];
let automationState = AUTOMATION_STATES.INITIALIZING;
let currentJob = null; // Stores details of the job being applied to

/**
 * Updates the automation state and logs it.
 * @param {string} newState - The new state to transition to.
 */
function updateAutomationState(newState) {
    automationState = newState;
    console.log(`Automation State: ${automationState}`);
    // Potentially send state updates to background/popup for UI feedback
    // sendMessageToBackground({ action: 'updateBotStatus', botId: currentBot.id, status: newState });
}

/**
 * Main function to run the automation state machine.
 */
async function runAutomation() {
    try {
        if (automationState === AUTOMATION_STATES.INITIALIZING) {
            console.log("Initializing automation...");
            const { profile, settings } = await requestProfileAndSettings();
            profileData = profile;
            appSettings = settings;
            knownQuestions = await requestKnownQuestions();

            if (!profileData || Object.keys(profileData).length === 0) {
                console.error("Profile data not loaded. Please fill out your profile in the extension popup.");
                updateAutomationState(AUTOMATION_STATES.ERROR);
                await logApplicationOutcome({ status: 'error', error: 'Profile data missing' });
                // Potentially display a more prominent error to the user
                return; // Stop if crucial data is missing
            }
            if (!appSettings || !appSettings.geminiApiKey) {
                console.error("Settings not loaded or Gemini API Key missing. Please configure settings.");
                updateAutomationState(AUTOMATION_STATES.ERROR);
                await logApplicationOutcome({ status: 'error', error: 'Settings or API key missing' });
                return;
            }

            // We need to know WHICH bot initiated this content script.
            // The background script will send this data via a message.
            // For now, let's assume `currentBot` is set via an initial message from background.
            // We'll modify background.js's scripting.executeScript to pass data later.
            // For immediate testing, let's mock it:
            // currentBot = { id: 1, botName: "Test Bot", linkedInUrl: window.location.href };
            // A better way is to listen for a message from the background script after injection.
            await sendMessageToBackground({ action: 'contentScriptReady' }); // Notify background script we are ready
            updateAutomationState(AUTOMATION_STATES.NAVIGATING_JOBS);
            // The background script will then send us the bot data
        }

        // State machine loop
        switch (automationState) {
            case AUTOMATION_STATES.NAVIGATING_JOBS:
                await navigateAndScanJobs();
                break;
            case AUTOMATION_STATES.SCANNING_JOBS:
                await scanAndProcessJobs();
                break;
            case AUTOMATION_STATES.JOB_DETAILS:
                // Logic to extract job details and check for easy apply
                break;
            case AUTOMATION_STATES.EASY_APPLY_CLICKED:
                // Logic to handle the first step of easy apply form
                break;
            case AUTOMATION_STATES.FILLING_FORM_STEP:
                // Logic for subsequent form steps
                break;
            case AUTOMATION_STATES.GENERATING_COVER_LETTER:
                // Logic to request and insert cover letter
                break;
            case AUTOMATION_STATES.ANSWERING_QUESTION:
                // Logic to request and insert answer to questions
                break;
            case AUTOMATION_STATES.WAITING_FOR_USER_INPUT:
                // Wait for user to interact with modal, then resume
                console.log("Waiting for user to answer new question...");
                // This state will be exited by a message listener when the modal is submitted
                break;
            case AUTOMATION_STATES.SUBMITTING_APPLICATION:
                // Final submission logic
                break;
            case AUTOMATION_STATES.APPLICATION_COMPLETED:
                // Log outcome and move to next job
                await logApplicationOutcome({
                    botName: currentBot.botName,
                    jobTitle: currentJob.title,
                    company: currentJob.company,
                    applicationUrl: currentJob.url,
                    status: 'Applied Successfully',
                    coverLetterGenerated: currentJob.coverLetterGenerated,
                    questionsAnswered: currentJob.questionsAnswered
                });
                updateAutomationState(AUTOMATION_STATES.SCANNING_JOBS); // Go back to scan for next job
                await wait(2000); // Small pause before next action
                await runAutomation(); // Continue the loop
                break;
            case AUTOMATION_STATES.ERROR:
                console.error("Automation is in an error state. Check logs for details.");
                // Potentially send message to background to stop bot or notify user
                break;
            case AUTOMATION_STATES.IDLE:
                console.log("Automation is idle. No more jobs to process or bot stopped.");
                // Send message to background to indicate completion/idle status
                await sendMessageToBackground({ action: 'botCompleted', botId: currentBot.id });
                break;
        }

    } catch (error) {
        console.error("Unhandled error in runAutomation:", error);
        updateAutomationState(AUTOMATION_STATES.ERROR);
        if (currentJob) {
            await logApplicationOutcome({
                botName: currentBot?.botName,
                jobTitle: currentJob.title,
                company: currentJob.company,
                applicationUrl: currentJob.url,
                status: 'Error during application',
                error: error.message
            });
        } else {
             await logApplicationOutcome({
                botName: currentBot?.botName,
                status: 'Error',
                error: error.message
            });
        }
        // Potentially stop the bot or wait for manual intervention
    }
}

/**
 * Handles incoming messages from the background script.
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    (async () => {
        console.log('Content Script: Received message from background:', request);
        switch (request.action) {
            case "startBotAutomation":
                currentBot = request.bot;
                // Re-initiate automation if it was waiting for bot data
                if (automationState === AUTOMATION_STATES.INITIALIZING || automationState === AUTOMATION_STATES.IDLE) {
                    updateAutomationState(AUTOMATION_STATES.NAVIGATING_JOBS);
                    runAutomation(); // Kick off the loop
                }
                sendResponse({ status: "acknowledged", botId: currentBot.id });
                break;
            case "userAnsweredQuestion":
                // This message comes from background when user submits answer via popup or a manual modal
                // If we are in WAITING_FOR_USER_INPUT, we can resume automation.
                if (automationState === AUTOMATION_STATES.WAITING_FOR_USER_INPUT) {
                    console.log("User answered question. Resuming automation...");
                    // Potentially inject the answer into the current form field if needed
                    updateAutomationState(AUTOMATION_STATES.FILLING_FORM_STEP); // Or whichever state it was in before waiting
                    runAutomation(); // Resume the automation loop
                }
                sendResponse({ status: "success" });
                break;
            case "stopBotAutomation":
                 // Message from background to explicitly stop this content script's work
                console.log(`Content Script: Stopping automation for bot ${request.botId}`);
                updateAutomationState(AUTOMATION_STATES.IDLE); // Set to idle state, effectively stopping the loop
                sendResponse({ status: "stopped" });
                break;
            default:
                console.warn('Content Script: Unknown message action:', request.action);
                sendResponse({ status: "error", message: "Unknown action" });
        }
    })();
    return true; // Keep the message channel open for async sendResponse
});


// Function to inject the modal for new questions (as provided previously)
// This function will need to be refined to tie into the automation state
function showQuestionModal(questionText) {
    updateAutomationState(AUTOMATION_STATES.WAITING_FOR_USER_INPUT); // Pause automation
    // Ensure only one modal is active
    if (document.getElementById('autoapply-question-modal')) {
        console.warn('Modal already open.');
        return;
    }

    const modal = document.createElement('div');
    modal.id = 'autoapply-question-modal'; // Add ID for easier management
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background-color: rgba(0, 0, 0, 0.7);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000; /* Ensure it's on top */
    `;
    modal.innerHTML = `
        <div style="
            background: #fff;
            padding: 2em;
            border-radius: 8px;
            box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
            max-width: 500px;
            width: 90%;
            text-align: center;
            font-family: Arial, sans-serif;
            color: #333;
            border: 2px solid #dc3545; /* Red border */
        ">
            <h2 style="color: #dc3545; margin-bottom: 1em;">New Question Found!</h2>
            <p style="font-size: 1.1em; margin-bottom: 1.5em; word-wrap: break-word;">${questionText}</p>
            <textarea id="autoapply-modal-answer" placeholder="Type your answer here..." style="
                width: calc(100% - 20px);
                height: 100px;
                padding: 10px;
                margin-bottom: 1em;
                border: 1px solid #ccc;
                border-radius: 4px;
                resize: vertical;
                font-size: 1em;
            "></textarea>
            <button id="autoapply-modal-submit" style="
                background-color: #007bff;
                color: white;
                padding: 10px 20px;
                border: none;
                border-radius: 5px;
                cursor: pointer;
                font-size: 1em;
                margin-right: 10px;
            ">Submit Answer & Continue</button>
            <button id="autoapply-modal-skip" style="
                background-color: #6c757d;
                color: white;
                padding: 10px 20px;
                border: none;
                border-radius: 5px;
                cursor: pointer;
                font-size: 1em;
            ">Skip Application</button>
        </div>
    `;
    document.body.appendChild(modal);

    document.getElementById('autoapply-modal-submit').onclick = async () => {
        const answer = document.getElementById('autoapply-modal-answer').value;
        if (answer.trim()) {
            await sendMessageToBackground({ action: 'answerSubmitted', question: questionText, answer: answer });
            modal.remove();
            updateAutomationState(AUTOMATION_STATES.FILLING_FORM_STEP); // Resume state after answering
            runAutomation(); // Resume the automation loop
        } else {
            alert("Please provide an answer or skip the application.");
        }
    };

    document.getElementById('autoapply-modal-skip').onclick = async () => {
        await sendMessageToBackground({ action: 'skipApplication', reason: 'User skipped new question' });
        modal.remove();
        // Immediately try to move to the next job, or stop current process
        updateAutomationState(AUTOMATION_STATES.SCANNING_JOBS); // Go back to scan for next job
        runAutomation();
    };
}


// --- Automation Flow Functions ---

// Placeholder functions for job scanning and application
async function navigateAndScanJobs() {
    console.log("Attempting to navigate to LinkedIn Jobs page...");
    const jobsPageUrl = "https://www.linkedin.com/jobs/";
    if (window.location.href !== jobsPageUrl) {
        window.location.href = jobsPageUrl; // Navigate to the main jobs page
        // We'll rely on the chrome.tabs.onUpdated listener in background.js
        // to re-inject the content script once navigation is complete.
        // So this function effectively exits and a new instance starts.
        return;
    }
    updateAutomationState(AUTOMATION_STATES.SCANNING_JOBS);
    await runAutomation(); // Continue in the new state
}

async function scanAndProcessJobs() {
    console.log("Scanning and processing jobs...");
    // This is where the core logic to find and click on jobs will go.
    // Let's add a placeholder for finding the Easy Apply jobs.

    // 1. Scroll to load more jobs (if needed)
    await autoScroll(3); // Scroll down 3 times
    await wait(2000); // Give time for new jobs to load

    // 2. Find job listings
    // We'll need to identify a common selector for job cards/listings.
    // Example: A common pattern for job listings is 'li.jobs-search-results__list-item'
    const jobListings = document.querySelectorAll('li.jobs-search-results__list-item');
    console.log(`Found ${jobListings.length} job listings.`);

    let jobFoundAndProcessing = false;

    for (const jobListing of jobListings) {
        // Check if "Easy Apply" button exists within this listing
        const easyApplyButtonInListing = jobListing.querySelector('button.jobs-apply-button.jobs-apply-button--top-card.jobs-apply-button--absolute.jobs-apply-button--accessible');

        // Let's also check for a job title and company
        const jobTitleElement = jobListing.querySelector('a.job-card-list__title');
        const companyElement = jobListing.querySelector('a.job-card-container__company-name');
        const jobUrlElement = jobListing.querySelector('a.job-card-list__title'); // The link to the job details page

        if (easyApplyButtonInListing && jobTitleElement && companyElement && jobUrlElement) {
            const jobTitle = jobTitleElement.innerText.trim();
            const company = companyElement.innerText.trim();
            const jobUrl = jobUrlElement.href; // Direct link to job details

            console.log(`Found an Easy Apply job: "${jobTitle}" at "${company}"`);

            // Store current job details for logging and AI prompts
            currentJob = {
                title: jobTitle,
                company: company,
                url: jobUrl,
                coverLetterGenerated: false,
                questionsAnswered: false,
                status: 'Initiated'
            };

            // Click the job listing to open its details pane
            // This might be the job title link or the entire job card area
            // We'll click the title link to be specific
            await clickElement(jobUrlElement);
            await wait(3000); // Wait for job details to load

            updateAutomationState(AUTOMATION_STATES.JOB_DETAILS);
            await processJobDetails();
            jobFoundAndProcessing = true;
            break; // Process one job at a time, then re-scan
        }
    }

    if (!jobFoundAndProcessing) {
        console.log("No new Easy Apply jobs found in current view. Scrolling or becoming idle.");
        // If no easy apply jobs are found, try scrolling more or go idle
        const scrolled = await autoScroll(); // Try one more scroll
        if (scrolled) {
            updateAutomationState(AUTOMATION_STATES.SCANNING_JOBS); // Rescan after scroll
            await wait(2000);
            await runAutomation();
        } else {
            updateAutomationState(AUTOMATION_STATES.IDLE); // No more jobs to scroll
            await runAutomation();
        }
    }
}

async function processJobDetails() {
    console.log("Processing job details...");
    // Ensure we are on the job details page/pane
    const easyApplySelector = await getResilientSelector('easyApplyButton');

    const easyApplyButton = await findElement(easyApplySelector, 5000);

    if (easyApplyButton) {
        console.log("Easy Apply button found. Clicking...");
        await clickElement(easyApplySelector);
        updateAutomationState(AUTOMATION_STATES.EASY_APPLY_CLICKED);
        await wait(2000); // Wait for the Easy Apply modal to appear
        await fillApplicationForm();
    } else {
        console.log("Easy Apply button not found for this job. Skipping.");
        await logApplicationOutcome({
            botName: currentBot.botName,
            jobTitle: currentJob.title,
            company: currentJob.company,
            applicationUrl: currentJob.url,
            status: 'Skipped - No Easy Apply',
            error: 'Easy Apply button not found'
        });
        updateAutomationState(AUTOMATION_STATES.SCANNING_JOBS); // Go back to scan for next job
        await wait(1000);
        await runAutomation();
    }
}

async function fillApplicationForm() {
    updateAutomationState(AUTOMATION_STATES.FILLING_FORM_STEP);
    console.log("Attempting to fill application form...");

    // This is a highly simplified example. A real implementation would:
    // 1. Identify current step of the form (e.g., by checking headers or specific elements)
    // 2. Based on step, find relevant fields (name, phone, resume upload, questions, etc.)
    // 3. Populate fields using profileData and knownQuestions
    // 4. Handle resume/cover letter uploads (more complex, likely file input simulation)
    // 5. Click "Next" or "Review" button

    const nextButtonSelector = await getResilientSelector('nextButton');
    const reviewButtonSelector = await getResilientSelector('reviewButton');
    const submitButtonSelector = await getResilientSelector('submitButton');
    const followCompanyCheckboxSelector = await getResilientSelector('followCompanyCheckbox');

    let formCompleted = false;
    while (!formCompleted) {
        await wait(1000); // Wait for elements to load on current step

        // --- Handle basic profile fields (simplified) ---
        // These selectors are examples, LinkedIn uses dynamic IDs.
        // You'll need to inspect the form fields for consistent selectors.
        const phoneField = await findElement('input[id*="phoneNumber-"]'); // Example selector
        if (phoneField && phoneField.value === '') {
            console.log("Filling phone number...");
            await typeIntoElement(phoneField, profileData.phone);
        }

        const emailField = await findElement('input[id*="email-"]'); // Example selector
        if (emailField && emailField.value === '') {
            console.log("Filling email...");
            await typeIntoElement(emailField, profileData.email);
        }

        // --- Handle Yes/No or Multiple Choice Questions ---
        // This is complex and depends heavily on the structure.
        // We'd need to loop through question containers and match text.
        // Example: If a question says "Are you authorized to work in [country]?",
        // we'd search for a corresponding radio button or select.
        // For now, this is a placeholder.

        // --- Handle Custom Questions / AI Questions ---
        // This will be a critical part. We need to identify all textareas/inputs
        // that are likely custom questions.
        const questionTextAreas = document.querySelectorAll('textarea[id*="question"]'); // Common LinkedIn pattern
        for (const qa of questionTextAreas) {
            const questionLabel = qa.labels?.[0]?.textContent?.trim() || qa.placeholder?.trim();
            if (questionLabel) {
                console.log(`Found question: ${questionLabel}`);
                // Check if we have a known answer
                const knownAnswer = knownQuestions.find(q => q.text === questionLabel)?.answer;

                if (knownAnswer) {
                    console.log(`Answering known question: "${questionLabel}" with "${knownAnswer}"`);
                    await typeIntoElement(qa, knownAnswer);
                    currentJob.questionsAnswered = true;
                } else {
                    // New question found, notify user and pause automation
                    console.warn(`New question found: "${questionLabel}". Notifying user.`);
                    await notifyNewQuestion(questionLabel);
                    showQuestionModal(questionLabel); // Display modal to user
                    return; // PAUSE automation and wait for user input via modal
                }
            }
        }

        // --- Handle Cover Letter ---
        const coverLetterField = await findElement('textarea[id*="coverletter"]'); // Example selector
        if (coverLetterField && coverLetterField.value === '' && appSettings.aiCoverLetterPrompt) {
            updateAutomationState(AUTOMATION_STATES.GENERATING_COVER_LETTER);
            console.log("Generating cover letter...");
            const jobDescription = await getElementText('.jobs-description__content'); // Selector for job description on details page
            if (jobDescription) {
                const generatedCoverLetter = await requestAICoverLetter(profileData, jobDescription);
                if (generatedCoverLetter) {
                    await typeIntoElement(coverLetterField, generatedCoverLetter);
                    currentJob.coverLetterGenerated = true;
                } else {
                    console.warn("Failed to generate cover letter or AI returned empty response.");
                }
            } else {
                console.warn("Could not find job description to generate cover letter.");
            }
            updateAutomationState(AUTOMATION_STATES.FILLING_FORM_STEP); // Back to filling form
        }

        // --- Advance the form ---
        if (await checkElementExists(nextButtonSelector)) {
            console.log("Clicking Next button...");
            await clickElement(nextButtonSelector);
        } else if (await checkElementExists(reviewButtonSelector)) {
            console.log("Clicking Review button...");
            // Optional: Untick "Follow company" checkbox
            if (appSettings.selectorResilience.followCompanyCheckbox) {
                const followCheckbox = await findElement(followCompanyCheckboxSelector);
                if (followCheckbox && followCheckbox.checked) { // If it's checked, uncheck it
                    await clickElement(followCompanyCheckboxSelector);
                    console.log("Unchecked 'Follow company' checkbox.");
                }
            }
            await clickElement(reviewButtonSelector);
        } else if (await checkElementExists(submitButtonSelector)) {
            console.log("Clicking Submit button...");
            await clickElement(submitButtonSelector);
            formCompleted = true; // Application submitted
            updateAutomationState(AUTOMATION_STATES.APPLICATION_COMPLETED);
        } else {
            console.warn("No form navigation buttons found. Form might be completed or stuck.");
            // This is a critical point: if no buttons, something is wrong or finished
            // For now, assume it's done or stuck and break the loop.
            // A more robust solution might try to identify if the "application sent" success message is present.
            const successMessage = await findElement('[data-test-id="apply-form-success-card"]', 2000); // Example success selector
            if (successMessage) {
                 console.log("Application success message found. Assuming form completed.");
                 formCompleted = true;
                 updateAutomationState(AUTOMATION_STATES.APPLICATION_COMPLETED);
            } else {
                 console.error("Form is stuck or unexpected state. No navigation or submit buttons found.");
                 updateAutomationState(AUTOMATION_STATES.ERROR);
                 throw new Error("Form stuck or unexpected state.");
            }
        }
    }
    await runAutomation(); // Continue to next state (APPLICATION_COMPLETED)
}

/**
 * Scrolls the job listings container to load more jobs.
 * @param {number} [scrollCount=1] - How many times to scroll.
 * @returns {Promise<boolean>} True if scrolled, false if container not found or no more scroll.
 */
async function autoScroll(scrollCount = 1) {
    const scrollContainer = await findElement('.jobs-search-results-list'); // Or a more specific selector
    if (!scrollContainer) {
        console.warn("Job scroll container not found.");
        return false;
    }

    let scrolled = false;
    for (let i = 0; i < scrollCount; i++) {
        const initialScrollHeight = scrollContainer.scrollHeight;
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
        await wait(2000); // Wait for content to load after scroll
        if (scrollContainer.scrollHeight > initialScrollHeight) {
            console.log("Scrolled down and new content loaded.");
            scrolled = true;
        } else {
            console.log("No more new content after scrolling.");
            break; // No more content to load
        }
    }
    return scrolled;
}

// Initial listener for the bot data from background script
// The background script will send 'startBotAutomation' message after injecting content script
// We don't call runAutomation() directly with setTimeout anymore.
// The background script will initiate it via message.
// This ensures currentBot, profileData, and appSettings are properly loaded before starting.
// The initial setTimeout in the original stub is removed.
// We only call runAutomation *after* currentBot is set.