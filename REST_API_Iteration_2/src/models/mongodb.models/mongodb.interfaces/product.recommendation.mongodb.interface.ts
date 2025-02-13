/**
 * The product recommendation interface (MongoDB).
 */
export interface IProductRecommendation {
    recommendationId: number;
    customerId: number;
    vendorToProductId: number;
    purchaseProbability: number;
    recommendationDate: Date;
}