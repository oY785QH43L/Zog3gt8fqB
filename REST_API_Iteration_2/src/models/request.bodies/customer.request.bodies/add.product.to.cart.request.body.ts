export interface AddProductToCartRequestBody{
    customerId: number;
    vendorToProductId: number;
    shoppingCartId: number;
    amount: number;
}