/**
 * The add customer address request body.
 */
export interface AddCustomerAddressRequestBody {
    customerId: number,
    street: string,
    city: string,
    postalCode: string,
    country: string
}