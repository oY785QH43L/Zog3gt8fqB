import { Address } from "./address.model";

/**
 * The vendor information.
 */
export interface VendorInformation {
    vendorId: number;
    name: string;
    userName: string;
    email: string;
    phoneNumber: string;
    vendorAddresses: Address[];
}