"use client";

import { useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { getProjectFromUrl } from "@/lib/axios";

// IMPORTANT: Components using this hook MUST be wrapped in a Suspense boundary
// because useSearchParams() requires Suspense in Next.js 15+

/**
 * Appends project query parameter to the URL based on subdomain
 * Standalone function that can be used outside of React hooks
 * @param url - The base URL (can already contain query parameters)
 * @param selectedRoom - Optional room to append (defaults to "main" which means no room param)
 * @returns URL with project parameter appended
 */
export const appendRoomParam = (url: string, selectedRoom: string = "main"): string => {
  // Get project dynamically from URL or subdomain
  const selectedProject = getProjectFromUrl();

  const urlObj = new URL(url, window.location.origin);
  urlObj.searchParams.set("project", selectedProject);

  if (selectedRoom !== "main") {
    urlObj.searchParams.set("room", selectedRoom);
  }

  // Return the full URL or just the path with query params depending on input
  if (url.startsWith("http")) {
    return urlObj.toString();
  }
  return urlObj.pathname + urlObj.search;
};

/**
 * Builds a path with room query parameter preserved
 * @param path - The base path (e.g., "/projects", "/dashboard")
 * @param selectedRoom - The current room
 * @param additionalParams - Optional additional query parameters
 * @returns Path with room parameter if applicable
 */
export const buildPathWithRoom = (
  path: string,
  selectedRoom: string,
  additionalParams?: Record<string, string>
): string => {
  // Handle paths that already have query params
  const [basePath, existingQuery] = path.split('?');
  const params = new URLSearchParams(existingQuery || '');

  // Add room param if not main
  if (selectedRoom !== 'main') {
    params.set('room', selectedRoom);
  }

  // Add additional params
  if (additionalParams) {
    Object.entries(additionalParams).forEach(([key, value]) => {
      params.set(key, value);
    });
  }

  const queryString = params.toString();
  return queryString ? `${basePath}?${queryString}` : basePath;
};

/**
 * Hook to get the API URL with room query parameter appended
 * Also provides navigation helpers that preserve room params
 * @returns Room-aware API and navigation utilities
 */
export const useRoomAPI = () => {
  const searchParams = useSearchParams();
  const selectedRoom = searchParams.get('room') || 'main';

  /**
   * Wrapper that uses the current selectedRoom from Redux
   */
  const appendRoomParamWithRoom = useCallback((url: string): string => {
    return appendRoomParam(url, selectedRoom);
  }, [selectedRoom]);

  const appendRoomParamWithMain = useCallback((url: string): string => {
    return appendRoomParam(url);
  }, []);

  /**
   * Gets the room query parameter string
   * @returns Query parameter string (e.g., "?room=room-1" or "")
   */
  const getRoomQueryParam = useCallback((): string => {
    if (selectedRoom === "main") {
      return "";
    }
    return `?room=${selectedRoom}`;
  }, [selectedRoom]);

  /**
   * Gets the room query parameter to append (with & or ?)
   * @param existingParams - Whether the URL already has query parameters
   * @returns Query parameter string to append
   */
  const getRoomParam = useCallback((existingParams: boolean = false): string => {
    if (selectedRoom === "main") {
      return "";
    }
    return existingParams ? `&room=${selectedRoom}` : `?room=${selectedRoom}`;
  }, [selectedRoom]);

  /**
   * Builds a path with room query parameter preserved
   * Use this for href attributes
   * @param path - The base path (e.g., "/projects")
   * @param additionalParams - Optional additional query parameters
   * @returns Path with room parameter if applicable
   */
  const buildPath = useCallback((path: string, additionalParams?: Record<string, string>): string => {
    // Read room param directly from current URL
    const currentRoom = typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search).get('room') || 'main'
      : selectedRoom;
    return buildPathWithRoom(path, currentRoom, additionalParams);
  }, [selectedRoom]);

  /**
   * Navigate to a path while preserving room query parameter
   * Use this for programmatic navigation
   * @param path - The base path (e.g., "/projects")
   * @param additionalParams - Optional additional query parameters
   */
  const navigateTo = useCallback((path: string, additionalParams?: Record<string, string>) => {
    if (typeof window === 'undefined') return;

    // Read room param directly from current URL at navigation time
    const currentRoom = new URLSearchParams(window.location.search).get('room') || 'main';
    const fullPath = buildPathWithRoom(path, currentRoom, additionalParams);

    // Use window.location for reliable navigation
    window.location.href = fullPath;
  }, []);

  /**
   * Replace current route with a new path while preserving room query parameter
   * @param path - The base path
   * @param additionalParams - Optional additional query parameters
   */
  const replaceTo = useCallback((path: string, additionalParams?: Record<string, string>) => {
    if (typeof window === 'undefined') return;

    // Read room param directly from current URL at navigation time
    const currentRoom = new URLSearchParams(window.location.search).get('room') || 'main';
    const fullPath = buildPathWithRoom(path, currentRoom, additionalParams);

    // Use window.location.replace for reliable navigation without history entry
    window.location.replace(fullPath);
  }, []);

  return {
    selectedRoom,
    appendRoomParam: appendRoomParamWithRoom,
    appendRoomParamWithMain,
    getRoomQueryParam,
    getRoomParam,
    // Navigation helpers
    buildPath,
    navigateTo,
    replaceTo,
  };
};
