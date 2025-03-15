import { CreateCourierAddressRequestBody } from "./create.courier.address.request.body";

/**
 * The create courier request body.
 */
export interface CreateCourierRequestBody {
    adminId: number;
    name: string;
    email: string;
    phoneNumber: string;
    addresses: CreateCourierAddressRequestBody[];
}