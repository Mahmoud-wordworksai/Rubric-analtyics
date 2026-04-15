import React, { useState, useEffect, useRef } from 'react';

interface FilterDropdownProps {
  filterQuery: string[];
  setFilterQuery: (query: string[]) => void;
}

export const FilterDropdown: React.FC<FilterDropdownProps> = ({
  filterQuery,
  setFilterQuery
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
 const filterOptions = [
  { value: "committed", color: "bg-green-500" },
  { value: "partial_payment", color: "bg-blue-500" },
  { value: "refused", color: "bg-red-500" },
  { value: "requested_extension", color: "bg-yellow-500" },
  { value: "escalation_needed", color: "bg-purple-500" },
  { value: "no_response", color: "bg-gray-500" },
  { value: "voicemail", color: "bg-indigo-500" },
 ];

  const selectedCount = filterQuery.length;
  
  // Close dropdown when clicking outside
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

  // Handle selecting or deselecting a filter option
  const toggleFilter = (value: string) => {
    if (filterQuery.includes(value)) {
      setFilterQuery(filterQuery.filter(item => item !== value));
    } else {
      setFilterQuery([...filterQuery, value]);
    }
  };

  // Select all filter options
  const selectAll = () => {
    setFilterQuery([...filterOptions.map(opt => opt.value)]);
  };

  // Clear all selected filter options
  const clearAll = () => {
    setFilterQuery([]);
  };
  
  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center px-4 py-2 bg-white bg-opacity-60 border border-white border-opacity-70 rounded-lg text-gray-700 hover:bg-opacity-80 transition-all duration-300 shadow-sm w-full sm:w-auto"
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className="h-4 w-4 mr-2" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
        </svg>
        <span className="mr-2">Filter Outcomes</span>
        
        {selectedCount > 0 && (
          <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none rounded-full text-white bg-blue-500 ml-1">
            {selectedCount}
          </span>
        )}
        
        <span className="ml-auto">
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

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 rounded-xl shadow-lg bg-white border border-white border-opacity-70 z-10 transform origin-top-right transition-all duration-200 ease-out max-h-64 overflow-y-auto scrollbar-thin pb-6">
          <div className="p-4 space-y-2 max-h-full shadow-lg">
            <div className="flex justify-between items-center mb-3 pb-2 border-b border-gray-200">
              {/* <h3 className="font-medium text-gray-700">Outcome Types</h3> */}
              <div className="flex gap-5">
                <button
                  onClick={selectAll}
                  className="text-xs text-blue-600 hover:text-blue-800"
                >
                  Select All
                </button>
                <button
                  onClick={clearAll}
                  className="text-xs text-red-600 hover:text-red-800"
                >
                  Clear
                </button>
              </div>
            </div>
            
            {filterOptions.map((option) => (
              <div 
                key={option.value}
                className="flex items-center space-x-3 cursor-pointer hover:bg-white hover:bg-opacity-90 p-2 rounded-lg transition-colors duration-200"
                onClick={() => toggleFilter(option.value)}
              >
                <div className="relative flex items-center">
                  <input
                    type="checkbox"
                    checked={filterQuery.includes(option.value)}
                    onChange={() => {}}
                    className="w-4 h-4 text-blue-500 border-gray-300 rounded focus:ring-blue-500"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${option.color}`}></div>
                  <span className="text-gray-700 capitalize">{option.value}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};