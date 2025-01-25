export interface OrderPosition{
    orderPositionId: number;
    orderId: number;
    amount: number;
    vendorToProductId: number;
    supplierCompanyId: number;
    deliveryDate: number;
    deliveryAddressId: number;
}