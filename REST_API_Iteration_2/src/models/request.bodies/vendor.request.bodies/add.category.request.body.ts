/**
 * The add category request body.
 */
export interface AddCategoryRequestBody {
    vendorId: number;
    vendorToProductId: number;
    categoryId: number;
}