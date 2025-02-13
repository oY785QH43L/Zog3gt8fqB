/**
 * The update recommendation request body.
 */
export interface UpdateRecommendationRequestBody {
    adminId: number;
    recommendationId: number;
    customerId: number;
    vendorToProductId: number;
    purchaseProbability: number;
}