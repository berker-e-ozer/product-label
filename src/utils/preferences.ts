import { FontSettings, DEFAULT_FONT_SETTINGS } from '../types';

const PREFERENCES_KEY = 'labelPrinterPreferences';

export async function savePreferences(fontSettings: FontSettings, googleSheetUrl?: string): Promise<void> {
  const preferences = {
    fontSettings,
    lastGoogleSheetUrl: googleSheetUrl || null,
    updatedAt: new Date().toISOString(),
  };

  try {
    localStorage.setItem(PREFERENCES_KEY, JSON.stringify(preferences));
  } catch (error) {
    console.error('Failed to save preferences to localStorage:', error);
  }
}

export async function loadPreferences(): Promise<{ fontSettings: FontSettings; lastUrl?: string }> {
  try {
    const stored = localStorage.getItem(PREFERENCES_KEY);

    if (!stored) {
      return { fontSettings: DEFAULT_FONT_SETTINGS };
    }

    const preferences = JSON.parse(stored);
    const loadedSettings = preferences.fontSettings as Partial<FontSettings>;
    const fontSettings: FontSettings = {
      ...DEFAULT_FONT_SETTINGS,
      ...loadedSettings,
    };

    return {
      fontSettings,
      lastUrl: preferences.lastGoogleSheetUrl || undefined,
    };
  } catch (error) {
    console.error('Failed to load preferences from localStorage:', error);
    return { fontSettings: DEFAULT_FONT_SETTINGS };
  }
}
