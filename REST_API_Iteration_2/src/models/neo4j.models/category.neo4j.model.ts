import { Integer, Node } from "neo4j-driver";

/**
 * The category node (Neo4j).
 */
export type Category = Node<Integer, {
    CategoryId: number;
    Name: string;
}>