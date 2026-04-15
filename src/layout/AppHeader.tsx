"use client";

import { useBasicInfo } from "@/context/BasicInfoContext";
import { useSidebar } from "@/context/SidebarContext";
import Image from "next/image";
import Link from "next/link";
import React, { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { Settings, ChevronDown, Check } from "lucide-react";
import { useAppSelector } from "@/redux/store";
import { selectAvailableRooms } from "@/redux/features/room";
import { useRoomAPI } from "@/hooks/useRoomAPI";
import { API_KEY } from "@/constants";
import RoomSettingsModal from "@/components/RoomSettingsModal";
import axiosInstance from "@/lib/axios";

type VMStatus = 'running' | 'stopped' | 'starting' | 'stopping' | 'deallocated' | 'unknown' | 'loading';

const VM_MANAGE_BASE_URL = 'https://api-v2.admin-wwai.com';

const AppHeaderContent: React.FC = () => {
  // const [isApplicationMenuOpen, setApplicationMenuOpen] = useState(false);
  const [isRoomDropdownOpen, setIsRoomDropdownOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [vmStatus, setVmStatus] = useState<VMStatus>('loading');
  const [resourceGroup, setResourceGroup] = useState<string>('centralindia');

  const { isMobileOpen, toggleSidebar, toggleMobileSidebar } = useSidebar();
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { basicInfo } = useBasicInfo();
  const { user } = useAppSelector((state) => state.auth);
  const availableRooms = useAppSelector(selectAvailableRooms);
  const { selectedRoom } = useRoomAPI();

  const isWordWorksUser = user?.username?.includes('@wordworksai.com');

  // Generate VM name from subdomain + room name
  const getVMName = useCallback(() => {
    if (typeof window === 'undefined') return '';
    const subdomain = window.location.hostname.split('.')[0];
    return `${subdomain}-${selectedRoom}`;
  }, [selectedRoom]);

  // Fetch VM status
  const fetchVMStatus = useCallback(async () => {
    if (selectedRoom === 'main') {
      setVmStatus('unknown');
      return;
    }

    const vmName = getVMName();
    if (!vmName) return;

    setVmStatus('loading');
    try {
      const response = await axiosInstance.get(
        `${VM_MANAGE_BASE_URL}/vm-manage/vm/${vmName}/status?api_key=${API_KEY}&resource_group=${resourceGroup}`
      );

      const data = response.data;
      // Update resource group from response if available
      if (data.resource_group) {
        setResourceGroup(data.resource_group);
      }

      const statusText = data.status?.toLowerCase() || '';

      if (statusText.includes('running')) {
        setVmStatus('running');
      } else if (statusText.includes('deallocated') || statusText.includes('stopped')) {
        setVmStatus('stopped');
      } else if (statusText.includes('starting')) {
        setVmStatus('starting');
      } else if (statusText.includes('stopping')) {
        setVmStatus('stopping');
      } else {
        setVmStatus('unknown');
      }
    } catch (error) {
      console.error('Error fetching VM status:', error);
      setVmStatus('unknown');
    }
  }, [selectedRoom, getVMName, resourceGroup]);

  // Fetch VM status when room changes
  useEffect(() => {
    if (isWordWorksUser && selectedRoom !== 'main') {
      fetchVMStatus();
    }
  }, [isWordWorksUser, selectedRoom, fetchVMStatus]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsRoomDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleRoomChange = (room: string) => {
    setIsRoomDropdownOpen(false);
    if (room === 'main') {
      window.location.href = '/projects';
    } else {
      window.location.href = `/projects?room=${room}`;
    }
  };

  // Update VM status from modal
  const handleVMStatusChange = (newStatus: VMStatus) => {
    setVmStatus(newStatus);
  };

  const getStatusDot = () => {
    if (selectedRoom === 'main') return null;

    switch (vmStatus) {
      case 'running':
        return <span className="w-3 h-3 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />;
      case 'stopped':
      case 'deallocated':
        return <span className="w-3 h-3 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]" />;
      case 'starting':
      case 'stopping':
        return <span className="w-3 h-3 rounded-full bg-yellow-500 animate-pulse shadow-[0_0_8px_rgba(234,179,8,0.6)]" />;
      case 'loading':
        return <span className="w-3 h-3 rounded-full bg-gray-400 animate-pulse" />;
      default:
        return <span className="w-3 h-3 rounded-full bg-gray-400" />;
    }
  };

  const handleToggle = () => {
    if (window.innerWidth >= 991) {
      toggleSidebar();
    } else {
      toggleMobileSidebar();
    }
  };

  // const toggleApplicationMenu = () => {
  //   setApplicationMenuOpen((prev) => !prev);
  // };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "k") {
        event.preventDefault();
        inputRef.current?.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <header className="sticky top-0 w-full bg-white border-gray-200 dark:bg-gray-900 dark:border-gray-800 z-50">
      <div className="flex items-center justify-between px-3 py-3 lg:px-6 lg:py-4">
        {/* Left: Sidebar toggle and Room selector */}
        <div className="flex items-center gap-4">
          <button
            onClick={handleToggle}
            aria-label="Toggle Sidebar"
            className="flex items-center justify-center w-10 h-10 text-gray-500 rounded-lg border dark:border-gray-800 dark:text-gray-400 lg:w-11 lg:h-11 lg:border"
          >
            {isMobileOpen ? (
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M6.21967 7.28131C5.92678 6.98841 5.92678 6.51354 6.21967 6.22065C6.51256 5.92775 6.98744 5.92775 7.28033 6.22065L11.999 10.9393L16.7176 6.22078C17.0105 5.92789 17.4854 5.92788 17.7782 6.22078C18.0711 6.51367 18.0711 6.98855 17.7782 7.28144L13.0597 12L17.7782 16.7186C18.0711 17.0115 18.0711 17.4863 17.7782 17.7792C17.4854 18.0721 17.0105 18.0721 16.7176 17.7792L11.999 13.0607L7.28033 17.7794C6.98744 18.0722 6.51256 18.0722 6.21967 17.7794C5.92678 17.4865 5.92678 17.0116 6.21967 16.7187L10.9384 12L6.21967 7.28131Z"
                  fill="currentColor"
                />
              </svg>
            ) : (
              <svg
                width="16"
                height="12"
                viewBox="0 0 16 12"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M0.583252 1C0.583252 0.585788 0.919038 0.25 1.33325 0.25H14.6666C15.0808 0.25 15.4166 0.585786 15.4166 1C15.4166 1.41421 15.0808 1.75 14.6666 1.75L1.33325 1.75C0.919038 1.75 0.583252 1.41422 0.583252 1ZM0.583252 11C0.583252 10.5858 0.919038 10.25 1.33325 10.25L14.6666 10.25C15.0808 10.25 15.4166 10.5858 15.4166 11C15.4166 11.4142 15.0808 11.75 14.6666 11.75L1.33325 11.75C0.919038 11.75 0.583252 11.4142 0.583252 11ZM1.33325 5.25C0.919038 5.25 0.583252 5.58579 0.583252 6C0.583252 6.41421 0.919038 6.75 1.33325 6.75L7.99992 6.75C8.41413 6.75 8.74992 6.41421 8.74992 6C8.74992 5.58579 8.41413 5.25 7.99992 5.25L1.33325 5.25Z"
                  fill="currentColor"
                />
              </svg>
            )}
          </button>
        </div>

        {/* Right: Logo and mobile‑menu toggle */}
        <div className="flex items-center space-x-4 mr-10">

          {/* Room Selector - Only for WordWorks users */}
          {isWordWorksUser && (
            <div className="flex items-center gap-2" ref={dropdownRef}>
              <div className="relative">
                <button
                  onClick={() => setIsRoomDropdownOpen(!isRoomDropdownOpen)}
                  className="flex items-center gap-2 px-2.5 py-1.5 text-sm font-medium bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors w-[120px]"
                >
                  {/* Status dot - show placeholder for main to maintain width */}
                  {selectedRoom === 'main' ? (
                    <span className="w-3 h-3" />
                  ) : (
                    getStatusDot()
                  )}
                  <span className="text-gray-700 dark:text-gray-200 flex-1 text-left">
                    {selectedRoom === 'main' ? 'Main' : selectedRoom}
                  </span>
                  <ChevronDown
                    size={16}
                    className={`text-gray-500 transition-transform ${isRoomDropdownOpen ? 'rotate-180' : ''}`}
                  />
                </button>

                {/* Dropdown menu */}
                {isRoomDropdownOpen && (
                  <div className="absolute top-full left-0 mt-1 w-56 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 py-1 max-h-80 overflow-y-auto">
                    {availableRooms.map((room) => (
                      <button
                        key={room}
                        onClick={() => handleRoomChange(room)}
                        className={`w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                          selectedRoom === room ? 'bg-blue-50 dark:bg-blue-900/30' : ''
                        }`}
                      >
                        <span className="text-gray-700 dark:text-gray-200">
                          {room === 'main' ? 'Main' : room}
                        </span>
                        {selectedRoom === room && (
                          <Check size={16} className="text-blue-500" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Settings icon - show for non-main, placeholder for main to maintain layout */}
              {selectedRoom !== 'main' ? (
                <button
                  onClick={() => setIsSettingsModalOpen(true)}
                  className="flex items-center justify-center w-9 h-9 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  title="Room Settings"
                >
                  <Settings size={18} />
                </button>
              ) : (
                <div className="w-9 h-9" />
              )}
            </div>
          )}


            {basicInfo && basicInfo?.mainLogoUrl && (
            <Link href="/" className="flex items-end">
              <Image
              width={154}
              height={32}
              src={basicInfo.mainLogoUrl}
              alt="Logo"
              className="dark:hidden hidden lg:block"
              />
              <Image
              width={154}
              height={32}
              src={basicInfo.mainLogoUrl}
              alt="Logo"
              className="hidden dark:block lg:hidden"
              />
              {basicInfo.favicon && (
              <>
                <Image
                width={32}
                height={32}
                src={basicInfo.favicon}
                alt="Logo"
                className="dark:hidden lg:hidden"
                />
                <Image
                width={32}
                height={32}
                src={basicInfo.favicon}
                alt="Logo"
                className="hidden dark:block lg:hidden"
                />
              </>
              )}
            </Link>
            )}

          {/* <button
            onClick={toggleApplicationMenu}
            className="flex items-center justify-center w-10 h-10 text-gray-700 rounded-lg hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 lg:hidden"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M5.99902 10.4951C6.82745 10.4951 7.49902 11.1667 7.49902 11.9951V12.0051C7.49902 12.8335 6.82745 13.5051 5.99902 13.5051C5.1706 13.5051 4.49902 12.8335 4.49902 12.0051V11.9951C4.49902 11.1667 5.1706 10.4951 5.99902 10.4951ZM17.999 10.4951C18.8275 10.4951 19.499 11.1667 19.499 11.9951V12.0051C19.499 12.8335 18.8275 13.5051 17.999 13.5051C17.1706 13.5051 16.499 12.8335 16.499 12.0051V11.9951C16.499 11.1667 17.1706 10.4951 17.999 10.4951ZM13.499 11.9951C13.499 11.1667 12.8275 10.4951 11.999 10.4951C11.1706 10.4951 10.499 11.1667 10.499 11.9951V12.0051C10.499 12.8335 11.1706 13.5051 11.999 13.5051C12.8275 13.5051 13.499 12.8335 13.499 12.0051V11.9951C13.499 11.1667 12.8275 10.4951 11.999 10.4951Z"
                fill="currentColor"
              />
            </svg>
          </button> */}
        </div>
      </div>

      {/* Application menu row */}
      {/* <div
        className={`${
          isApplicationMenuOpen ? "flex" : "hidden"
        } items-center justify-end px-5 lg:flex lg:justify-end lg:px-0`}
      >
        place your application menu items here
      </div> */}

      {/* Room Settings Modal */}
      {isWordWorksUser && selectedRoom !== 'main' && (
        <RoomSettingsModal
          visible={isSettingsModalOpen}
          onClose={() => setIsSettingsModalOpen(false)}
          roomName={selectedRoom}
          vmName={getVMName()}
          resourceGroup={resourceGroup}
          onStatusChange={handleVMStatusChange}
        />
      )}
    </header>
  );
};

// Fallback header component that shows during Suspense loading
const AppHeaderFallback: React.FC = () => {
  const { isMobileOpen, toggleSidebar, toggleMobileSidebar } = useSidebar();
  const { basicInfo } = useBasicInfo();

  const handleToggle = () => {
    if (window.innerWidth >= 991) {
      toggleSidebar();
    } else {
      toggleMobileSidebar();
    }
  };

  return (
    <header className="sticky top-0 w-full bg-white border-gray-200 dark:bg-gray-900 dark:border-gray-800 z-50">
      <div className="flex items-center justify-between px-3 py-3 lg:px-6 lg:py-4">
        <div className="flex items-center gap-4">
          <button
            onClick={handleToggle}
            aria-label="Toggle Sidebar"
            className="flex items-center justify-center w-10 h-10 text-gray-500 rounded-lg border dark:border-gray-800 dark:text-gray-400 lg:w-11 lg:h-11 lg:border"
          >
            {isMobileOpen ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" clipRule="evenodd" d="M6.21967 7.28131C5.92678 6.98841 5.92678 6.51354 6.21967 6.22065C6.51256 5.92775 6.98744 5.92775 7.28033 6.22065L11.999 10.9393L16.7176 6.22078C17.0105 5.92789 17.4854 5.92788 17.7782 6.22078C18.0711 6.51367 18.0711 6.98855 17.7782 7.28144L13.0597 12L17.7782 16.7186C18.0711 17.0115 18.0711 17.4863 17.7782 17.7792C17.4854 18.0721 17.0105 18.0721 16.7176 17.7792L11.999 13.0607L7.28033 17.7794C6.98744 18.0722 6.51256 18.0722 6.21967 17.7794C5.92678 17.4865 5.92678 17.0116 6.21967 16.7187L10.9384 12L6.21967 7.28131Z" fill="currentColor" />
              </svg>
            ) : (
              <svg width="16" height="12" viewBox="0 0 16 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" clipRule="evenodd" d="M0.583252 1C0.583252 0.585788 0.919038 0.25 1.33325 0.25H14.6666C15.0808 0.25 15.4166 0.585786 15.4166 1C15.4166 1.41421 15.0808 1.75 14.6666 1.75L1.33325 1.75C0.919038 1.75 0.583252 1.41422 0.583252 1ZM0.583252 11C0.583252 10.5858 0.919038 10.25 1.33325 10.25L14.6666 10.25C15.0808 10.25 15.4166 10.5858 15.4166 11C15.4166 11.4142 15.0808 11.75 14.6666 11.75L1.33325 11.75C0.919038 11.75 0.583252 11.4142 0.583252 11ZM1.33325 5.25C0.919038 5.25 0.583252 5.58579 0.583252 6C0.583252 6.41421 0.919038 6.75 1.33325 6.75L7.99992 6.75C8.41413 6.75 8.74992 6.41421 8.74992 6C8.74992 5.58579 8.41413 5.25 7.99992 5.25L1.33325 5.25Z" fill="currentColor" />
              </svg>
            )}
          </button>
          <div className="animate-pulse h-9 w-32 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
        </div>
        <div className="flex items-center space-x-4 mr-10">
          {basicInfo && basicInfo?.mainLogoUrl && (
            <Link href="/" className="flex items-end">
              <Image
                width={154}
                height={32}
                src={basicInfo.mainLogoUrl}
                alt="Logo"
                className="dark:hidden"
              />
              <Image
                width={154}
                height={32}
                src={basicInfo.mainLogoUrl}
                alt="Logo"
                className="hidden dark:block"
              />
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

// Wrapper component with Suspense boundary for useSearchParams
const AppHeader: React.FC = () => {
  return (
    <Suspense fallback={<AppHeaderFallback />}>
      <AppHeaderContent />
    </Suspense>
  );
};

export default AppHeader;
