/**
 * The add courier address request body.
 */
export interface AddCourierAddressRequestBody {
    adminId: number,
    courierId: number,
    street: string,
    city: string,
    postalCode: string,
    country: string
}