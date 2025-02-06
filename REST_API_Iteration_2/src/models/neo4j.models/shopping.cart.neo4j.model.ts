import { Integer, Node } from "neo4j-driver";

export type ShoppingCart = Node<Integer, {
    CartId: number;
    CustomerId: number;
    DateCreated: Date;
}>