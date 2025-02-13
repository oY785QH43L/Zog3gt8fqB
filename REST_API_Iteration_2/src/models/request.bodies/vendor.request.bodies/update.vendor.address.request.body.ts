/**
 * The update vendor address request body.
 */
export interface UpdateVendorAddressRequestBody {
    vendorId: number,
    addressId: number,
    street: string,
    city: string,
    postalCode: string,
    country: string
}