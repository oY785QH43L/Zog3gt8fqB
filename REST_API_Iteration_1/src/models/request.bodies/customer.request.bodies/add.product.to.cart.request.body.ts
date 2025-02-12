/**
 * The add product to cart request body.
 */
export interface AddProductToCartRequestBody {
    customerId: number;
    vendorToProductId: number;
    shoppingCartId: number;
    amount: number;
}