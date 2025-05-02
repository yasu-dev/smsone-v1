import React, { useState, useRef, useEffect } from 'react';
import { Download, Filter } from 'lucide-react';

type PeriodType = 'today' | '7days' | '14days' | '30days' | '90days' | 'custom';

interface ExportControlsProps {
  onExport: () => void;
  onPeriodChange: (period: PeriodType) => void;
  onCustomPeriodChange?: (startDate: string, endDate: string) => void;
  selectedPeriod?: PeriodType;
  isLoading?: boolean;
}

export const ExportControls: React.FC<ExportControlsProps> = ({
  onExport,
  onPeriodChange,
  onCustomPeriodChange,
  selectedPeriod,
  isLoading = false,
}) => {
  const [showPeriodSelector, setShowPeriodSelector] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const periodSelectorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (periodSelectorRef.current && !periodSelectorRef.current.contains(event.target as Node)) {
        setShowPeriodSelector(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleDateRangeApply = () => {
    if (startDate && endDate && onCustomPeriodChange) {
      onCustomPeriodChange(startDate, endDate);
      onPeriodChange('custom');
      setShowPeriodSelector(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <div className="relative" ref={periodSelectorRef}>
        <button
          type="button"
          className="btn-secondary flex items-center gap-1"
          onClick={() => setShowPeriodSelector(!showPeriodSelector)}
        >
          <Filter className="h-4 w-4" />
          期間指定
        </button>

        {showPeriodSelector && (
          <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg z-10 py-2">
            <button
              className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${
                selectedPeriod === 'today' ? 'text-blue-600 bg-blue-50' : 'text-gray-700'
              }`}
              onClick={() => {
                onPeriodChange('today');
                setShowPeriodSelector(false);
              }}
            >
              今日
            </button>
            <button
              className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${
                selectedPeriod === '7days' ? 'text-blue-600 bg-blue-50' : 'text-gray-700'
              }`}
              onClick={() => {
                onPeriodChange('7days');
                setShowPeriodSelector(false);
              }}
            >
              直近7日間
            </button>
            <button
              className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${
                selectedPeriod === '30days' ? 'text-blue-600 bg-blue-50' : 'text-gray-700'
              }`}
              onClick={() => {
                onPeriodChange('30days');
                setShowPeriodSelector(false);
              }}
            >
              直近30日間
            </button>
            <div className="px-4 py-2">
              <div className="text-sm text-gray-700 mb-2">期間指定</div>
              <div className="space-y-2">
                <input
                  type="date"
                  className="w-full px-3 py-1.5 text-sm border rounded-md"
                  placeholder="年/月/日"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
                <input
                  type="date"
                  className="w-full px-3 py-1.5 text-sm border rounded-md"
                  placeholder="年/月/日"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
                <button
                  className="w-full px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  onClick={handleDateRangeApply}
                >
                  適用
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}; 