import { Address } from "./address.model";

/**
 * The courier information.
 */
export interface CourierInformation {
    courierId: number;
    name: string;
    email: string;
    phoneNumber: string;
    courierAddresses: Address[];
}