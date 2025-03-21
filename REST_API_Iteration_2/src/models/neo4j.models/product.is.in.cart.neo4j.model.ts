import { IS_IN } from "./is.in.neo4j.model";
import { ShoppingCart } from "./shopping.cart.neo4j.model";
import { VendorToProduct } from "./vendor.to.product.neo4j.model";

/**
 * The product in cart interface (Neo4j).
 */
export interface VendorProductIsInCart {
    v: VendorToProduct;
    s: ShoppingCart;
    r: IS_IN
}