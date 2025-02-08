import mongoose, { Schema } from "mongoose";
import { IProductImage } from "../mongodb.interfaces/product.image.mongodb.interface";

const productImageSchema = new Schema<IProductImage>({
    pictureId: {type: Number, required: true},
    vendorToProductId: {type: Number, required: true},
    imageContent: {type: mongoose.Schema.Types.ObjectId, ref: "image.files"}
});

export default productImageSchema;