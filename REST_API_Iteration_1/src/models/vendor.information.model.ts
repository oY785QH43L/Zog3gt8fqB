import { Address } from "./address.model";

export interface VendorInformation{
    vendorId: number;
    name: string;
    userName: string;
    email: string;
    phoneNumber: string;
    vendorAddresses: Address[];
}