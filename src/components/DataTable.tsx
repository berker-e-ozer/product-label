import { useState, useMemo } from 'react';
import { CheckSquare, Square, Search } from 'lucide-react';
import { LabelData } from '../types';

interface DataTableProps {
  data: LabelData[];
  selectedIds: Set<string>;
  onSelectionChange: (selectedIds: Set<string>) => void;
}

export function DataTable({ data, selectedIds, onSelectionChange }: DataTableProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return data;

    const term = searchTerm.toLowerCase();
    return data.filter(item =>
      item.productName.toLowerCase().includes(term) ||
      item.price.toLowerCase().includes(term) ||
      item.unit.toLowerCase().includes(term) ||
      item.productionLocation.toLowerCase().includes(term)
    );
  }, [data, searchTerm]);

  const allSelected = filteredData.length > 0 && filteredData.every(item => selectedIds.has(item.id));

  const handleSelectAll = () => {
    const newSelected = new Set(selectedIds);
    if (allSelected) {
      filteredData.forEach(item => newSelected.delete(item.id));
    } else {
      filteredData.forEach(item => newSelected.add(item.id));
    }
    onSelectionChange(newSelected);
  };

  const handleSelectItem = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    onSelectionChange(newSelected);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search products..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600">
            Selected: <span className="font-semibold">{selectedIds.size}</span> of {data.length}
          </span>
          <button
            onClick={handleSelectAll}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors"
          >
            {allSelected ? 'Deselect All' : 'Select All'}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left w-12">
                  <button
                    onClick={handleSelectAll}
                    className="text-gray-600 hover:text-gray-900"
                  >
                    {allSelected ? (
                      <CheckSquare className="w-5 h-5" />
                    ) : (
                      <Square className="w-5 h-5" />
                    )}
                  </button>
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Product Name</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Price</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Unit</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Date</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Location</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                    {searchTerm ? 'No products found matching your search' : 'No data available'}
                  </td>
                </tr>
              ) : (
                filteredData.map((item) => (
                  <tr
                    key={item.id}
                    className={`hover:bg-gray-50 transition-colors ${
                      selectedIds.has(item.id) ? 'bg-blue-50' : ''
                    }`}
                  >
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleSelectItem(item.id)}
                        className="text-gray-600 hover:text-gray-900"
                      >
                        {selectedIds.has(item.id) ? (
                          <CheckSquare className="w-5 h-5 text-blue-600" />
                        ) : (
                          <Square className="w-5 h-5" />
                        )}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">{item.productName}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{item.price}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{item.unit}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{item.priceChangeDate}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{item.productionLocation}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
