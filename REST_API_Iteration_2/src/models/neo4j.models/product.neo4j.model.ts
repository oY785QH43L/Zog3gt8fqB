import { Integer, Node } from "neo4j-driver";

export type Product = Node<Integer, {
    ProductId: number;
    Name: string;
    Description: string;
}>