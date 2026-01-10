import { Settings, RotateCcw } from 'lucide-react';
import { FontSettings, DEFAULT_FONT_SETTINGS } from '../types';

interface SettingsPanelProps {
  settings: FontSettings;
  onSettingsChange: (settings: FontSettings) => void;
}

const FONT_FAMILIES = [
  'Arial',
  'Helvetica',
  'Times New Roman',
  'Georgia',
  'Verdana',
  'Courier New',
  'Trebuchet MS',
  'Tahoma',
];

export function SettingsPanel({ settings, onSettingsChange }: SettingsPanelProps) {
  const updateSetting = <K extends keyof FontSettings>(key: K, value: FontSettings[K]) => {
    onSettingsChange({ ...settings, [key]: value });
  };

  const resetToDefaults = () => {
    onSettingsChange(DEFAULT_FONT_SETTINGS);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Settings className="w-6 h-6 text-purple-600" />
          <h2 className="text-xl font-semibold text-gray-800">Label Settings</h2>
        </div>
        <button
          onClick={resetToDefaults}
          className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          Reset
        </button>
      </div>

      <div className="space-y-6">
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">Label Dimensions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-2">Width (mm)</label>
              <input
                type="number"
                min="20"
                max="100"
                value={settings.labelWidth}
                onChange={(e) => updateSetting('labelWidth', Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-2">Height (mm)</label>
              <input
                type="number"
                min="20"
                max="150"
                value={settings.labelHeight}
                onChange={(e) => updateSetting('labelHeight', Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
              />
            </div>
          </div>
          <p className="text-sm text-gray-500">Current: {settings.labelWidth}mm × {settings.labelHeight}mm</p>
        </div>

        <div className="h-px bg-gray-200"></div>

        <div className="space-y-4">
          <h3 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">Product Name</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-2">Font Family</label>
              <select
                value={settings.productNameFamily}
                onChange={(e) => updateSetting('productNameFamily', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
              >
                {FONT_FAMILIES.map((font) => (
                  <option key={font} value={font}>
                    {font}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-2">Font Size (px)</label>
              <input
                type="number"
                min="8"
                max="32"
                value={settings.productNameSize}
                onChange={(e) => updateSetting('productNameSize', Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
              />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.productNameBold}
                  onChange={(e) => updateSetting('productNameBold', e.target.checked)}
                  className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                />
                <span className="text-sm text-gray-700">Bold</span>
              </label>
            </div>
          </div>
        </div>

        <div className="h-px bg-gray-200"></div>

        <div className="space-y-4">
          <h3 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">Price</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-2">Font Family</label>
              <select
                value={settings.priceFamily}
                onChange={(e) => updateSetting('priceFamily', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
              >
                {FONT_FAMILIES.map((font) => (
                  <option key={font} value={font}>
                    {font}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-2">Font Size (px)</label>
              <input
                type="number"
                min="16"
                max="64"
                value={settings.priceSize}
                onChange={(e) => updateSetting('priceSize', Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
              />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.priceBold}
                  onChange={(e) => updateSetting('priceBold', e.target.checked)}
                  className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                />
                <span className="text-sm text-gray-700">Bold</span>
              </label>
            </div>
          </div>
        </div>

        <div className="h-px bg-gray-200"></div>

        <div className="space-y-4">
          <h3 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">Unit</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-2">Font Family</label>
              <select
                value={settings.unitFamily}
                onChange={(e) => updateSetting('unitFamily', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
              >
                {FONT_FAMILIES.map((font) => (
                  <option key={font} value={font}>
                    {font}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-2">Font Size (px)</label>
              <input
                type="number"
                min="12"
                max="48"
                value={settings.unitSize}
                onChange={(e) => updateSetting('unitSize', Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
              />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.unitBold}
                  onChange={(e) => updateSetting('unitBold', e.target.checked)}
                  className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                />
                <span className="text-sm text-gray-700">Bold</span>
              </label>
            </div>
          </div>
        </div>

        <div className="h-px bg-gray-200"></div>

        <div className="space-y-4">
          <h3 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">Text Spacing</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-2">Padding (px)</label>
              <input
                type="number"
                min="0"
                max="20"
                value={settings.textPadding}
                onChange={(e) => updateSetting('textPadding', Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
              />
              <p className="text-xs text-gray-500 mt-1">Inner spacing around text</p>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-2">Margin (px)</label>
              <input
                type="number"
                min="0"
                max="20"
                value={settings.textMargin}
                onChange={(e) => updateSetting('textMargin', Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
              />
              <p className="text-xs text-gray-500 mt-1">Outer spacing between elements</p>
            </div>
          </div>
        </div>

        <div className="h-px bg-gray-200"></div>

        <div className="space-y-4">
          <h3 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">Bottom Text (Location & Date)</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-2">Font Family</label>
              <select
                value={settings.bottomTextFamily}
                onChange={(e) => updateSetting('bottomTextFamily', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
              >
                {FONT_FAMILIES.map((font) => (
                  <option key={font} value={font}>
                    {font}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-2">Font Size (px)</label>
              <input
                type="number"
                min="6"
                max="20"
                value={settings.bottomTextSize}
                onChange={(e) => updateSetting('bottomTextSize', Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
              />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.bottomTextBold}
                  onChange={(e) => updateSetting('bottomTextBold', e.target.checked)}
                  className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                />
                <span className="text-sm text-gray-700">Bold</span>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
