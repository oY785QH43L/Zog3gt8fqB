/**
 * The order position.
 */
export interface OrderPosition {
    orderPositionId: number;
    orderId: number;
    amount: number;
    vendorToProductId: number;
    courierCompanyId: number;
    deliveryDate: Date;
    deliveryAddressId: number;
}