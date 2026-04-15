import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface RoomState {
  selectedRoom: string;
  availableRooms: string[];
}

const initialState: RoomState = {
  selectedRoom: "main",
  availableRooms: ["main"],
};

const roomSlice = createSlice({
  name: "room",
  initialState,
  reducers: {
    setSelectedRoom: (state, action: PayloadAction<string>) => {
      state.selectedRoom = action.payload;
    },
    setAvailableRooms: (state, action: PayloadAction<string[]>) => {
      state.availableRooms = action.payload;
    },
    resetRoom: (state) => {
      state.selectedRoom = "main";
    },
  },
});

export const { setSelectedRoom, setAvailableRooms, resetRoom } = roomSlice.actions;
export default roomSlice.reducer;
