export interface AddCustomerAddressRequestBody{
    customerId: number,
    street: string,
    city: string,
    postalCode: string,
    country: string
}