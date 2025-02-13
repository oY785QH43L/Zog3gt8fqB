/**
 * The customer action interface (MongoDB).
 */
export interface ICustomerAction {
    customerActionId: number;
    customerId: number;
    vendorToProductId: number;
    actionType: string;
    actionDate: Date;
}