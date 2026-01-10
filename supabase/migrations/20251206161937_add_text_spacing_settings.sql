/*
  # Add Text Spacing Settings

  1. Changes
    - Add `textPadding` field to font_settings with default value of 0
    - Add `textMargin` field to font_settings with default value of 0
    - Update default font_settings JSON to include new fields
  
  2. Notes
    - Adds support for customizable padding and margin around text elements
    - Default values set to 0 to maintain current appearance
    - Existing records remain unchanged, new fields will be handled by application
*/

ALTER TABLE label_preferences 
ALTER COLUMN font_settings 
SET DEFAULT '{
  "productNameFamily": "Arial",
  "productNameSize": 16,
  "priceFamily": "Arial",
  "priceSize": 32,
  "unitFamily": "Arial",
  "unitSize": 24,
  "unitBold": false,
  "bottomTextFamily": "Arial",
  "bottomTextSize": 10,
  "productNameBold": true,
  "priceBold": false,
  "bottomTextBold": false,
  "labelWidth": 38,
  "labelHeight": 58,
  "textPadding": 0,
  "textMargin": 0
}'::jsonb;