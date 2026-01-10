import { useState } from 'react';
import { ZoomIn, ZoomOut, Printer } from 'lucide-react';
import { Label } from './Label';
import { LabelData, FontSettings } from '../types';

interface LabelPreviewProps {
  labels: LabelData[];
  settings: FontSettings;
  onPrint: () => void;
}

export function LabelPreview({ labels, settings, onPrint }: LabelPreviewProps) {
  const [zoom, setZoom] = useState(3);

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.5, 5));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.5, 1));

  if (labels.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        <p className="text-gray-500">Select items from the table to preview labels</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-800">
            Label Preview ({labels.length} {labels.length === 1 ? 'label' : 'labels'})
          </h2>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <button
                onClick={handleZoomOut}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                disabled={zoom <= 1}
              >
                <ZoomOut className="w-5 h-5" />
              </button>
              <span className="text-sm text-gray-600 w-16 text-center">{Math.round(zoom * 100)}%</span>
              <button
                onClick={handleZoomIn}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                disabled={zoom >= 5}
              >
                <ZoomIn className="w-5 h-5" />
              </button>
            </div>
            <button
              onClick={onPrint}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              <Printer className="w-5 h-5" />
              Print Labels
            </button>
          </div>
        </div>
      </div>

      <div className="bg-gray-100 rounded-lg p-6 overflow-auto" style={{ maxHeight: '600px' }}>
        <div className="flex flex-wrap gap-4 justify-center">
          {labels.map((label) => (
            <Label key={label.id} data={label} settings={settings} scale={zoom} />
          ))}
        </div>
      </div>
    </div>
  );
}
