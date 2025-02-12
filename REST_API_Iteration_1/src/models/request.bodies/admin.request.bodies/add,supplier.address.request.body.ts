/**
 * The add supplier address request body.
 */
export interface AddSupplierAddressRequestBody {
    adminId: number,
    supplierId: number,
    street: string,
    city: string,
    postalCode: string,
    country: string
}