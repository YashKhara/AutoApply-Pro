
# AutoApply Pro - Chrome Extension

This project is a Chrome browser extension that automates the LinkedIn "Easy Apply" job application process.

## Features

- **Automated Applications**: Intelligently applies to jobs based on user-configured search URLs.
- **AI Integration**: Uses Google Gemini to generate personalized cover letters and answers to subjective questions.
- **Dynamic Question Handling**: Pauses and prompts the user for answers to new, mandatory questions.
- **User-Friendly UI**: A clean, "Material 3-like" interface for managing bots, questions, profile data, and settings.
- **Robust Logging**: Logs all application attempts to a user-specified Google Sheet.
- **Resilient Automation**: Designed to handle errors gracefully and adapt to minor UI changes on LinkedIn.

## Technical Stack

- **Manifest**: Manifest V3
- **Framework**: React (with Vite)
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **APIs**: Google Gemini API, Google Sheets API

## Setup and Installation

1.  **Clone the Repository**
    ```bash
    git clone <repository_url>
    cd AutoApply-Pro
    ```

2.  **Install Dependencies**
    ```bash
    npm install
    ```

3.  **Build the Extension**
    ```bash
    npm run build
    ```
    This command will create a `dist` folder containing the bundled extension files.

4.  **Load the Extension in Chrome**
    - Open Chrome and navigate to `chrome://extensions`.
    - Enable "Developer mode" in the top right corner.
    - Click on "Load unpacked".
    - Select the `dist` folder generated in the previous step.

5.  **Configure the Extension**
    - Click on the AutoApply Pro icon in your Chrome toolbar.
    - Navigate to the **Settings** section to enter your API keys and Google Sheet link.
    - Fill out your information in the **Profile** section.
    - Create and configure your bots in the **Bots** section.

## Development

To run the project in development mode with hot-reloading:

```bash
npm run dev