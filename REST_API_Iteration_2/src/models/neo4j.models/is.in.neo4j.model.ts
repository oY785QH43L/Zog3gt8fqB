import { Integer, Relationship } from "neo4j-driver";

export type IS_IN = Relationship<Integer, {
    Amount: number
}>