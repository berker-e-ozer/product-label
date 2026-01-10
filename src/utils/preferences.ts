import { supabase, getSessionId } from '../lib/supabase';
import { FontSettings, DEFAULT_FONT_SETTINGS } from '../types';

export async function savePreferences(fontSettings: FontSettings, googleSheetUrl?: string): Promise<void> {
  const sessionId = getSessionId();

  const { data: existing } = await supabase
    .from('label_preferences')
    .select('id')
    .eq('user_session_id', sessionId)
    .maybeSingle();

  const payload = {
    user_session_id: sessionId,
    font_settings: fontSettings,
    last_google_sheet_url: googleSheetUrl || null,
    updated_at: new Date().toISOString(),
  };

  if (existing) {
    const { error } = await supabase
      .from('label_preferences')
      .update(payload)
      .eq('id', existing.id);

    if (error) {
      console.error('Failed to update preferences:', error);
    }
  } else {
    const { error } = await supabase
      .from('label_preferences')
      .insert(payload);

    if (error) {
      console.error('Failed to save preferences:', error);
    }
  }
}

export async function loadPreferences(): Promise<{ fontSettings: FontSettings; lastUrl?: string }> {
  const sessionId = getSessionId();

  const { data, error } = await supabase
    .from('label_preferences')
    .select('font_settings, last_google_sheet_url')
    .eq('user_session_id', sessionId)
    .maybeSingle();

  if (error || !data) {
    return { fontSettings: DEFAULT_FONT_SETTINGS };
  }

  const loadedSettings = data.font_settings as Partial<FontSettings>;
  const fontSettings: FontSettings = {
    ...DEFAULT_FONT_SETTINGS,
    ...loadedSettings,
  };

  return {
    fontSettings,
    lastUrl: data.last_google_sheet_url || undefined,
  };
}
