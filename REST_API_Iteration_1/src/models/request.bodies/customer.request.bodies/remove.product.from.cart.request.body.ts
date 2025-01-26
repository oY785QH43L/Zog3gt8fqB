export interface RemoveProductFromCartRequestBody{
    customerId: number;
    vendorToProductId: number;
    shoppingCartId: number;
    amount: number;
}