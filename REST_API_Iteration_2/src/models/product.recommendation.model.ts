export interface ProductRecommendation{
    recommendationId: number;
    customerId: number;
    vendorToProductId: number;
    purchaseProbability: number;
    recommendationDate: Date;
}