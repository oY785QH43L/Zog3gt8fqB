/**
 * The create review request body.
 */
export interface CreateReviewRequestBody {
    customerId: number;
    vendorToProductId: number;
    reviewText: string;
    rating: number;
}