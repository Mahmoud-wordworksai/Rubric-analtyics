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

  const downloadAudio = async (url: string) => {
    try {
      setIsLoading(true);

      // Cleanup previous blob URL if it exists
      if (audioBlobUrl) {
        URL.revokeObjectURL(audioBlobUrl);
      }

      // Fetch the audio file
      const response = await axiosInstance.get(url, {
        responseType: 'blob'
      });

      // Get the blob from response
      const blob = response.data;

      // Create a URL for the Blob
      const newBlobUrl = URL.createObjectURL(blob);
      setAudioBlobUrl(newBlobUrl);

    } catch (error) {
      console.error("Error downloading audio:", error);
      setIsNotFound(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (audioUrl) {
      // Stop any currently playing audio
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      
      downloadAudio(audioUrl);
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

  return (
    <div className="pb-2">
      {isLoading && (
        <div className="flex justify-center items-center">
          <NormalLoader />
        </div>
      )}

      {!isLoading && audioBlobUrl && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-2">
          <audio 
            ref={audioRef}
            controls 
            controlsList="download"
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
        </div>
      )}

      {!isLoading && (audioUrl === null || isNotFound) && (
        <div className="bg-gray-50 rounded-lg p-4 text-center">
          <p className="text-gray-500">No recording found for the provided Call.</p>
        </div>
      )}
    </div>
  );
};

export default AudioPlayer;
