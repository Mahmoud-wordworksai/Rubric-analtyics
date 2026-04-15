/* eslint-disable react-hooks/exhaustive-deps */
"use client";
import React, { useEffect, useRef, useState, useCallback, useMemo, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSidebar } from "../context/SidebarContext";
import { useBasicInfo } from "../context/BasicInfoContext";
import { Users, BarChart, Settings, ChevronDownIcon, Files, LayoutDashboard, Coins, MessageCircleCodeIcon, Phone, FileSpreadsheet } from "lucide-react";
// import { BsChatLeft } from "react-icons/bs";
import AuthContent from "@/components/auth/auth";
import { useAppDispatch, useAppSelector } from "@/redux/store";
import { setAvailableRooms } from "@/redux/features/room";
import { API_BASE_URL, API_REQUEST_HEADERS } from "@/constants";
import { useRoomAPI } from "../hooks/useRoomAPI";


const category = [
  {
      "id": "LRx3AvWNisjerioniewnr",
      "name": "Dashboard",
      "slug": "dashboard"
  },
  {
      "id": "LRx3AvWNNwNP3SgvU9cd",
      "name": "Projects",
      "slug": "projects"
  },
  // {
  //     "id": "ONGIlFC1pPOVh0L11TIA",
  //     "slug": "analyze",
  //     "name": "Analyze"
  // },
  {
      "id": "xYIfIK1zMCzVzIuVp8O7",
      "slug": "room-and-agents",
      "name": "Room and agents"
  },
  {
      "id": "xYIfIK1zMCzVzIuVp8O7",
      "slug": "datasheets",
      "name": "Datasheets"
  },
  {
      "id": "xYIfIK1zMCzVzIsdddO7",
      "slug": "settings",
      "name": "Settings"
  },
  {
      "id": "xYIfIK1zMCzVzIsdddO7",
      "slug": "datasheets-template",
      "name": "Datasheets Template"
  },
//  {
//     id: "appTemplates89u89ioif",
//     slug: "app-templates",
//     name: "App Templates"
//   },
  {
      "id": "x9iijMCi89jioif",
      "slug": "sms-billing",
      "name": "SMS Billing"
  },
  {
      "id": "x9iijMCi89callsbilling",
      "slug": "calls-billing",
      "name": "Calls Billing"
  },
   {
      "id": "x9iijoijsduf89u89ioif",
      "slug": "pricing-manager",
      "name": "Pricing Manager"
  },
  {
      "id": "pldijiijsduf89u89ioif",
      "slug": "prompts-and-post-call-analysis",
      "name": "Prompts And Analysis"
  },
  {
      "id": "testcall89u89ioif",
      "slug": "test-call",
      "name": "Test Call"
  },
  {
      "id": "callreport89u89ioif",
      "slug": "rubric-analytics",
      "name": "Rubric Analytics"
  },
  {
      "id": "consolidation89u89ioif",
      "slug": "datasheet-consolidation",
      "name": "Consolidation"
  },
  {
      "id": "misdashboard89u89ioif",
      "slug": "mis-dashboard",
      "name": "MIS Dashboard"
  },
];

const category1 = [
  {
      "id": "callreport89u89ioif",
      "name": "Rubric Analytics",
      "slug": "rubric-analytics"
  },
];

const bot: { 
  id: string; 
  name: string; 
  slug: string; 
  flow: string; 
  js: string; 
  theme: string; 
  style: string; 
  categoryId: string; 
  reports: string; 
  html: string; 
}[] = [
];

type NavItem = {
  name: string;
  icon: React.ReactNode;
  path?: string;
  subItems?: { name: string; path: string; pro?: boolean; new?: boolean }[];
};

// const SLUG_ORDER = ["projects", "analyze", "settings"];

const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered, toggleMobileSidebar } = useSidebar();
  const { basicInfo } = useBasicInfo();
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { appendRoomParamWithMain, selectedRoom } = useRoomAPI();

  // Helper to build URL with room param
  const buildUrlWithRoom = useCallback((path: string) => {
    const room = typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search).get('room')
      : null;
    return room ? `${path}?room=${room}` : path;
  }, []);

  // Fetch available rooms on mount
  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const url = appendRoomParamWithMain(`${API_BASE_URL}/list-agent-rooms?api_key=dsfiuhdiufnf78y78hnuhf87eryiwe`);
        const response = await fetch(url, { headers: API_REQUEST_HEADERS });
        const result = await response.json();
        if (result.status === 'success' && Array.isArray(result.data)) {
          // Extract room names from the data array
          const roomNames = result.data.map((room: { room_name: string }) => room.room_name);

          // Sort room names in ascending order (natural sort for numbers)
          const sortedRoomNames = roomNames.sort((a: string, b: string) => {
            // Use localeCompare with numeric option for natural sorting
            return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
          });

          // Always include "main" as the first option
          const rooms = ['main', ...sortedRoomNames];
          dispatch(setAvailableRooms(rooms));
          console.log('Available rooms loaded:', rooms);
        }
      } catch (error) {
        console.error('Failed to fetch rooms:', error);
        // Keep default rooms if fetch fails
      }
    };

    fetchRooms();
  }, [dispatch]);

  const getCategoryIcon = (slug: string) => {
    const iconProps = { size: 16 }; // Set the size of the icons
    switch (slug) {
      case "dashboard":
        return <LayoutDashboard {...iconProps} />
      case "projects":
        return <Files {...iconProps} />
      case "rubric-analytics":
        return <BarChart {...iconProps} />;
      case "analyze":
        return <BarChart {...iconProps} />;
      case "room-and-agents":
        return <Users {...iconProps} />;
      case "settings":
        return <Settings {...iconProps} />;
      case "datasheets":
        return <Files {...iconProps} />;
      case "sms-billing":
      case "call-cost":
      case "calls-billing":
      case "call-report":
        return <BarChart {...iconProps} />;
      case "pricing-manager":
        return <Coins {...iconProps} />;
      case "prompts-and-post-call-analysis":
        return <MessageCircleCodeIcon {...iconProps} />;
      case "test-call":
        return <Phone {...iconProps} />;
      case "datasheet-consolidation":
        return <FileSpreadsheet {...iconProps} />;
      case "mis-dashboard":
        return <BarChart {...iconProps} />;
      default:
        return <Users {...iconProps} />;
    }
  };

  // Filter categories based on user email domain
  const isWordWorksUser = user?.username?.includes('@wordworksai.com');

  // Build dynamic nav items using categories and bots
  const dynamicNavItems: NavItem[] = useMemo(() => {
    if (!category) return [];

    // First, create a copy of the categories and sort them based on the slug order
    let orderedCategories = isWordWorksUser ? [...category] : [...category1];
   
    if (!isWordWorksUser) {
      // Hide these sections for non-wordworksai.com users
      const restrictedSlugs = ['sms-billing', 'call-cost', 'calls-billing', 'settings', 'room-and-agents', 'datasheets', 'pricing-manager', 'prompts-and-post-call-analysis', 'datasheets-template', 'settings'];
      orderedCategories = orderedCategories.filter((cat) => !restrictedSlugs.includes(cat.slug));
    }

    // Sections that should only appear in rooms (not in main)
    const roomOnlySlugs = ['settings', 'datasheets-template', 'prompts-and-post-call-analysis', 'test-call'];

    // Sections that should always be visible (in main and all rooms)
    const alwaysVisibleSlugs = ['rubric-analytics'];

    // Sections that should be hidden in main and room, but shown in all other rooms
    const hideInMainAndRoomSlugs = ['app-templates'];

    // Filter categories based on selected room
    if (!selectedRoom || selectedRoom === 'main') {
      // Hide room-only sections from main (or when room is not yet loaded)
      orderedCategories = orderedCategories.filter((cat) => !roomOnlySlugs.includes(cat.slug));
      // Also hide sections that should not appear in main
      orderedCategories = orderedCategories.filter((cat) => !hideInMainAndRoomSlugs.includes(cat.slug));
    } else if (selectedRoom === 'room') {
      // Hide room-only sections and hideInMainAndRoomSlugs from 'room'
      orderedCategories = orderedCategories.filter((cat) => !roomOnlySlugs.includes(cat.slug));
      orderedCategories = orderedCategories.filter((cat) => !hideInMainAndRoomSlugs.includes(cat.slug));
    } else {
      // Only show these sections for non-main/non-room rooms
      const allowedSlugs = !isWordWorksUser
        ? [...alwaysVisibleSlugs]
        : [...alwaysVisibleSlugs, 'room-and-agents', 'datasheets', 'call-report', ...roomOnlySlugs, ...hideInMainAndRoomSlugs];
      orderedCategories = orderedCategories.filter((cat) => allowedSlugs.includes(cat.slug));
    }

    // Then map the ordered categories to nav items
    return orderedCategories.map((cat) => {
      const botsInCategory = bot.filter((b) => b.categoryId === cat.id);

      return {
        name: cat.name,
        icon: getCategoryIcon(cat.slug),
        // If there are bots, add them as subItems; otherwise, make the category itself a link
        ...(botsInCategory.length > 0
          ? {
              subItems: botsInCategory.map((b) => ({
                name: b.name,
                path: `/${cat.slug}/${b.slug}`,
                pro: false,
                new: false
              }))
            }
          : { path: `/${cat.slug === "home" ? "" : cat.slug}` })
      };
    });
  }, [selectedRoom, isWordWorksUser]); // Use isWordWorksUser instead of user object

  // For submenu state
  const [openSubmenu, setOpenSubmenu] = useState<{
    type: "main" | "others";
    index: number;
  } | null>(null);
  const [subMenuHeight, setSubMenuHeight] = useState<Record<string, number>>({});
  const subMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Determine if the link is active
  const isActive = useCallback(
    (path: string) => path === pathname,
    [pathname]
  );

  // Only update submenu state when pathname changes to a submenu item
  useEffect(() => {
    // find the first category that has a subItem matching the current path
    const matchIndex = dynamicNavItems.findIndex(nav =>
      nav.subItems?.some(sub => sub.path === pathname)
    );

    if (matchIndex !== -1) {
      setOpenSubmenu({ type: "main", index: matchIndex });
    }
    // Don't close submenu for non-submenu items - let them navigate directly
  }, [pathname]);

  // Set the submenu height dynamically when open
  useEffect(() => {
    if (openSubmenu !== null) {
      const key = `${openSubmenu.type}-${openSubmenu.index}`;
      if (subMenuRefs.current[key]) {
        setSubMenuHeight((prevHeights) => ({
          ...prevHeights,
          [key]: subMenuRefs.current[key]?.scrollHeight || 0,
        }));
      }
    }
  }, [openSubmenu]);

  const handleSubmenuToggle = (index: number, menuType: "main" | "others") => {
    setOpenSubmenu((prevOpenSubmenu) => {
      if (
        prevOpenSubmenu &&
        prevOpenSubmenu.type === menuType &&
        prevOpenSubmenu.index === index
      ) {
        return null;
      }
      return { type: menuType, index };
    });
  };

  // Handle navigation with proper state management to prevent hover interference
  const handleNavigation = useCallback((basePath: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Close mobile sidebar if open
    if (isMobileOpen) {
      toggleMobileSidebar();
    }

    // Get room from current URL and navigate with full page refresh
    const room = new URLSearchParams(window.location.search).get('room');
    const url = room ? `${basePath}?room=${room}` : basePath;
    window.location.href = url;
  }, [isMobileOpen, toggleMobileSidebar]);

  // Render menu items (both main items and subitems)
  const renderMenuItems = (navItems: NavItem[], menuType: "main" | "others") => (
    <ul className="flex flex-col gap-6">
      {navItems.map((nav, index) => (
        <li key={nav.name}>
          {nav.subItems ? (
            <>
              <button
                onClick={() => handleSubmenuToggle(index, menuType)}
                className={`menu-item group ${
                  openSubmenu?.type === menuType && openSubmenu?.index === index
                    ? "menu-item-active"
                    : "menu-item-inactive"
                } cursor-pointer ${
                  !isExpanded && !isHovered ? "lg:justify-center" : "lg:justify-start"
                }`}
              >
                <span
                  className={`${
                    openSubmenu?.type === menuType && openSubmenu?.index === index
                      ? "menu-item-icon-active"
                      : "menu-item-icon-inactive"
                  }`}
                >
                  {nav.icon}
                </span>
                {(isExpanded || isHovered || isMobileOpen) && (
                  <span className="menu-item-text">{nav.name}</span>
                )}
                {(isExpanded || isHovered || isMobileOpen) && (
                  <ChevronDownIcon
                    className={`ml-auto w-5 h-5 transition-transform duration-200 ${
                      openSubmenu?.type === menuType &&
                      openSubmenu?.index === index
                        ? "rotate-180 text-brand-500"
                        : ""
                    }`}
                  />
                )}
              </button>
              {(isExpanded || isHovered || isMobileOpen) && (
                <div
                  ref={(el) => {
                    subMenuRefs.current[`${menuType}-${index}`] = el;
                  }}
                  className="overflow-hidden transition-all duration-300"
                  style={{
                    height:
                      openSubmenu?.type === menuType && openSubmenu?.index === index
                        ? `${subMenuHeight[`${menuType}-${index}`]}px`
                        : "0px",
                  }}
                >
                  <ul className="mt-2 space-y-1 ml-9">
                    {nav.subItems.map((subItem) => (
                      <li key={subItem.name}>
                        <Link
                          href={buildUrlWithRoom(subItem.path)}
                          className={`menu-dropdown-item ${
                            isActive(subItem.path)
                              ? "menu-dropdown-item-active"
                              : "menu-dropdown-item-inactive"
                          }`}
                          onClick={(e) => handleNavigation(subItem.path, e)}
                        >
                          {subItem.name}
                          <span className="flex items-center gap-1 ml-auto">
                            {subItem.new && (
                              <span
                                className={`ml-auto ${
                                  isActive(subItem.path)
                                    ? "menu-dropdown-badge-active"
                                    : "menu-dropdown-badge-inactive"
                                } menu-dropdown-badge`}
                              >
                                new
                              </span>
                            )}
                            {subItem.pro && (
                              <span
                                className={`ml-auto ${
                                  isActive(subItem.path)
                                    ? "menu-dropdown-badge-active"
                                    : "menu-dropdown-badge-inactive"
                                } menu-dropdown-badge`}
                              >
                                pro
                              </span>
                            )}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          ) : (
            nav.path && (
              <Link
                href={buildUrlWithRoom(nav.path)}
                className={`menu-item group ${
                  isActive(nav.path) ? "menu-item-active" : "menu-item-inactive"
                }`}
                onClick={(e) => nav.path && handleNavigation(nav.path, e)}
              >
                <span
                  className={`${
                    isActive(nav.path)
                      ? "menu-item-icon-active"
                      : "menu-item-icon-inactive"
                  }`}
                >
                  {nav.icon}
                </span>
                {(isExpanded || isHovered || isMobileOpen) && (
                  <span className="menu-item-text">{nav.name}</span>
                )}
              </Link>
            )
          )}
        </li>
      ))}
    </ul>
  );

  return (
    <aside className={`fixed mt-16 flex flex-col lg:mt-0 top-0 px-5 left-0 bg-white dark:bg-gray-900 dark:border-gray-800 text-gray-900 h-screen transition-all duration-300 ease-in-out z-50 border-r border-gray-200 ${isExpanded || isMobileOpen ? "w-[290px]" : isHovered ? "w-[290px]" : "w-[90px]"} ${isMobileOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`} onMouseEnter={() => !isExpanded && setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>
    <div className="flex flex-col overflow-y-auto duration-300 ease-linear no-scrollbar h-full">
    <nav className="mb-6">
    <div className="flex flex-col gap-4 pt-5">
      <div>
        {basicInfo.isLogo ? (
          <div className={`mb-4 flex ${!isExpanded && !isHovered ? "lg:justify-center" : "justify-start"}`}>
            {(!isExpanded && !isHovered) ? (
              <Image
                src={basicInfo?.favicon}
                alt="Voice AI"
                width={40}
                height={40}
                className={`transition-all duration-300 ${(!isExpanded && !isHovered) ? "h-8 w-8" : "h-10 w-auto"}`}
              />
            ) : (
              <Image
                src={basicInfo.logoUrl}
                alt="Voice AI"
                width={40}
                height={40}
                className={`transition-all duration-300 ${(!isExpanded && !isHovered) ? "h-8 w-8" : "h-10 w-auto"}`}
              />
            )}
          </div>
        ) : (
          <h2 className={`mb-4 text-base uppercase font-bold flex leading-[20px] text-white ${!isExpanded && !isHovered ? "lg:justify-center" : "justify-start"}`}>
            {(!isExpanded && !isHovered) ? (
              <span>{basicInfo?.sidebarTitle?.charAt(0)}</span>
            ) : (
              <span>{basicInfo?.sidebarTitle}</span>
            )}
          </h2>
        )}

      

      {renderMenuItems(dynamicNavItems, "main")}
      </div>
    </div>
    </nav>
    <div className={`${isMobileOpen ? "" : "mt-auto"} p-4`}>
      {/* Make AuthContent responsive based on sidebar state */}
      <div className={`transition-all duration-300 ${!isExpanded && !isHovered ? "scale-90 flex justify-center" : ""}`}>
        <AuthContent isMobileOpen={isMobileOpen} isExpanded={isExpanded} isHovered={isHovered} />
      </div>
    </div>
</div>

  </aside>
  );
};

// Wrapper component with Suspense boundary for useSearchParams
const AppSidebarWrapper: React.FC = () => {
  return (
    <Suspense fallback={
      <aside className="fixed mt-16 flex flex-col lg:mt-0 top-0 px-5 left-0 bg-white dark:bg-gray-900 dark:border-gray-800 text-gray-900 h-screen transition-all duration-300 ease-in-out z-50 border-r border-gray-200 w-[90px] lg:translate-x-0">
        <div className="flex flex-col overflow-y-auto duration-300 ease-linear no-scrollbar h-full">
          <div className="animate-pulse p-4">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
            <div className="space-y-3">
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          </div>
        </div>
      </aside>
    }>
      <AppSidebar />
    </Suspense>
  );
};

export default AppSidebarWrapper;
