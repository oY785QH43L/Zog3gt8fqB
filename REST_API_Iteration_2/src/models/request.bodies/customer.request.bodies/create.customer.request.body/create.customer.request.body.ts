import { CreateCustomerAddressRequestBody } from "./create.customer.address.request.body";

/**
 * The create customer request body.
 */
export interface CreateCustomerRequestBody {
    userName: string;
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    phoneNumber: string;
    addresses: CreateCustomerAddressRequestBody[];
}