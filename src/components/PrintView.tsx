import { Label } from './Label';
import { LabelData, FontSettings } from '../types';

interface PrintViewProps {
  labels: LabelData[];
  settings: FontSettings;
}

export function PrintView({ labels, settings }: PrintViewProps) {
  return (
    <div className="print-container">
      {labels.map((label) => (
        <Label key={label.id} data={label} settings={settings} scale={1} />
      ))}
    </div>
  );
}
