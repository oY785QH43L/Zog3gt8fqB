import mongoose from "mongoose";

export interface IProductVideo{
    videoId: number;
    vendorToProductId: number;
    videoContent: mongoose.Types.ObjectId;
}