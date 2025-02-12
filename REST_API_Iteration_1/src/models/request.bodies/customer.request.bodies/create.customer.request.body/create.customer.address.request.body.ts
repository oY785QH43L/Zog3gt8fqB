/**
 * The create customer address request body.
 */
export interface CreateCustomerAddressRequestBody {
    street: string;
    city: string;
    postalCode: string;
    country: string;
}