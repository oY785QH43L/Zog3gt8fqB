/**
 * The update vendor request body.
 */
export interface UpdateVendorRequestBody {
    vendorId: number;
    userName: string;
    name: string;
    email: string;
    password: string;
    phoneNumber: string;
}