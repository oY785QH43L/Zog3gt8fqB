export interface AddRecommendationRequestBody{
    adminId: number;
    customerId: number;
    vendorToProductId: number;
    purchaseProbability: number;
}