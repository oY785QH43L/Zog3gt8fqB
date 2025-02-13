/**
 * The update review request body.
 */
export interface UpdateReviewRequestBody {
    reviewId: number;
    customerId: number;
    vendorToProductId: number;
    reviewText: string;
    rating: number;
}