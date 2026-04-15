/* eslint-disable @typescript-eslint/ban-ts-comment */
// Mobile Responsive Utilities
import { useState, useEffect } from 'react';

// Breakpoints following Tailwind CSS standards
export const breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

// Hook to detect screen size
export const useScreenSize = () => {
  const [screenSize, setScreenSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1024,
    height: typeof window !== 'undefined' ? window.innerHeight : 768,
  });

  useEffect(() => {
    const handleResize = () => {
      setScreenSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return screenSize;
};

// Hook to detect if screen is mobile
export const useIsMobile = () => {
  const { width } = useScreenSize();
  return width < breakpoints.md;
};

// Hook to detect if screen is tablet
export const useIsTablet = () => {
  const { width } = useScreenSize();
  return width >= breakpoints.md && width < breakpoints.lg;
};

// Hook to detect if screen is desktop
export const useIsDesktop = () => {
  const { width } = useScreenSize();
  return width >= breakpoints.lg;
};

// Responsive grid configurations
export const getResponsiveGrid = (screenWidth: number) => {
  if (screenWidth < breakpoints.sm) {
    return {
      cols: 1,
      gap: 12,
      padding: 12,
    };
  } else if (screenWidth < breakpoints.md) {
    return {
      cols: 2,
      gap: 16,
      padding: 16,
    };
  } else if (screenWidth < breakpoints.lg) {
    return {
      cols: 3,
      gap: 20,
      padding: 20,
    };
  } else {
    return {
      cols: 4,
      gap: 24,
      padding: 24,
    };
  }
};

// Responsive font sizes
export const getResponsiveFontSize = (screenWidth: number, baseSize: number) => {
  if (screenWidth < breakpoints.sm) {
    return Math.max(baseSize * 0.8, 12);
  } else if (screenWidth < breakpoints.md) {
    return Math.max(baseSize * 0.9, 14);
  } else {
    return baseSize;
  }
};

// Responsive spacing
export const getResponsiveSpacing = (screenWidth: number) => {
  if (screenWidth < breakpoints.sm) {
    return {
      xs: 4,
      sm: 8,
      md: 12,
      lg: 16,
      xl: 20,
    };
  } else if (screenWidth < breakpoints.md) {
    return {
      xs: 6,
      sm: 12,
      md: 16,
      lg: 20,
      xl: 24,
    };
  } else {
    return {
      xs: 8,
      sm: 16,
      md: 20,
      lg: 24,
      xl: 32,
    };
  }
};

// Touch device detection
export const useIsTouchDevice = () => {
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    const checkTouchDevice = () => {
      setIsTouchDevice(
        'ontouchstart' in window ||
        navigator.maxTouchPoints > 0 ||
        // @ts-ignore
        navigator.msMaxTouchPoints > 0
      );
    };

    checkTouchDevice();
  }, []);

  return isTouchDevice;
};

// Responsive component props helper
export const getResponsiveProps = (screenWidth: number) => {
  const isMobile = screenWidth < breakpoints.md;
  const isTablet = screenWidth >= breakpoints.md && screenWidth < breakpoints.lg;
  
  return {
    size: isMobile ? 'small' : 'default',
    gutter: isMobile ? [8, 8] : isTablet ? [16, 16] : [24, 24],
    span: {
      xs: 24,
      sm: isMobile ? 24 : 12,
      md: isTablet ? 12 : 8,
      lg: 6,
      xl: 6,
    },
  };
};

// CSS class generator for responsive design
export const getResponsiveClasses = (screenWidth: number) => {
  const isMobile = screenWidth < breakpoints.md;
  const isTablet = screenWidth >= breakpoints.md && screenWidth < breakpoints.lg;
  
  return {
    container: isMobile 
      ? 'p-3 space-y-4' 
      : isTablet 
        ? 'p-4 space-y-6' 
        : 'p-6 space-y-8',
    
    card: isMobile 
      ? 'p-3 rounded-lg' 
      : 'p-4 sm:p-6 rounded-xl',
    
    title: isMobile 
      ? 'text-lg font-bold' 
      : isTablet 
        ? 'text-xl font-bold' 
        : 'text-2xl font-bold',
    
    subtitle: isMobile 
      ? 'text-sm text-gray-600' 
      : 'text-base text-gray-600',
    
    button: isMobile 
      ? 'px-3 py-2 text-sm' 
      : 'px-4 py-2 text-base',
    
    grid: isMobile 
      ? 'grid-cols-1 gap-3' 
      : isTablet 
        ? 'grid-cols-2 gap-4' 
        : 'grid-cols-3 gap-6',
  };
};

// Debounced resize hook for performance
export const useDebouncedResize = (delay: number = 150) => {
  const [debouncedSize, setDebouncedSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1024,
    height: typeof window !== 'undefined' ? window.innerHeight : 768,
  });

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setDebouncedSize({
          width: window.innerWidth,
          height: window.innerHeight,
        });
      }, delay);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timeoutId);
    };
  }, [delay]);

  return debouncedSize;
};

// Helper to get optimal table scroll width
export const getTableScrollWidth = (screenWidth: number, columnsCount: number) => {
  const minColumnWidth = 120;
  const totalMinWidth = columnsCount * minColumnWidth;
  
  if (screenWidth < totalMinWidth) {
    return { x: totalMinWidth };
  }
  
  return {};
};

// Chart responsive configuration
export const getChartResponsiveConfig = (screenWidth: number) => {
  if (screenWidth < breakpoints.sm) {
    return {
      height: 200,
      legend: {
        position: 'bottom',
        itemWidth: 80,
      },
      padding: [20, 20, 40, 20],
    };
  } else if (screenWidth < breakpoints.md) {
    return {
      height: 250,
      legend: {
        position: 'right',
        itemWidth: 100,
      },
      padding: [20, 30, 40, 30],
    };
  } else {
    return {
      height: 300,
      legend: {
        position: 'bottom',
        itemWidth: 120,
      },
      padding: [20, 40, 40, 40],
    };
  }
};