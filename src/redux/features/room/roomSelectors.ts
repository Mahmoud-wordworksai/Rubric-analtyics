import { RootState } from "../../store";

export const selectSelectedRoom = (state: RootState) => state.room.selectedRoom;
export const selectAvailableRooms = (state: RootState) => state.room.availableRooms;
