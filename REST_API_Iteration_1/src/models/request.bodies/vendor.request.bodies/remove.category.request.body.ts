/**
 * The remove category request body.
 */
export interface RemoveCategoryRequestBody {
    vendorId: number;
    vendorToProductId: number;
    categoryId: number;
}