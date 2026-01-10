import { useState } from 'react';
import { Upload, Link as LinkIcon, AlertCircle } from 'lucide-react';
import { fetchGoogleSheetData, parseExcelFile } from '../utils/dataParser';
import { LabelData } from '../types';

interface DataImportProps {
  onDataImported: (data: LabelData[]) => void;
}

export function DataImport({ onDataImported }: DataImportProps) {
  const [googleSheetUrl, setGoogleSheetUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleSheetImport = async () => {
    if (!googleSheetUrl.trim()) {
      setError('Please enter a Google Sheets URL');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await fetchGoogleSheetData(googleSheetUrl);
      if (data.length === 0) {
        setError('No data found in the spreadsheet');
      } else {
        onDataImported(data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import data');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validExtensions = ['.xlsx', '.xls', '.numbers'];
    const isValid = validExtensions.some(ext => file.name.toLowerCase().endsWith(ext));

    if (!isValid) {
      setError('Please upload an Excel or Numbers file (.xlsx, .xls, or .numbers)');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await parseExcelFile(file);
      if (data.length === 0) {
        setError('No data found in the file');
      } else {
        onDataImported(data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse file');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center gap-3 mb-4">
          <LinkIcon className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-800">Google Sheets URL</h2>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          Enter a publicly accessible Google Sheets URL. Make sure the sheet is set to "Anyone with the link can view".
        </p>
        <div className="flex gap-3">
          <input
            type="text"
            value={googleSheetUrl}
            onChange={(e) => setGoogleSheetUrl(e.target.value)}
            placeholder="https://docs.google.com/spreadsheets/d/..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            disabled={loading}
          />
          <button
            onClick={handleGoogleSheetImport}
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {loading ? 'Loading...' : 'Import'}
          </button>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex-1 h-px bg-gray-300"></div>
        <span className="text-gray-500 font-medium">OR</span>
        <div className="flex-1 h-px bg-gray-300"></div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center gap-3 mb-4">
          <Upload className="w-6 h-6 text-green-600" />
          <h2 className="text-xl font-semibold text-gray-800">Upload File</h2>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          Upload an Excel or Apple Numbers file containing your product data.
        </p>
        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <Upload className="w-10 h-10 text-gray-400 mb-2" />
            <p className="text-sm text-gray-600">
              <span className="font-semibold">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-gray-500 mt-1">Excel (.xlsx, .xls) or Numbers (.numbers)</p>
          </div>
          <input
            type="file"
            className="hidden"
            accept=".xlsx,.xls,.numbers"
            onChange={handleFileUpload}
            disabled={loading}
          />
        </label>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-red-800 font-medium">Error</p>
            <p className="text-red-700 text-sm mt-1">{error}</p>
          </div>
        </div>
      )}
    </div>
  );
}
