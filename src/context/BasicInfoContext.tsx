"use client";

import React, { createContext, useState, useContext, useEffect, useCallback } from "react";
import axiosInstance from "@/lib/axios";
import { API_BASE_URL } from "../constants";
import { useRoomAPI } from "../hooks/useRoomAPI";

type BasicInfo = {
  title: string;
  description: string;
  sidebarTitle: string;
  isLogo: boolean;
  logoUrl: string;
  favicon: string;
  mainLogoUrl: string;
};

type BasicInfoContextType = {
  basicInfo: BasicInfo;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
};

const defaultBasicInfo: BasicInfo = {
  title: "Voice AI Solutions Dashboard",
  description: "Voice AI Solutions Dashboard",
  sidebarTitle: "",
  isLogo: false,
  logoUrl: "",
  favicon: "",
  mainLogoUrl: "",
};

const BasicInfoContext = createContext<BasicInfoContextType | undefined>(undefined);

export const BasicInfoProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [basicInfo, setBasicInfo] = useState<BasicInfo>(defaultBasicInfo);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { appendRoomParamWithMain } = useRoomAPI();

  const updateFavicon = useCallback((faviconUrl: string) => {
    if (!faviconUrl) return;

    // Remove existing favicon links
    const existingLinks = document.querySelectorAll("link[rel*='icon']");
    existingLinks.forEach((link) => link.remove());

    // Create new favicon link
    const link = document.createElement("link");
    link.rel = "icon";
    link.type = "image/x-icon";
    link.href = faviconUrl;
    document.head.appendChild(link);

    // Also add apple-touch-icon for better mobile support
    const appleLink = document.createElement("link");
    appleLink.rel = "apple-touch-icon";
    appleLink.href = faviconUrl;
    document.head.appendChild(appleLink);
  }, []);

  const updateTitle = useCallback((title: string) => {
    if (title) {
      document.title = title;
    }
  }, []);

  const updateMetaDescription = useCallback((description: string) => {
    if (!description) return;

    let metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute("content", description);
    } else {
      metaDescription = document.createElement("meta");
      metaDescription.setAttribute("name", "description");
      metaDescription.setAttribute("content", description);
      document.head.appendChild(metaDescription);
    }
  }, []);

  const fetchBasicInfo = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const url = appendRoomParamWithMain(`${API_BASE_URL}/templates/basic`);
      const response = await axiosInstance.get(url);

      if (response.data.status === "success" && response.data.template) {
        const basicTemplate = response.data.template;

        const newBasicInfo: BasicInfo = {
          title: basicTemplate?.title || defaultBasicInfo.title,
          description: basicTemplate?.description || defaultBasicInfo.description,
          sidebarTitle: basicTemplate?.sidebarTitle || defaultBasicInfo.sidebarTitle,
          isLogo: basicTemplate?.isLogo || false,
          logoUrl: basicTemplate?.logoUrl || "",
          favicon: basicTemplate?.favicon || basicTemplate?.logoUrl || "",
          mainLogoUrl: basicTemplate?.mainLogoUrl || "",
        };

        setBasicInfo(newBasicInfo);

        // Update document head dynamically
        updateTitle(newBasicInfo.title);
        updateMetaDescription(newBasicInfo.description);
        updateFavicon(newBasicInfo.favicon);

        console.log("Basic info loaded:", newBasicInfo.title);
      }
    } catch (err) {
      console.error("Failed to fetch basic info:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
      // Keep default values if fetch fails
    } finally {
      setIsLoading(false);
    }
  }, [updateTitle, updateMetaDescription, updateFavicon, appendRoomParamWithMain]);

  useEffect(() => {
    fetchBasicInfo();
  }, [fetchBasicInfo]);

  return (
    <BasicInfoContext.Provider
      value={{
        basicInfo,
        isLoading,
        error,
        refetch: fetchBasicInfo,
      }}
    >
      {children}
    </BasicInfoContext.Provider>
  );
};

export const useBasicInfo = () => {
  const context = useContext(BasicInfoContext);
  if (context === undefined) {
    throw new Error("useBasicInfo must be used within a BasicInfoProvider");
  }
  return context;
};
