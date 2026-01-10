import * as XLSX from 'xlsx';
import { LabelData } from '../types';

export async function fetchGoogleSheetData(url: string): Promise<LabelData[]> {
  try {
    const sheetId = extractSheetId(url);
    if (!sheetId) {
      throw new Error('Invalid Google Sheets URL');
    }

    const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;
    const response = await fetch(csvUrl);

    if (!response.ok) {
      throw new Error('Failed to fetch Google Sheets data. Make sure the sheet is publicly accessible.');
    }

    const csvText = await response.text();
    return parseCSV(csvText);
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Failed to fetch Google Sheets data');
  }
}

function extractSheetId(url: string): string | null {
  const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  return match ? match[1] : null;
}

function parseCSV(csvText: string): LabelData[] {
  const lines = csvText.split('\n').filter(line => line.trim());
  if (lines.length < 2) {
    throw new Error('CSV file must have at least a header row and one data row');
  }

  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  const data: LabelData[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length === 0) continue;

    const row: Record<string, string> = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });

    data.push(mapRowToLabelData(row, i));
  }

  return data;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}

export function parseExcelFile(file: File): Promise<LabelData[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 }) as string[][];

        if (jsonData.length < 2) {
          reject(new Error('Excel file must have at least a header row and one data row'));
          return;
        }

        const headers = jsonData[0] as string[];
        const labelData: LabelData[] = [];

        for (let i = 1; i < jsonData.length; i++) {
          const row = jsonData[i];
          if (!row || row.length === 0) continue;

          const rowData: Record<string, string> = {};
          headers.forEach((header, index) => {
            rowData[header] = row[index]?.toString() || '';
          });

          labelData.push(mapRowToLabelData(rowData, i));
        }

        resolve(labelData);
      } catch (error) {
        reject(new Error('Failed to parse Excel file'));
      }
    };

    reader.onerror = () => reject(new Error('Failed to read Excel file'));
    reader.readAsBinaryString(file);
  });
}

function convertExcelDateToString(value: string): string {
  if (!value || !value.trim()) {
    return value;
  }

  const trimmedValue = value.trim();

  // Check if already in DD.MM.YYYY format
  const ddmmyyyyPattern = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/;
  if (ddmmyyyyPattern.test(trimmedValue)) {
    return trimmedValue;
  }

  // Check if it's a JavaScript Date string (contains day names like "Fri", "Mon", etc.)
  if (/^(Mon|Tue|Wed|Thu|Fri|Sat|Sun)/.test(trimmedValue)) {
    try {
      const date = new Date(trimmedValue);
      if (!isNaN(date.getTime())) {
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        return `${day}.${month}.${year}`;
      }
    } catch {
      return trimmedValue;
    }
  }

  // Check for other common date formats with separators
  if (/[\/.:-]/.test(trimmedValue)) {
    // Try to parse as a date string
    try {
      const date = new Date(trimmedValue);
      if (!isNaN(date.getTime())) {
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        return `${day}.${month}.${year}`;
      }
    } catch {
      return trimmedValue;
    }
  }

  // Only treat as Excel serial number if it's purely numeric
  // and doesn't contain any date separators
  const numValue = parseFloat(trimmedValue);

  // Check if the entire string is numeric (not just starts with a number)
  if (!/^\d+(\.\d+)?$/.test(trimmedValue)) {
    return trimmedValue;
  }

  // Excel serial dates are typically between 1 (Jan 1, 1900) and 60000 (year 2064)
  // Use a more realistic range: 1000 (Sept 1902) to avoid converting small numbers
  if (isNaN(numValue) || numValue < 1000 || numValue > 60000) {
    return trimmedValue;
  }

  const excelEpoch = new Date(1899, 11, 30);
  const date = new Date(excelEpoch.getTime() + numValue * 24 * 60 * 60 * 1000);

  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();

  return `${day}.${month}.${year}`;
}

function mapRowToLabelData(row: Record<string, string>, index: number): LabelData {
  const findValue = (possibleKeys: string[]): string => {
    for (const key of possibleKeys) {
      const value = Object.keys(row).find(k =>
        k.toLowerCase().includes(key.toLowerCase())
      );
      if (value && row[value]) {
        return row[value];
      }
    }
    return '';
  };

  const dateValue = findValue(['tarih', 'date', 'değişiklik']);
  const formattedDate = dateValue ? convertExcelDateToString(dateValue) : '';

  return {
    id: `item-${index}-${Date.now()}`,
    productName: findValue(['ürün', 'product', 'name', 'ad', 'isim']),
    price: findValue(['fiyat', 'price', 'tutar']),
    unit: findValue(['birim', 'unit']),
    priceChangeDate: formattedDate,
    productionLocation: findValue(['üretim', 'production', 'location', 'yer', 'yeri']),
  };
}
