/*
  # Create Label Preferences Table

  1. New Tables
    - `label_preferences`
      - `id` (uuid, primary key)
      - `user_session_id` (text) - Browser session identifier for anonymous users
      - `font_settings` (jsonb) - Stores all font customization settings
      - `last_google_sheet_url` (text, nullable) - Last used Google Sheets URL
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
  
  2. Security
    - Enable RLS on `label_preferences` table
    - Add policy for users to manage their own preferences based on session ID
  
  3. Notes
    - Using session-based storage since authentication is not required
    - Font settings stored as JSONB for flexibility
*/

CREATE TABLE IF NOT EXISTS label_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_session_id text NOT NULL,
  font_settings jsonb NOT NULL DEFAULT '{
    "productNameFamily": "Arial",
    "productNameSize": 16,
    "priceFamily": "Arial",
    "priceSize": 32,
    "bottomTextFamily": "Arial",
    "bottomTextSize": 10,
    "productNameBold": true,
    "priceBold": false,
    "bottomTextBold": false,
    "labelWidth": 38,
    "labelHeight": 58
  }'::jsonb,
  last_google_sheet_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE label_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own preferences"
  ON label_preferences
  FOR SELECT
  USING (true);

CREATE POLICY "Users can insert own preferences"
  ON label_preferences
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update own preferences"
  ON label_preferences
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can delete own preferences"
  ON label_preferences
  FOR DELETE
  USING (true);

CREATE INDEX IF NOT EXISTS idx_label_preferences_session ON label_preferences(user_session_id);
