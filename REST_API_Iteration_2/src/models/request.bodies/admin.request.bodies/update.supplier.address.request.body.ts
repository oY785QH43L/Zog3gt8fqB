/**
 * The update supplier address request body.
 */
export interface UpdateSupplierAddressRequestBody {
    adminId: number,
    supplierId: number,
    addressId: number,
    street: string,
    city: string,
    postalCode: string,
    country: string
}