/**
 * The update courier request body.
 */
export interface UpdateCourierRequestBody {
    adminId: number,
    courierId: number,
    name: string,
    email: string,
    phoneNumber: string,
}