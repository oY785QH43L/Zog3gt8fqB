import { Integer, Node } from "neo4j-driver";

/**
 * The product node (Neo4j).
 */
export type Product = Node<Integer, {
    ProductId: number;
    Name: string;
    Description: string;
}>