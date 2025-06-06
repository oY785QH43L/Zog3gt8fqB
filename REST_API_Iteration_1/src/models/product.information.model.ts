import { Category } from "./category.model";

/**
 * The product information.
 */
export interface ProductInformation {
    productId: number;
    name: string;
    description: string;
    unitPriceEuro: number;
    inventoryLevel: number;
    categories: Category[];
}