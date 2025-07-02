'use client';

import React, { useState } from 'react';
import { Table, Plus, Trash2 } from 'lucide-react';
import { useDarkModeContext } from '@/contexts/DarkModeContext';

interface TableData {
  headers: string[];
  rows: string[][];
}

interface TableBlockProps {
  data: {
    table?: TableData;
  };
  onChange: (data: any) => void;
  readOnly?: boolean;
}

export default function TableBlock({ data, onChange, readOnly }: TableBlockProps) {
  const { darkMode } = useDarkModeContext();
  const [tableData, setTableData] = useState<TableData>(
    data.table || { headers: ['العمود 1', 'العمود 2'], rows: [['', '']] }
  );

  const updateTable = (newData: TableData) => {
    setTableData(newData);
    onChange({ table: { table: newData } });
  };

  const addColumn = () => {
    const newHeaders = [...tableData.headers, `العمود ${tableData.headers.length + 1}`];
    const newRows = tableData.rows.map(row => [...row, '']);
    updateTable({ headers: newHeaders, rows: newRows });
  };

  const removeColumn = (index: number) => {
    if (tableData.headers.length <= 1) return;
    const newHeaders = tableData.headers.filter((_, i) => i !== index);
    const newRows = tableData.rows.map(row => row.filter((_, i) => i !== index));
    updateTable({ headers: newHeaders, rows: newRows });
  };

  const addRow = () => {
    const newRow = new Array(tableData.headers.length).fill('');
    updateTable({ ...tableData, rows: [...tableData.rows, newRow] });
  };

  const removeRow = (index: number) => {
    if (tableData.rows.length <= 1) return;
    const newRows = tableData.rows.filter((_, i) => i !== index);
    updateTable({ ...tableData, rows: newRows });
  };

  const updateCell = (rowIndex: number, colIndex: number, value: string) => {
    const newRows = [...tableData.rows];
    newRows[rowIndex][colIndex] = value;
    updateTable({ ...tableData, rows: newRows });
  };

  const updateHeader = (index: number, value: string) => {
    const newHeaders = [...tableData.headers];
    newHeaders[index] = value;
    updateTable({ ...tableData, headers: newHeaders });
  };

  if (readOnly) {
    return (
      <div className="overflow-x-auto rounded-lg">
        <table className={`min-w-full divide-y ${
          darkMode ? 'divide-gray-700' : 'divide-gray-200'
        }`}>
          <thead className={darkMode ? 'bg-gray-800' : 'bg-gray-50'}>
            <tr>
              {tableData.headers.map((header, i) => (
                <th key={i} className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className={`divide-y ${
            darkMode ? 'bg-gray-900 divide-gray-700' : 'bg-white divide-gray-200'
          }`}>
            {tableData.rows.map((row, i) => (
              <tr key={i}>
                {row.map((cell, j) => (
                  <td key={j} className="px-4 py-3 text-sm">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className={`rounded-lg p-4 ${
      darkMode ? 'bg-gray-800' : 'bg-gray-50'
    }`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Table className="w-5 h-5 text-blue-500" />
          <span className="font-medium">جدول بيانات</span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={addColumn}
            className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
            title="إضافة عمود"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            onClick={addRow}
            className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
            title="إضافة صف"
          >
            <Plus className="w-4 h-4 rotate-90" />
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr>
              {tableData.headers.map((header, i) => (
                <th key={i} className="p-2">
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      value={header}
                      onChange={(e) => updateHeader(i, e.target.value)}
                      className={`w-full px-2 py-1 text-sm font-medium rounded ${
                        darkMode 
                          ? 'bg-gray-700 text-white' 
                          : 'bg-white text-gray-900'
                      }`}
                    />
                    {tableData.headers.length > 1 && (
                      <button
                        onClick={() => removeColumn(i)}
                        className="p-1 hover:text-red-500"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tableData.rows.map((row, i) => (
              <tr key={i}>
                {row.map((cell, j) => (
                  <td key={j} className="p-2">
                    <input
                      type="text"
                      value={cell}
                      onChange={(e) => updateCell(i, j, e.target.value)}
                      className={`w-full px-2 py-1 text-sm rounded ${
                        darkMode 
                          ? 'bg-gray-700 text-white' 
                          : 'bg-white text-gray-900'
                      }`}
                    />
                  </td>
                ))}
                <td className="p-2">
                  {tableData.rows.length > 1 && (
                    <button
                      onClick={() => removeRow(i)}
                      className="p-1 hover:text-red-500"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
} 