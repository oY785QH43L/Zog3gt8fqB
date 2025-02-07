export interface Review{
    reviewId: number;
    customerId: number;
    vendorToProductId: number;
    reviewText: string;
    rating: number;
    reviewDate: Date;
}