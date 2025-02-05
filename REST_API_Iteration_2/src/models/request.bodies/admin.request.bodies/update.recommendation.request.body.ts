export interface UpdateRecommendationRequestBody{
    adminId: number;
    recommendationId: number;
    customerId: number;
    vendorToProductId: number;
    purchaseProbability: number;
}