/**
 * The add recommendation request body.
 */
export interface AddRecommendationRequestBody {
    adminId: number;
    customerId: number;
    vendorToProductId: number;
    purchaseProbability: number;
}