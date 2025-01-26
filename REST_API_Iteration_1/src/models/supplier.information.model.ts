import { Address } from "./address.model";

export interface SupplierInformation{
    supplierId: number;
    name: string;
    email: string;
    phoneNumber: string;
    supplierAddresses: Address[];
}