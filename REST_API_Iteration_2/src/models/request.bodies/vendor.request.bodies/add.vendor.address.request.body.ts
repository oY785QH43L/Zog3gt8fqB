/**
 * The add vendor address request body.
 */
export interface AddVendorAddressRequestBody {
    vendorId: number,
    street: string,
    city: string,
    postalCode: string,
    country: string
}