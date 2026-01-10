export interface LabelData {
  id: string;
  productName: string;
  price: string;
  unit: string;
  priceChangeDate: string;
  productionLocation: string;
}

export interface FontSettings {
  productNameFamily: string;
  productNameSize: number;
  priceFamily: string;
  priceSize: number;
  unitFamily: string;
  unitSize: number;
  unitBold: boolean;
  bottomTextFamily: string;
  bottomTextSize: number;
  productNameBold: boolean;
  priceBold: boolean;
  bottomTextBold: boolean;
  labelWidth: number;
  labelHeight: number;
  textPadding: number;
  textMargin: number;
}

export interface UserPreferences {
  id?: string;
  userId?: string;
  fontSettings: FontSettings;
  lastGoogleSheetUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

export const DEFAULT_FONT_SETTINGS: FontSettings = {
  productNameFamily: 'Arial',
  productNameSize: 16,
  priceFamily: 'Arial',
  priceSize: 32,
  unitFamily: 'Arial',
  unitSize: 24,
  unitBold: false,
  bottomTextFamily: 'Arial',
  bottomTextSize: 10,
  productNameBold: true,
  priceBold: false,
  bottomTextBold: false,
  labelWidth: 38,
  labelHeight: 58,
  textPadding: 0,
  textMargin: 0,
};
