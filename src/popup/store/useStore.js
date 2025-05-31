import { create } from 'zustand';
import { getStorage, setStorage } from '../../shared/storage';

export const useStore = create((set, get) => ({
  // State
  activeSection: 'bot', // Default active section
  bots: [],
  questions: [],
  profile: {
    name: '',
    email: '',
    phone: '',
    linkedInUrl: '',
    yearsExperience: '',
    keySkills: '', // Will be stored as a comma-separated string
    education: [],
    experience: [],
  },
  settings: {
    googleSheetLink: '',
    googleSheetApiKey: '',
    geminiApiKey: '',
    selectorResilience: { // Default LinkedIn selectors (example)
      easyApplyButton: 'button[aria-label^="Easy Apply to"]',
      nextButton: 'button[aria-label="Next"]',
      reviewButton: 'button[aria-label="Review your application"]',
      submitButton: 'button[aria-label="Submit application"]',
      followCompanyCheckbox: 'input[type="checkbox"][name="follow-company"]',
      // Add more as we identify them during automation development
    },
    aiCoverLetterPrompt: "Write a cover letter using a Humane tone based on {profile.json} and {Job Description}.",
    aiQuestionPrompt: "Answer this question: {the question} using a Humane tone based on {profile.json} and {Job Description}.",
  },
  
  // Actions
  setActiveSection: (section) => set({ activeSection: section }),

  // Load initial data from chrome.storage
  loadData: async () => {
    const [bots, questions, profile, settings] = await Promise.all([
      getStorage('bots'),
      getStorage('questions'),
      getStorage('profile'),
      getStorage('settings'),
    ]);
    set({
      bots: bots || [],
      questions: questions || [],
      profile: { ...get().profile, ...profile }, // Merge to keep defaults if no saved data
      settings: { ...get().settings, ...settings }, // Merge to keep defaults
    });
  },

  // Bot actions
  addBot: () => {
    const newBot = { id: Date.now(), botName: 'New Bot', linkedInUrl: '', isOn: false };
    set(state => {
      const updatedBots = [...state.bots, newBot];
      setStorage({ bots: updatedBots }); // Persist immediately
      return { bots: updatedBots };
    });
  },
  updateBot: (id, updatedData) => {
    set(state => {
      const updatedBots = state.bots.map(bot => bot.id === id ? { ...bot, ...updatedData } : bot);
      setStorage({ bots: updatedBots }); // Persist immediately
      return { bots: updatedBots };
    });
  },
  toggleBot: (id) => {
    set(state => {
      const updatedBots = state.bots.map(bot => bot.id === id ? { ...bot, isOn: !bot.isOn } : bot);
      const targetBot = updatedBots.find(b => b.id === id);
      if (targetBot) {
        // Send message to background script to start/stop the actual automation
        chrome.runtime.sendMessage({ action: "toggleBot", bot: targetBot });
      }
      setStorage({ bots: updatedBots }); // Persist immediately
      return { bots: updatedBots };
    });
  },
  deleteBot: (id) => {
    set(state => {
      const updatedBots = state.bots.filter(bot => bot.id !== id);
      setStorage({ bots: updatedBots });
      return { bots: updatedBots };
    });
  },

  // Question actions
  addQuestion: (questionText, answer = '') => {
    set(state => {
      const newQuestion = { id: Date.now(), text: questionText, answer: answer };
      const updatedQuestions = [...state.questions, newQuestion];
      setStorage({ questions: updatedQuestions });
      return { questions: updatedQuestions };
    });
  },
  updateQuestion: (id, updatedData) => {
    set(state => {
      const updatedQuestions = state.questions.map(q => q.id === id ? { ...q, ...updatedData } : q);
      setStorage({ questions: updatedQuestions });
      return { questions: updatedQuestions };
    });
  },
  deleteQuestion: (id) => {
    set(state => {
      const updatedQuestions = state.questions.filter(q => q.id !== id);
      setStorage({ questions: updatedQuestions });
      return { questions: updatedQuestions };
    });
  },
  // We'll also need a way to mark questions as "new/unanswered" for the badge
  // This might involve adding a 'isNew' flag to question objects and a counter in the store.
  // For now, let's assume all questions in the list are "answered" by the user.
  // The content script will handle dynamically adding truly new ones.

  // Profile actions
  updateProfile: (updatedData) => {
    set(state => {
      const updatedProfile = { ...state.profile, ...updatedData };
      setStorage({ profile: updatedProfile });
      return { profile: updatedProfile };
    });
  },
  addEducation: (education) => {
    set(state => {
      const updatedEducation = [...state.profile.education, { id: Date.now(), ...education }];
      const updatedProfile = { ...state.profile, education: updatedEducation };
      setStorage({ profile: updatedProfile });
      return { profile: updatedProfile };
    });
  },
  updateEducation: (id, updatedData) => {
    set(state => {
      const updatedEducation = state.profile.education.map(edu => edu.id === id ? { ...edu, ...updatedData } : edu);
      const updatedProfile = { ...state.profile, education: updatedEducation };
      setStorage({ profile: updatedProfile });
      return { profile: updatedProfile };
    });
  },
  deleteEducation: (id) => {
    set(state => {
      const updatedEducation = state.profile.education.filter(edu => edu.id !== id);
      const updatedProfile = { ...state.profile, education: updatedEducation };
      setStorage({ profile: updatedProfile });
      return { profile: updatedProfile };
    });
  },
  addExperience: (experience) => {
    set(state => {
      const updatedExperience = [...state.profile.experience, { id: Date.now(), ...experience }];
      const updatedProfile = { ...state.profile, experience: updatedExperience };
      setStorage({ profile: updatedProfile });
      return { profile: updatedProfile };
    });
  },
  updateExperience: (id, updatedData) => {
    set(state => {
      const updatedExperience = state.profile.experience.map(exp => exp.id === id ? { ...exp, ...updatedData } : exp);
      const updatedProfile = { ...state.profile, experience: updatedExperience };
      setStorage({ profile: updatedProfile });
      return { profile: updatedProfile };
    });
  },
  deleteExperience: (id) => {
    set(state => {
      const updatedExperience = state.profile.experience.filter(exp => exp.id !== id);
      const updatedProfile = { ...state.profile, experience: updatedExperience };
      setStorage({ profile: updatedProfile });
      return { profile: updatedProfile };
    });
  },

  // Settings actions
  updateSettings: (updatedData) => {
    set(state => {
      const updatedSettings = { ...state.settings, ...updatedData };
      setStorage({ settings: updatedSettings });
      return { settings: updatedSettings };
    });
  },
}));