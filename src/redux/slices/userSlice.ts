import { createSlice } from "@reduxjs/toolkit";

export interface User {
    firstName?: string;
    lastName?: string;
    email: string;
    password: string;
}

interface UserState {
    firstName: string;
    lastName: string;
    email: string;
}

const initialState: UserState = {
    firstName: "",
    lastName: "",
    email: "",
};

const userSlice = createSlice({
    name: "user",
    initialState,
    reducers: {
        setUser: (state, action) => {
            state.firstName = action.payload.firstName;
            state.lastName = action.payload.lastName;
            state.email = action.payload.email;
        },
    },
});

export const { setUser } = userSlice.actions;
export default userSlice.reducer;