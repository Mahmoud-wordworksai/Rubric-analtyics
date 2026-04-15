"use client";
import { MoreVertical } from "lucide-react";
import React, { useState, useRef, useEffect } from "react";
import { useAppSelector } from "@/redux/store";

const AuthContent = ({ isMobileOpen, isExpanded, isHovered }: { 
  isMobileOpen?: boolean, 
  isExpanded?: boolean, 
  isHovered?: boolean 
}) => {
  const { user } = useAppSelector((state) => state.auth);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // console.log("user", user?.username);

  // Determine if we should show compact view
  const isCompact = !isExpanded && !isHovered && !isMobileOpen;

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={containerRef}>
      {user ? (
        <div className={`flex items-center ${isCompact ? 'justify-center px-1' : 'gap-2 px-3'} py-2 rounded-full border border-gray-300 bg-white shadow-md ${isCompact ? 'min-w-0' : 'min-w-[220px]'} transition-all duration-300`}>
          <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-sm text-white">
            {user?.name?.charAt(0)}
          </div>
          
          {!isCompact && (
            <span className="text-sm font-semibold text-gray-700 whitespace-nowrap overflow-hidden text-ellipsis">
              {user.name}
            </span>
          )}

          {/* 3-dot icon + popup anchor */}
          {!isCompact && (
            <div className="relative ml-auto">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="p-1"
              >
                <MoreVertical className="w-4 h-4 text-gray-500" />
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 top-0 z-50 bg-white shadow-lg rounded-xl border border-gray-200 py-2 w-32">
                  <button
                    className="w-full text-left px-4 py-2 text-gray-600 text-sm cursor-default"
                  >
                    Access enabled
                  </button>
                </div>
              )}
            </div>
          )}
          
          {/* For compact view, show logout on avatar click */}
          {isCompact && (
            <>
              {dropdownOpen && (
                <div className="absolute top-full right-0 mt-2 z-50 bg-white shadow-lg rounded-xl border border-gray-200 py-2 w-32">
                  <button
                    className="w-full text-left px-4 py-2 text-gray-600 text-sm cursor-default"
                  >
                    Access enabled
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default AuthContent;
