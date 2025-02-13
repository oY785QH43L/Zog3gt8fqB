import { Integer, Relationship } from "neo4j-driver";

/**
 * The is in relationship (Neo4j).
 */
export type IS_IN = Relationship<Integer, {
    Amount: number
}>