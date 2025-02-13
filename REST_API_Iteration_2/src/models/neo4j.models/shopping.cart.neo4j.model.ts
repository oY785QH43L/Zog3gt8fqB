import { Integer, Node } from "neo4j-driver";

/**
 * The shopping cart node (Neo4j).
 */
export type ShoppingCart = Node<Integer, {
    CartId: number;
    CustomerId: number;
    DateCreated: Date;
}>