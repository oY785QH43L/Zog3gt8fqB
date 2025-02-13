import { Schema } from "mongoose";
import { IProductRecommendation } from "../mongodb.interfaces/product.recommendation.mongodb.interface";

/**
 * The product recommendation schema (MongoDB).
 */
const recommendationSchema = new Schema<IProductRecommendation>({
    recommendationId: { type: Number, required: true },
    customerId: { type: Number, required: true },
    vendorToProductId: { type: Number, required: true },
    purchaseProbability: { type: Number, required: true },
    recommendationDate: { type: Date, required: true }
});

export default recommendationSchema;