import { createSlice } from "@reduxjs/toolkit";

interface Feedback {
    _id: string,
    incoming_mobile: string,
    rating: string,
    comments: string,
};

interface FeedbackState {
    feedbacks: Feedback[]
};

const initialState: FeedbackState = {
    feedbacks: [],
};

export const feedbackSlice = createSlice({
    name: "feedback",
    initialState,
    reducers: {
        setFeedbacks: (state, action) => {
            state.feedbacks = action.payload;
        },
    },
});

export const { setFeedbacks } = feedbackSlice.actions;
export default feedbackSlice.reducer;