import { Integer, Node } from "neo4j-driver";

/**
 * The vendor's product node (Neo4j).
 */
export type VendorToProduct = Node<Integer, {
    VendorToProductId: number;
    VendorId: number;
    ProductId: number;
    UnitPriceEuro: number;
    InventoryLevel: number;
}>