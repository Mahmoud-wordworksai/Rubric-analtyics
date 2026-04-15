import { createSlice } from "@reduxjs/toolkit";

export interface PayableVendors {
    vendorId: string;
    mobileNumber: string;
    name: string;
    totalRejectedOrdersCount: number;
    totalDeliveredOrdersCount: number;
    totalEarnings: number;
    deliveredOrderIds: string[];
    payout: boolean;
    upiId: string;
}

export interface AllVendors {
    vendorId: string;
    vendorName: string;
    address: string;
    description: string;
    restaurantType: "VEG" | "NVEG" | "CAFE" | "MC";
    latitude: number;
    longitude: number;
    area: "Anna Nagar" | "Nungambakkam";
    vendorEmail: string;
    vendorPhone: string;
    startTime: string;
    endTime: string;
    availableDays: string[];
    upiId: string;
    vendorLogo: string;
    isSuspended: boolean;
    status: boolean;
}

export interface VendorPayout {
    vendor_id: string;
    vendor_name: string;
    amount: number;
    orders_date_range: { from: string; to: string };
    order_ids: string[];
    order_count: number;
    // payout_date: string;
}

interface VendorState {
    allVendors: AllVendors[],
    payableVendors: PayableVendors[],
    payouts: VendorPayout[]
}

const initialState : VendorState = {
    allVendors: [],
    payableVendors: [],
    payouts: []
}

const vendorSlice = createSlice({
    name: "vendors",
    initialState,
    reducers: {
        setPayableVendors: (state, action) => {
            state.payableVendors = action.payload;
        },
        setAllVendors: (state, action) => {
            state.allVendors = action.payload;  
        },
        addPayout: (state, action) => {
            state.payouts.push(action.payload);
        },
        setPayout: (state, action) => {
            state.payableVendors.map((payableVendors) => {
                if (payableVendors.vendorId === action.payload.vendor_id) {
                    payableVendors.payout = action.payload.payout;
                }
            })
        },
        suspendVendor: (state, action) => {
            state.allVendors.map((vendor) => {
                if (vendor.vendorId === action.payload.vendorId) {
                    vendor.isSuspended = action.payload.isSuspended;
                }
            })
        },
        updateStatus: (state, action) => {
            state.allVendors.map((vendor) => {
                if (vendor.vendorId === action.payload.vendorId) {
                    vendor.status = action.payload.status;
                }
            })
        }
    },
});

export const { setPayableVendors, setAllVendors, addPayout, setPayout, suspendVendor, updateStatus } = vendorSlice.actions;
export default vendorSlice.reducer;