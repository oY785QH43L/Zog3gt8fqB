export interface CustomerAction{
    customerActionId: number;
    customerId: number;
    vendorToProductId: number;
    actionType: string;
    actionDate: Date;
}