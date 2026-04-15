/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { message } from 'antd';
import { API_BASE_URL, API_KEY } from "@/constants";
import { appendRoomParam } from '@/hooks/useRoomAPI';
import { useSearchParams } from 'next/navigation';
import axiosInstance from '@/lib/axios';

interface FilterOption {
  value: string;
  color: string;
  label: string;
}

interface FilterDropdownProps {
  filterQuery: string[];
  setFilterQuery: (query: string[]) => void;
}

// Color mapping for disposition codes
const getDispositionColor = (code: string): string => {
  const colorMap: Record<string, string> = {
    // POSITIVE OUTCOMES
    'PTP': 'bg-blue-500',
    'PAID': 'bg-green-500',
    'PAYNOW': 'bg-emerald-500',
    // NEGATIVE/REFUSAL
    'RTP': 'bg-red-500',
    'RTPF': 'bg-orange-500',
    'RTP_DISPUTE': 'bg-rose-500',
    'NI': 'bg-red-400',
    'DND': 'bg-red-600',
    // FOLLOW-UP NEEDED
    'CLBK': 'bg-cyan-500',
    'CLBK_BUSY': 'bg-yellow-500',
    'CLBK_DATE': 'bg-sky-500',
    'DISPUTE': 'bg-amber-500',
    // INCOMPLETE ENGAGEMENT
    'EARLY_DISCONNECT': 'bg-orange-400',
    'INFO_GIVEN_NO_RESPONSE': 'bg-slate-500',
    'MINIMAL_ENGAGEMENT': 'bg-zinc-500',
    'CUT_MID_CONVERSATION': 'bg-orange-600',
    // WRONG CONTACT
    'WRONG_NUMBER': 'bg-pink-500',
    'THIRD_PARTY': 'bg-purple-500',
    'LANGUAGE_BARRIER': 'bg-indigo-500',
    // HOSTILE/NEGATIVE
    'HOSTILE': 'bg-red-700',
    'ANNOYED': 'bg-rose-400',
    // NO CUSTOMER RESPONSE
    'SILENT_CALL': 'bg-gray-500',
    'GREETING_ONLY': 'bg-neutral-500',
    'DNP': 'bg-stone-500',
    'NONE': 'bg-slate-400',
    'voicemail': 'bg-indigo-500',
  };
  return colorMap[code.toUpperCase()] || colorMap[code] || 'bg-gray-500';
};

export const FilterDropdown: React.FC<FilterDropdownProps> = ({
  filterQuery,
  setFilterQuery
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [filterOptions, setFilterOptions] = useState<FilterOption[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchParams = useSearchParams();
  const selectedRoomFromRedux = searchParams.get('room') || 'main';

  // Fetch disposition options from API
  const fetchFilterOptions = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      const response = await axiosInstance.get(appendRoomParam(`${API_BASE_URL}/templates/disposition?api_key=${API_KEY}`, selectedRoomFromRedux));
      const data = response.data;
      console.log('FilterDropdown API response:', data);
      if (data.status === 'success' && data.template && data.template.data) {
        // Clean up API data - handle keys with trailing spaces
        const options: FilterOption[] = data.template.data.map((item: Record<string, string>) => ({
          value: (item.value || item['value '] || '').trim(),
          color: (item.color || item['color '] || 'bg-gray-500').trim(),
          label: (item.label || item['label '] || '').trim()
        })).filter((opt: FilterOption) => opt.value); // Filter out any with empty values
        setFilterOptions(options);
      } else {
        message.error('Failed to fetch filter options');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      message.error('Error fetching filter options: ' + errorMessage);
    } finally {
      setLoading(false);
    }
  }, [selectedRoomFromRedux]);

  // Fetch filter options on mount
  useEffect(() => {
    fetchFilterOptions();
  }, [fetchFilterOptions]);

  const selectedCount = filterQuery.length;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleFilter = (value: string) => {
    if (filterQuery.includes(value)) {
      setFilterQuery(filterQuery.filter(item => item !== value));
    } else {
      setFilterQuery([...filterQuery, value]);
    }
  };

  const selectAll = () => {
    setFilterQuery([...filterOptions.map(opt => opt.value)]);
  };

  const clearAll = () => {
    setFilterQuery([]);
  };

  return (
    <div className="relative w-full sm:w-auto" ref={dropdownRef}>
      {/* Mobile-first button design */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full px-3 py-2.5 sm:px-4 sm:py-2 bg-white bg-opacity-60 border border-white border-opacity-70 rounded-lg text-gray-700 hover:bg-opacity-80 transition-all duration-300 shadow-sm text-sm sm:text-base min-w-0"
      >
        <div className="flex items-center min-w-0 flex-1">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-4 w-4 mr-2 flex-shrink-0" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          <span className="mr-2 truncate">
            <span className="hidden sm:inline">Filter Outcomes</span>
            <span className="sm:hidden">Filter</span>
          </span>
          {selectedCount > 0 && (
            <span className="inline-flex items-center justify-center px-1.5 py-0.5 sm:px-2 sm:py-1 text-xs font-bold leading-none rounded-full text-white bg-blue-500 ml-1 flex-shrink-0">
              {selectedCount}
            </span>
          )}
        </div>
        <span className="ml-2 flex-shrink-0">
          {isOpen ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          )}
        </span>
      </button>

      {/* Responsive dropdown */}
      {isOpen && (
        <div className="absolute left-0 right-0 sm:right-0 sm:left-auto mt-2 w-full sm:w-64 md:w-72 rounded-xl shadow-lg bg-white border border-white border-opacity-70 z-50 transform origin-top transition-all duration-200 ease-out max-h-80 sm:max-h-96 overflow-hidden">
          {/* Header with controls */}
          <div className="p-3 sm:p-4 border-b border-gray-200 bg-gray-50">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-medium text-gray-900">Filter Options</h3>
              <div className="flex gap-3 sm:gap-4">
                <button
                  onClick={selectAll}
                  className="text-xs sm:text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
                >
                  All
                </button>
                <button
                  onClick={clearAll}
                  className="text-xs sm:text-sm text-red-600 hover:text-red-800 font-medium transition-colors"
                >
                  Clear
                </button>
              </div>
            </div>
          </div>

          {/* Scrollable options list */}
          <div className="overflow-y-auto max-h-64 sm:max-h-80">
            <div className="p-2 sm:p-3 space-y-1">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                  <span className="ml-2 text-sm text-gray-500">Loading...</span>
                </div>
              ) : filterOptions.length === 0 ? (
                <div className="text-center py-8 text-gray-500 text-sm">
                  No filter options available
                </div>
              ) : (
                filterOptions.map((option) => (
                  <div
                    key={option.value}
                    className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 p-2 sm:p-3 rounded-lg transition-all duration-200 group"
                    onClick={() => toggleFilter(option.value)}
                  >
                    <div className="relative flex items-center flex-shrink-0">
                      <input
                        type="checkbox"
                        checked={filterQuery.includes(option.value)}
                        onChange={() => {}}
                        className="w-4 h-4 text-blue-500 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                      />
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                      <div className={`w-3 h-3 rounded-full ${option.color} flex-shrink-0`}></div>
                      <span className="text-gray-700 text-sm sm:text-base truncate group-hover:text-gray-900 transition-colors">
                        <span className="sm:hidden">{option.label || option.value.replace(/_/g, ' ')}</span>
                        <span className="hidden sm:inline capitalize">{option.value.replace(/_/g, ' ')}</span>
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Mobile close button */}
          <div className="sm:hidden p-3 border-t border-gray-200 bg-gray-50">
            <button
              onClick={() => setIsOpen(false)}
              className="w-full px-4 py-2 bg-gray-600 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
};