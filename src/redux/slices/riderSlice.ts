import { createSlice } from "@reduxjs/toolkit";

export interface Rider {
    riderId: string;
    phone: string;
    name: string;
    totalRejectedOrdersCount: number;
    totalDeliveredOrdersCount: number;
    totalEarnigns: number;
    payout: boolean;
    upiId: string;
    profilePic: string;
    aadhaarCard: string;
    drivingLicense: string;
    insurance: string;
    rcBook: string;
    deliveredOrderIds: string[];
}

export interface RiderPayout {
    rider_id: string;
    rider_name: string;
    amount: number;
    orders_date_range: { from: string; to: string };
    order_ids: string[];
    order_count: number;
}

interface RiderState {
    riders: Rider[];
}

const initialState: RiderState = {
    riders: [],
};      

const riderSlice = createSlice({
    name: "riders",
    initialState,
    reducers: {
        setRiders: (state, action) => {
            state.riders = action.payload;
        },
        setPayout: (state, action) => {
            state.riders = state.riders.map((rider) => {
                if (rider.riderId === action.payload.rider_id) {
                    return {
                        ...rider,
                        payout: action.payload.payout,
                    };
                }
                return rider;
            });
        }
    },
});

export const { setRiders, setPayout } = riderSlice.actions;
export default riderSlice.reducer;