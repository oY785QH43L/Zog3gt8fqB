import { Address } from "./address.model";

/**
 * The supplier information.
 */
export interface SupplierInformation {
    supplierId: number;
    name: string;
    email: string;
    phoneNumber: string;
    supplierAddresses: Address[];
}