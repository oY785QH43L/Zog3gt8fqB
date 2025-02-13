import 'reflect-metadata';
import { inject, injectable } from 'inversify';
import { LoggerService } from './logger.service';
import neo4j, { Driver } from 'neo4j-driver';

@injectable()
/**
 * The Neo4j database service.
 */
export class Neo4jDatabaseService {
    /**
     * Initializes the Neo4j database service.
     * @param loggerService The logger service.
     */
    constructor(@inject(LoggerService.name) private loggerService: LoggerService) { }

    /**
     * Initializes the Neo4j database driver.
     * @returns The initialized driver.
     */
    public async initialize(): Promise<Driver> {
        return new Promise<Driver>((resolve, reject) => {
            try {
                let driver = neo4j.driver(
                    process.env.NEO4J_URI,
                    neo4j.auth.basic(process.env.NEO4J_USERNAME, process.env.NEO4J_PASSWORD)
                );
                this.loggerService.logInfo("Initialized the Neo4j client.", "Neo4jDatabaseService");
                resolve(driver);
            } catch (err) {
                this.loggerService.logError(err, "Neo4jDatabaseService");
                reject(err);
            }
        });
    }
}