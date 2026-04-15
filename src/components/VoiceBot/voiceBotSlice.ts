import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface VoiceBotState {
  activeTab: string;
  isLoading: boolean;
}

const initialState: VoiceBotState = {
  activeTab: "bot",
  isLoading: true,
};

const voiceBotSlice = createSlice({
  name: 'voicebot',
  initialState,
  reducers: {
    handleTabChange: (state, action: PayloadAction<string>) => {
      state.activeTab = action.payload;
    },
    handleIframeLoad: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
  },
});

export const { handleTabChange, handleIframeLoad } = voiceBotSlice.actions;

export default voiceBotSlice.reducer;
