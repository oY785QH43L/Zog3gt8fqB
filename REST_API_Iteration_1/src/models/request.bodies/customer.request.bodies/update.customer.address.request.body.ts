export interface UpdateCustomerAddressRequestBody{
    customerId: number,
    addressId: number,
    street: string,
    city: string,
    postalCode: string,
    country: string
}