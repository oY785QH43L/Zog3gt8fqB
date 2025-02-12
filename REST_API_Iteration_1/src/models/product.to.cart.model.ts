/**
 * The product to cart relationship.
 */
export interface ProductToCart {
    productToCartId: number;
    vendorToProductId: number;
    cartId: number;
    amount: number;
}