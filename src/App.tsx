import { useState, useEffect } from 'react';
import { Printer } from 'lucide-react';
import { DataImport } from './components/DataImport';
import { DataTable } from './components/DataTable';
import { SettingsPanel } from './components/SettingsPanel';
import { LabelPreview } from './components/LabelPreview';
import { PrintView } from './components/PrintView';
import { LabelData, FontSettings, DEFAULT_FONT_SETTINGS } from './types';
import { loadPreferences, savePreferences } from './utils/preferences';

function App() {
  const [data, setData] = useState<LabelData[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [fontSettings, setFontSettings] = useState<FontSettings>(DEFAULT_FONT_SETTINGS);
  const [isPrinting, setIsPrinting] = useState(false);
  const [currentStep, setCurrentStep] = useState<'import' | 'preview' | 'customize'>('import');

  useEffect(() => {
    loadPreferences().then(({ fontSettings: savedSettings }) => {
      setFontSettings(savedSettings);
    });
  }, []);

  useEffect(() => {
    if (Object.keys(fontSettings).length > 0) {
      savePreferences(fontSettings);
    }
  }, [fontSettings]);

  const handleDataImported = (importedData: LabelData[]) => {
    setData(importedData);
    const allIds = new Set(importedData.map(item => item.id));
    setSelectedIds(allIds);
    setCurrentStep('preview');
  };

  const handlePrint = () => {
    setIsPrinting(true);
    setTimeout(() => {
      window.print();
      setIsPrinting(false);
    }, 100);
  };

  const selectedLabels = data.filter(item => selectedIds.has(item.id));

  if (isPrinting) {
    return <PrintView labels={selectedLabels} settings={fontSettings} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="no-print">
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center gap-3">
              <Printer className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Label Printer</h1>
                <p className="text-gray-600 text-sm mt-1">
                  Import data and create professional {fontSettings.labelWidth}x{fontSettings.labelHeight}mm labels
                </p>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6 flex items-center gap-2">
            {['import', 'preview', 'customize'].map((step, index) => (
              <div key={step} className="flex items-center">
                {index > 0 && <div className="w-8 h-0.5 bg-gray-300 mx-2"></div>}
                <div
                  className={`px-4 py-2 rounded-lg font-medium text-sm ${
                    currentStep === step
                      ? 'bg-blue-600 text-white'
                      : data.length > 0
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {index + 1}. {step.charAt(0).toUpperCase() + step.slice(1)}
                </div>
              </div>
            ))}
          </div>

          {currentStep === 'import' && (
            <div className="space-y-6">
              <DataImport onDataImported={handleDataImported} />
            </div>
          )}

          {currentStep === 'preview' && data.length > 0 && (
            <div className="space-y-6">
              <DataTable
                data={data}
                selectedIds={selectedIds}
                onSelectionChange={setSelectedIds}
              />
              <div className="flex justify-between items-center">
                <button
                  onClick={() => setCurrentStep('import')}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                >
                  Back to Import
                </button>
                <button
                  onClick={() => setCurrentStep('customize')}
                  disabled={selectedIds.size === 0}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  Continue to Customize
                </button>
              </div>
            </div>
          )}

          {currentStep === 'customize' && data.length > 0 && (
            <div className="space-y-6">
              <SettingsPanel settings={fontSettings} onSettingsChange={setFontSettings} />
              <LabelPreview labels={selectedLabels} settings={fontSettings} onPrint={handlePrint} />
              <div className="flex justify-between items-center">
                <button
                  onClick={() => setCurrentStep('preview')}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                >
                  Back to Preview
                </button>
                <button
                  onClick={() => setCurrentStep('import')}
                  className="px-6 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                >
                  Import New Data
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
