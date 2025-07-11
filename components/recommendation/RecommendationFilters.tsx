"use client";

import { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

interface FilterOptions {
  categories: string[];
  algorithms: string[];
  timeRange: number;
  diversityFactor: number;
  freshnessFactor: number;
  excludeViewed: boolean;
  minReadingTime: number;
  maxReadingTime: number;
}

interface RecommendationFiltersProps {
  onFiltersChange: (filters: FilterOptions) => void;
  initialFilters?: Partial<FilterOptions>;
  showAdvanced?: boolean;
}

const CATEGORIES = [
  { key: 'news', label: 'أخبار', icon: '📰' },
  { key: 'sports', label: 'رياضة', icon: '⚽' },
  { key: 'tech', label: 'تقنية', icon: '💻' },
  { key: 'business', label: 'أعمال', icon: '💼' },
  { key: 'health', label: 'صحة', icon: '🏥' },
  { key: 'entertainment', label: 'ترفيه', icon: '🎬' },
  { key: 'science', label: 'علوم', icon: '🔬' },
  { key: 'culture', label: 'ثقافة', icon: '🎭' }
];

const ALGORITHMS = [
  { key: 'personal', label: 'شخصي', description: 'بناءً على اهتماماتك' },
  { key: 'collaborative', label: 'تعاوني', description: 'مستخدمون مشابهون' },
  { key: 'graph', label: 'شبكي', description: 'شبكة التفاعلات' },
  { key: 'trending', label: 'شائع', description: 'المحتوى الرائج' },
  { key: 'ai', label: 'ذكي', description: 'ذكاء اصطناعي' }
];

const TIME_RANGES = [
  { value: 1, label: 'اليوم' },
  { value: 7, label: 'أسبوع' },
  { value: 30, label: 'شهر' },
  { value: 90, label: '3 أشهر' },
  { value: 365, label: 'سنة' }
];

export default function RecommendationFilters({
  onFiltersChange,
  initialFilters = {},
  showAdvanced = false
}: RecommendationFiltersProps) {
  const [filters, setFilters] = useState<FilterOptions>({
    categories: [],
    algorithms: ['personal', 'collaborative'],
    timeRange: 30,
    diversityFactor: 0.3,
    freshnessFactor: 0.2,
    excludeViewed: true,
    minReadingTime: 0,
    maxReadingTime: 60,
    ...initialFilters
  });

  const [showAdvancedOptions, setShowAdvancedOptions] = useState(showAdvanced);
  const [presetMode, setPresetMode] = useState<'balanced' | 'diverse' | 'fresh' | 'custom'>('balanced');

  // تحديث الفلاتر عند التغيير
  useEffect(() => {
    onFiltersChange(filters);
  }, [filters, onFiltersChange]);

  // تطبيق الإعدادات المسبقة
  const applyPreset = (preset: string) => {
    setPresetMode(preset as any);
    
    switch (preset) {
      case 'balanced':
        setFilters(prev => ({
          ...prev,
          algorithms: ['personal', 'collaborative', 'trending'],
          diversityFactor: 0.3,
          freshnessFactor: 0.2,
          timeRange: 30
        }));
        break;
      case 'diverse':
        setFilters(prev => ({
          ...prev,
          algorithms: ['personal', 'collaborative', 'graph'],
          diversityFactor: 0.7,
          freshnessFactor: 0.1,
          timeRange: 90
        }));
        break;
      case 'fresh':
        setFilters(prev => ({
          ...prev,
          algorithms: ['trending', 'personal'],
          diversityFactor: 0.1,
          freshnessFactor: 0.8,
          timeRange: 7
        }));
        break;
      case 'custom':
        // لا تغيير - المستخدم يتحكم بالكامل
        break;
    }
  };

  // تحديث فئة واحدة
  const toggleCategory = (category: string) => {
    setFilters(prev => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter(c => c !== category)
        : [...prev.categories, category]
    }));
    setPresetMode('custom');
  };

  // تحديث خوارزمية واحدة
  const toggleAlgorithm = (algorithm: string) => {
    setFilters(prev => ({
      ...prev,
      algorithms: prev.algorithms.includes(algorithm)
        ? prev.algorithms.filter(a => a !== algorithm)
        : [...prev.algorithms, algorithm]
    }));
    setPresetMode('custom');
  };

  // تحديث قيمة رقمية
  const updateNumericFilter = (key: keyof FilterOptions, value: number) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
    setPresetMode('custom');
  };

  // تحديث قيمة منطقية
  const updateBooleanFilter = (key: keyof FilterOptions, value: boolean) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
    setPresetMode('custom');
  };

  // إعادة تعيين الفلاتر
  const resetFilters = () => {
    setFilters({
      categories: [],
      algorithms: ['personal', 'collaborative'],
      timeRange: 30,
      diversityFactor: 0.3,
      freshnessFactor: 0.2,
      excludeViewed: true,
      minReadingTime: 0,
      maxReadingTime: 60
    });
    setPresetMode('balanced');
  };

  return (
    <div className="space-y-6">
      {/* Preset Options */}
      <Card className="p-4">
        <h3 className="font-semibold mb-3">الإعدادات المسبقة</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {[
            { key: 'balanced', label: 'متوازن', description: 'توازن بين الدقة والتنوع' },
            { key: 'diverse', label: 'متنوع', description: 'تنوع أكبر في المحتوى' },
            { key: 'fresh', label: 'حديث', description: 'التركيز على المحتوى الجديد' },
            { key: 'custom', label: 'مخصص', description: 'تحكم كامل في الإعدادات' }
          ].map(preset => (
            <Button
              key={preset.key}
              variant={presetMode === preset.key ? 'primary' : 'outline'}
              size="sm"
              onClick={() => applyPreset(preset.key)}
              className="flex flex-col items-center p-3 h-auto"
              title={preset.description}
            >
              <span className="font-medium">{preset.label}</span>
              <span className="text-xs opacity-75 mt-1">{preset.description}</span>
            </Button>
          ))}
        </div>
      </Card>

      {/* Categories Filter */}
      <Card className="p-4">
        <h3 className="font-semibold mb-3">الفئات المفضلة</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {CATEGORIES.map(category => (
            <Button
              key={category.key}
              variant={filters.categories.includes(category.key) ? 'primary' : 'outline'}
              size="sm"
              onClick={() => toggleCategory(category.key)}
              className="flex items-center gap-2"
            >
              <span>{category.icon}</span>
              <span>{category.label}</span>
            </Button>
          ))}
        </div>
        {filters.categories.length === 0 && (
          <p className="text-sm text-gray-500 mt-2">لم يتم تحديد فئات - سيتم عرض جميع الفئات</p>
        )}
      </Card>

      {/* Algorithms Filter */}
      <Card className="p-4">
        <h3 className="font-semibold mb-3">خوارزميات التوصية</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
          {ALGORITHMS.map(algorithm => (
            <Button
              key={algorithm.key}
              variant={filters.algorithms.includes(algorithm.key) ? 'primary' : 'outline'}
              size="sm"
              onClick={() => toggleAlgorithm(algorithm.key)}
              className="flex flex-col items-start p-3 h-auto text-left"
              title={algorithm.description}
            >
              <span className="font-medium">{algorithm.label}</span>
              <span className="text-xs opacity-75 mt-1">{algorithm.description}</span>
            </Button>
          ))}
        </div>
        {filters.algorithms.length === 0 && (
          <p className="text-sm text-red-500 mt-2">يجب اختيار خوارزمية واحدة على الأقل</p>
        )}
      </Card>

      {/* Time Range */}
      <Card className="p-4">
        <h3 className="font-semibold mb-3">النطاق الزمني</h3>
        <div className="flex flex-wrap gap-2">
          {TIME_RANGES.map(range => (
            <Button
              key={range.value}
              variant={filters.timeRange === range.value ? 'primary' : 'outline'}
              size="sm"
              onClick={() => updateNumericFilter('timeRange', range.value)}
            >
              {range.label}
            </Button>
          ))}
        </div>
      </Card>

      {/* Basic Options */}
      <Card className="p-4">
        <h3 className="font-semibold mb-3">خيارات أساسية</h3>
        <div className="space-y-3">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={filters.excludeViewed}
              onChange={(e) => updateBooleanFilter('excludeViewed', e.target.checked)}
              className="rounded"
            />
            <span className="text-sm">استبعاد المقالات المقروءة</span>
          </label>
        </div>
      </Card>

      {/* Advanced Options Toggle */}
      <div className="text-center">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
        >
          {showAdvancedOptions ? 'إخفاء الخيارات المتقدمة' : 'إظهار الخيارات المتقدمة'}
        </Button>
      </div>

      {/* Advanced Options */}
      {showAdvancedOptions && (
        <div className="space-y-4">
          {/* Diversity Factor */}
          <Card className="p-4">
            <h3 className="font-semibold mb-3">عامل التنوع</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>تركيز</span>
                <span>متنوع</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={filters.diversityFactor}
                onChange={(e) => updateNumericFilter('diversityFactor', parseFloat(e.target.value))}
                className="w-full"
              />
              <div className="text-center text-sm text-gray-600">
                {Math.round(filters.diversityFactor * 100)}%
              </div>
            </div>
          </Card>

          {/* Freshness Factor */}
          <Card className="p-4">
            <h3 className="font-semibold mb-3">عامل الحداثة</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>كلاسيكي</span>
                <span>حديث</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={filters.freshnessFactor}
                onChange={(e) => updateNumericFilter('freshnessFactor', parseFloat(e.target.value))}
                className="w-full"
              />
              <div className="text-center text-sm text-gray-600">
                {Math.round(filters.freshnessFactor * 100)}%
              </div>
            </div>
          </Card>

          {/* Reading Time Range */}
          <Card className="p-4">
            <h3 className="font-semibold mb-3">وقت القراءة المفضل</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">الحد الأدنى (دقائق)</label>
                <input
                  type="number"
                  min="0"
                  max="60"
                  value={filters.minReadingTime}
                  onChange={(e) => updateNumericFilter('minReadingTime', parseInt(e.target.value) || 0)}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">الحد الأقصى (دقائق)</label>
                <input
                  type="number"
                  min="0"
                  max="120"
                  value={filters.maxReadingTime}
                  onChange={(e) => updateNumericFilter('maxReadingTime', parseInt(e.target.value) || 60)}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                />
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Reset Button */}
      <div className="text-center">
        <Button
          variant="outline"
          onClick={resetFilters}
          className="text-red-600 border-red-300 hover:bg-red-50"
        >
          إعادة تعيين جميع الفلاتر
        </Button>
      </div>

      {/* Current Filters Summary */}
      <Card className="p-4 bg-gray-50">
        <h3 className="font-semibold mb-2">ملخص الفلاتر الحالية</h3>
        <div className="space-y-1 text-sm text-gray-600">
          <div>
            <strong>الفئات:</strong> {filters.categories.length > 0 ? filters.categories.join(', ') : 'جميع الفئات'}
          </div>
          <div>
            <strong>الخوارزميات:</strong> {filters.algorithms.join(', ')}
          </div>
          <div>
            <strong>النطاق الزمني:</strong> {TIME_RANGES.find(r => r.value === filters.timeRange)?.label}
          </div>
          <div>
            <strong>التنوع:</strong> {Math.round(filters.diversityFactor * 100)}%
          </div>
          <div>
            <strong>الحداثة:</strong> {Math.round(filters.freshnessFactor * 100)}%
          </div>
          <div>
            <strong>وقت القراءة:</strong> {filters.minReadingTime} - {filters.maxReadingTime} دقيقة
          </div>
        </div>
      </Card>
    </div>
  );
} 