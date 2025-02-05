import { Integer, Node } from "neo4j-driver";

export type Category = Node<Integer, {
    CategoryId: number;
    Name: string;
}>