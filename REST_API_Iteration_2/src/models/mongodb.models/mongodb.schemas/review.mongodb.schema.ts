import { Schema } from "mongoose";
import { IReview } from "../mongodb.interfaces/review.mongodb.interface";

const reviewSchema = new Schema<IReview>({
    reviewId: {type: Number, required: true},
    customerId: {type: Number, required: true},
    vendorToProductId: {type: Number, required: true},
    reviewText: {type: String, required: true},
    rating: {type: Number, required: true},
    reviewDate: {type: Date, required: true}
});

export default reviewSchema;