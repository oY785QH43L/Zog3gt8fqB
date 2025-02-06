export interface ICustomerAction{
    customerActionId: number;
    customerId: number;
    vendorToProductId: number;
    actionType: string;
    actionDate: Date;
}