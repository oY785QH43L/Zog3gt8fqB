import mongoose from "mongoose";

/**
 * The product video interface (MongoDB).
 */
export interface IProductVideo {
    videoId: number;
    vendorToProductId: number;
    videoContent: mongoose.Types.ObjectId;
}