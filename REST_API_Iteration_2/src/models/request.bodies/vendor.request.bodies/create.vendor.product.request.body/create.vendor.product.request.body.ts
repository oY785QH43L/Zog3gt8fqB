import { AddVendorProductCategoryRequestBody } from "./add.vendor.product.category.request.body";

/**
 * The create vendor product request body.
 */
export interface CreateVendorProductRequestBody {
    vendorId: number;
    unitPriceEuro: number;
    inventoryLevel: number;
    name: string;
    description: string;
    categories: AddVendorProductCategoryRequestBody[];
}