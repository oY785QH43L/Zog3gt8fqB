import mongoose from "mongoose";

export interface IProductImage{
    pictureId: number;
    vendorToProductId: number;
    imageContent: mongoose.Types.ObjectId;
}