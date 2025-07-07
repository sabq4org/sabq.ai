'use client';

import React from 'react';
import { BarChart3, TrendingUp, PieChart, LineChart } from 'lucide-react';

interface ChartData {
  type: 'bar' | 'line' | 'pie';
  title: string;
  data: any[];
  description?: string;
}

interface EconomicChartsProps {
  charts: ChartData[];
  darkMode?: boolean;
}

export default function EconomicCharts({ charts, darkMode = false }: EconomicChartsProps) {
  const renderBarChart = (data: any[], title: string) => (
    <div className={`p-6 rounded-xl ${darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'} shadow-lg`}>
      <h4 className={`text-lg font-bold mb-4 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
        <BarChart3 className="w-5 h-5 text-blue-500" />
        {title}
      </h4>
      
      <div className="space-y-3">
        {data.map((item, index) => (
          <div key={index} className="flex items-center justify-between">
            <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              {item.label}
            </span>
            <div className="flex items-center gap-3 flex-1 mx-4">
              <div className="flex-1 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                <div 
                  className="h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-1000"
                  style={{ width: `${item.percentage}%` }}
                ></div>
              </div>
              <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                {item.value}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderLineChart = (data: any[], title: string) => (
    <div className={`p-6 rounded-xl ${darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'} shadow-lg`}>
      <h4 className={`text-lg font-bold mb-4 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
        <LineChart className="w-5 h-5 text-green-500" />
        {title}
      </h4>
      
      <div className="relative h-32 flex items-end justify-between gap-2">
        {data.map((item, index) => (
          <div key={index} className="flex flex-col items-center flex-1">
            <div 
              className="w-full bg-gradient-to-t from-green-500 to-green-300 rounded-t-md transition-all duration-1000 hover:from-green-600 hover:to-green-400"
              style={{ height: `${item.percentage}%` }}
            ></div>
            <span className={`text-xs mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {item.label}
            </span>
          </div>
        ))}
      </div>
      
      <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
        <div className="text-center">
          <div className={`font-bold text-lg ${darkMode ? 'text-green-400' : 'text-green-600'}`}>
            {data[data.length - 1]?.value || 'N/A'}
          </div>
          <div className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            القيمة الحالية
          </div>
        </div>
        <div className="text-center">
          <div className={`font-bold text-lg ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
            +{((data[data.length - 1]?.value - data[0]?.value) / data[0]?.value * 100).toFixed(1)}%
          </div>
          <div className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            النمو
          </div>
        </div>
      </div>
    </div>
  );

  const renderPieChart = (data: any[], title: string) => {
    const total = data.reduce((sum, item) => sum + item.value, 0);
    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];
    
    return (
      <div className={`p-6 rounded-xl ${darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'} shadow-lg`}>
        <h4 className={`text-lg font-bold mb-4 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
          <PieChart className="w-5 h-5 text-purple-500" />
          {title}
        </h4>
        
        <div className="space-y-3">
          {data.map((item, index) => {
            const percentage = ((item.value / total) * 100).toFixed(1);
            return (
              <div key={index} className="flex items-center gap-3">
                <div 
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: colors[index % colors.length] }}
                ></div>
                <span className={`text-sm flex-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  {item.label}
                </span>
                <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  {percentage}%
                </span>
              </div>
            );
          })}
        </div>
        
        <div className="mt-4 text-center">
          <div className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
            {total.toLocaleString()}
          </div>
          <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            المجموع الكلي
          </div>
        </div>
      </div>
    );
  };

  if (!charts || charts.length === 0) {
    return null;
  }

  return (
    <section className="mb-12">
      <h2 className={`text-2xl font-bold mb-6 flex items-center gap-3 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
        <TrendingUp className={`w-6 h-6 ${darkMode ? 'text-green-400' : 'text-green-600'}`} />
        الرسوم البيانية والإحصائيات
      </h2>
      
      <div className="grid gap-6 md:grid-cols-2">
        {charts.map((chart, index) => {
          switch (chart.type) {
            case 'bar':
              return (
                <div key={index}>
                  {renderBarChart(chart.data, chart.title)}
                  {chart.description && (
                    <p className={`mt-2 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {chart.description}
                    </p>
                  )}
                </div>
              );
            case 'line':
              return (
                <div key={index}>
                  {renderLineChart(chart.data, chart.title)}
                  {chart.description && (
                    <p className={`mt-2 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {chart.description}
                    </p>
                  )}
                </div>
              );
            case 'pie':
              return (
                <div key={index}>
                  {renderPieChart(chart.data, chart.title)}
                  {chart.description && (
                    <p className={`mt-2 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {chart.description}
                    </p>
                  )}
                </div>
              );
            default:
              return null;
          }
        })}
      </div>
    </section>
  );
} 