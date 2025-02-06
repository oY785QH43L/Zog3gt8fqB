import { Integer, Node } from "neo4j-driver";

export type VendorToProduct = Node<Integer, {
    VendorToProductId: number;
    VendorId: number;
    ProductId: number;
    UnitPriceEuro: number;
    InventoryLevel: number;
}>