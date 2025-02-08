import mongoose, { Schema } from "mongoose";
import { IProductVideo } from "../mongodb.interfaces/product.video.mongodb.interface";

const productVideoSchema = new Schema<IProductVideo>({
    videoId: {type: Number, required: true},
    vendorToProductId: {type: Number, required: true},
    videoContent: {type: mongoose.Schema.Types.ObjectId, ref: "video.files"}
});

export default productVideoSchema;