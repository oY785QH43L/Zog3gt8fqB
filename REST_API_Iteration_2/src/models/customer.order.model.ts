export interface CustomerOrder{
    orderId: number;
    orderName: string;
    orderDate: Date;
    customerId: number;
    billingAddressId: number;
    isPaid: boolean;
}