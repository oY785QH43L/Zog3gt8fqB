/**
 * The update courier address request body.
 */
export interface UpdateCourierAddressRequestBody {
    adminId: number,
    courierId: number,
    addressId: number,
    street: string,
    city: string,
    postalCode: string,
    country: string
}