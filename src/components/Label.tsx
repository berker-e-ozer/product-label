import { LabelData, FontSettings } from '../types';

interface LabelProps {
  data: LabelData;
  settings: FontSettings;
  scale?: number;
}

export function Label({ data, settings, scale = 1 }: LabelProps) {
  const labelWidth = settings.labelWidth;
  const labelHeight = settings.labelHeight;

  return (
    <div
      className="label-container bg-white border border-gray-300 flex flex-col justify-between"
      style={{
        width: `${labelWidth * scale}mm`,
        height: `${labelHeight * scale}mm`,
        padding: `${2 * scale}mm`,
        pageBreakInside: 'avoid',
      }}
    >
      <div className="flex-1 flex flex-col justify-between">
        <div
          style={{
            fontFamily: settings.productNameFamily,
            fontSize: `${settings.productNameSize * scale}px`,
            fontWeight: settings.productNameBold ? 'bold' : 'normal',
            textAlign: 'center',
            lineHeight: '1.2',
            marginBottom: `${1 * scale}mm`,
            padding: `${settings.textPadding * scale}px`,
            margin: `${settings.textMargin * scale}px`,
          }}
        >
          {data.productName}
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'center',
            gap: `${1 * scale}mm`,
            margin: `${(2 + settings.textMargin) * scale}px 0`,
            lineHeight: '1',
            padding: `${settings.textPadding * scale}px`,
          }}
        >
          <span
            style={{
              fontFamily: settings.priceFamily,
              fontSize: `${settings.priceSize * scale}px`,
              fontWeight: settings.priceBold ? 'bold' : 'normal',
            }}
          >
            {data.price}
          </span>
          <span
            style={{
              fontFamily: settings.unitFamily,
              fontSize: `${settings.unitSize * scale}px`,
              fontWeight: settings.unitBold ? 'bold' : 'normal',
            }}
          >
            {data.unit}
          </span>
        </div>

        <div
          style={{
            fontFamily: settings.bottomTextFamily,
            fontSize: `${settings.bottomTextSize * scale}px`,
            fontWeight: settings.bottomTextBold ? 'bold' : 'normal',
            lineHeight: '1.3',
            padding: `${settings.textPadding * scale}px`,
            margin: `${settings.textMargin * scale}px`,
          }}
        >
          <div>Üretim Yeri: {data.productionLocation}</div>
          <div>Fiyat Değişiklik Tarihi: {data.priceChangeDate}</div>
        </div>
      </div>
    </div>
  );
}
