/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState, useRef } from "react";
import { NormalLoader } from "@/layout/MainLoader";
import axiosInstance from '@/lib/axios';

const AudioPlayer: React.FC<any> = ({ audioUrl }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isNotFound, setIsNotFound] = useState(false);
  const [audioBlobUrl, setAudioBlobUrl] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const currentAudioUrlRef = useRef<string | null>(null);

  const downloadAudio = async (url: string) => {
    try {
      setIsLoading(true);
      setIsNotFound(false); // Reset error state

      // Store the current URL being processed
      currentAudioUrlRef.current = url;

      // Cleanup previous blob URL if it exists
      if (audioBlobUrl) {
        URL.revokeObjectURL(audioBlobUrl);
        setAudioBlobUrl(null);
      }

      // Fetch the audio file
      const response = await axiosInstance.get(url, {
        responseType: 'blob'
      });

      // Check if this request is still current (prevent race conditions)
      if (currentAudioUrlRef.current !== url) {
        return; // Exit if audioUrl has changed while fetching
      }

      // Get the blob from response
      const blob = response.data;

      // Final check before setting the blob URL
      if (currentAudioUrlRef.current === url) {
        // Create a URL for the Blob
        const newBlobUrl = URL.createObjectURL(blob);
        setAudioBlobUrl(newBlobUrl);
      }

    } catch (error) {
      console.error("Error downloading audio:", error);
      // Only set error if this request is still current
      if (currentAudioUrlRef.current === url) {
        setIsNotFound(true);
      }
    } finally {
      // Only update loading state if this request is still current
      if (currentAudioUrlRef.current === url) {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    // Reset all states when audioUrl changes
    setIsNotFound(false);
    setIsLoading(false);
    
    // Stop and reset any currently playing audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current.load(); // Force reload of audio element
    }

    // Cleanup previous blob URL
    if (audioBlobUrl) {
      URL.revokeObjectURL(audioBlobUrl);
      setAudioBlobUrl(null);
    }

    if (audioUrl) {
      downloadAudio(audioUrl);
    } else {
      // Clear current URL ref when audioUrl is null/undefined
      currentAudioUrlRef.current = null;
    }

    // Cleanup function
    return () => {
      if (audioBlobUrl) {
        URL.revokeObjectURL(audioBlobUrl);
      }
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, [audioUrl]);

  // Additional cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioBlobUrl) {
        URL.revokeObjectURL(audioBlobUrl);
      }
    };
  }, [audioBlobUrl]);

  return (
    <div className="pb-2">
      {/* Container with fixed height to prevent layout shifts */}
      <div className="min-h-[80px] flex items-center justify-center bg-white rounded-lg shadow-sm border border-gray-200 p-2">
        {isLoading && (
          <div className="flex justify-center items-center">
            <NormalLoader />
          </div>
        )}

        {!isLoading && audioBlobUrl && (
          <audio 
            ref={audioRef}
            controls 
            controlsList="download"
            key={audioBlobUrl} // Force re-render when blob URL changes
            className="w-full rounded-md focus:outline-none [&::-webkit-media-controls-panel]:bg-gray-50 [&::-webkit-media-controls-panel]:rounded-md [&::-webkit-media-controls-play-button]:hover:bg-blue-100 [&::-webkit-media-controls-play-button]:rounded-full [&::-webkit-media-controls-current-time-display]:text-gray-700 [&::-webkit-media-controls-time-remaining-display]:text-gray-700"
            onPlay={() => {
              // Stop all other audio elements when this one starts playing
              document.querySelectorAll('audio').forEach(audio => {
                if (audio !== audioRef.current) {
                  audio.pause();
                  audio.currentTime = 0;
                }
              });
            }}
          >
            <source src={audioBlobUrl} type="audio/mpeg" />
            Your browser does not support the audio element.
          </audio>
        )}

        {!isLoading && (audioUrl === null || audioUrl === undefined || isNotFound) && (
          <div className="text-center py-4">
            <p className="text-gray-500">No recording found for the provided Call.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AudioPlayer;