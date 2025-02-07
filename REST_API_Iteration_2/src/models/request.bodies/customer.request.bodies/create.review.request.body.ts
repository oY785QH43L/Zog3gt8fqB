export interface CreateReviewRequestBody{
    customerId: number;
    vendorToProductId: number;
    reviewText: string;
    rating: number;
}