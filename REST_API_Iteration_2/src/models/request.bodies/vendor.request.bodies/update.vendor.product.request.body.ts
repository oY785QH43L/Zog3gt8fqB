/**
 * The update vendor product request body.
 */
export interface UpdateVendorProductRequestBody {
    vendorId: number;
    vendorToProductId: number;
    unitPriceEuro: number;
    inventoryLevel: number;
    name: string;
    description: string;
}