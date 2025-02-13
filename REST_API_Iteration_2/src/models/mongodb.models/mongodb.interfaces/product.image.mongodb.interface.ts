import mongoose from "mongoose";

/**
 * The product image interface (MongoDB).
 */
export interface IProductImage {
    pictureId: number;
    vendorToProductId: number;
    imageContent: mongoose.Types.ObjectId;
}