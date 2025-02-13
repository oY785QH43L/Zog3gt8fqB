/**
 * The remove product from cart request body.
 */
export interface RemoveProductFromCartRequestBody {
    customerId: number;
    vendorToProductId: number;
    shoppingCartId: number;
    amount: number;
}