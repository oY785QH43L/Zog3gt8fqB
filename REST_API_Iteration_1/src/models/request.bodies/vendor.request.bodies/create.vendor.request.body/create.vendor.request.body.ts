import { CreateVendorAddressRequestBody } from "./create.vendor.address.request.body";

/**
 * The create vendor request body.
 */
export interface CreateVendorRequestBody {
    userName: string;
    name: string;
    email: string;
    password: string;
    phoneNumber: string;
    addresses: CreateVendorAddressRequestBody[];
}