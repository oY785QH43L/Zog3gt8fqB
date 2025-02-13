import 'reflect-metadata';
import { inject, injectable } from 'inversify';
import { createClient } from 'redis';
import { LoggerService } from './logger.service';

@injectable()
/**
 * The Redis database service.
 */
export class RedisDatabaseService {
    /**
     * Initializes the Redis database service.
     * @param loggerService The logger service.
     */
    constructor(@inject(LoggerService.name) private loggerService: LoggerService
    ) { }

    /**
     * Retrieves the keys under the given hash.
     * @param hashName The hash name.
     * @returns The hash keys.
     */
    public async getKeys(hashName: string): Promise<string[]> {
        return new Promise<string[]>((resolve, reject) => {
            let client = createClient({
                socket: {
                    host: String(process.env.REDIS_HOST),
                    port: Number(process.env.REDIS_PORT)
                }
            });

            client.connect().then((conn) => {
                this.loggerService.logInfo("Connected to Redis.", "RedisDatabaseService");
                conn.hKeys(hashName).then((keys) => {
                    conn.disconnect();
                    resolve(keys);
                }, (err) => {
                    this.loggerService.logError(err, "RedisDatabaseService");
                    conn.disconnect();
                    reject(err);
                })
            }).catch((err) => {
                reject(err);
            })
        });
    }

    /**
     * Returns a boolean indicating whether the key exists in the given hash.
     * @param hashName The hash name.
     * @param key The key.
     * @returns Boolean indicating whether the key exists in the given hash.
     */
    public async doesKeyExist(hashName: string, key: string): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
            let client = createClient({
                socket: {
                    host: String(process.env.REDIS_HOST),
                    port: Number(process.env.REDIS_PORT)
                }
            });

            client.connect().then((conn) => {
                this.loggerService.logInfo("Connected to Redis.", "RedisDatabaseService");
                conn.hExists(hashName, key).then((indicator) => {
                    if (!indicator) {
                        conn.disconnect();
                        resolve(false);
                        return;
                    }

                    conn.disconnect();
                    resolve(true);
                }, (err) => {
                    this.loggerService.logError(err, "RedisDatabaseService");
                    conn.disconnect();
                    reject(err);
                })
            }, (err) => {
                this.loggerService.logError(err, "RedisDatabaseService");
                client.disconnect();
                reject(err);
            })
        });
    }

    /**
     * Returns the value of the key under the given hash.
     * @param hashName The hash name.
     * @param key The key.
     * @returns The value of the key under the given hash.
     */
    public async getValue(hashName: string, key: string): Promise<any> {
        return new Promise<any>((resolve, reject) => {
            let client = createClient({
                socket: {
                    host: String(process.env.REDIS_HOST),
                    port: Number(process.env.REDIS_PORT)
                }
            });

            client.connect().then((conn) => {
                this.loggerService.logInfo("Connected to Redis.", "RedisDatabaseService");
                this.doesKeyExist(hashName, key).then((indicator) => {
                    if (indicator == false) {
                        conn.disconnect();
                        reject("The key does not exist!")
                        return;
                    }

                    conn.hGet(hashName, key).then((val) => {
                        conn.disconnect();
                        resolve(val);
                    }, (err) => {
                        this.loggerService.logError(err, "RedisDatabaseService");
                        conn.disconnect();
                        reject(err);
                    })
                }, (err) => {
                    this.loggerService.logError(err, "RedisDatabaseService");
                    conn.disconnect();
                    reject(err);
                })
            })
        })
    }

    /**
     * Stores a value under the given key in the given hash.
     * @param hashName The hash name.
     * @param key The key.
     * @param value The value.
     */
    public async storeNewValue(hashName: string, key: string, value: any): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            let client = createClient({
                socket: {
                    host: String(process.env.REDIS_HOST),
                    port: Number(process.env.REDIS_PORT)
                }
            });


            client.connect().then((conn) => {
                this.loggerService.logInfo("Connected to Redis.", "RedisDatabaseService");
                this.doesKeyExist(hashName, key).then((indicator) => {
                    if (indicator == true) {
                        conn.disconnect();
                        reject("The key already exists!")
                        return;
                    }

                    conn.hSet(hashName, key, value).then((val) => {
                        conn.disconnect();
                        resolve();
                    }, (err) => {
                        conn.disconnect();
                        this.loggerService.logError(err, "RedisDatabaseService");
                        reject(err);
                    })
                }, (err) => {
                    this.loggerService.logError(err, "RedisDatabaseService");
                    conn.disconnect();
                    reject(err);
                })
            })
        })
    }

    /**
     * Removes the value under the given key in the given hash.
     * @param hashName The hash name.
     * @param key The key.
     * @returns Boolean indicating whether the value was removed.
     */
    public async removeValue(hashName: string, key: string): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
            let client = createClient({
                socket: {
                    host: String(process.env.REDIS_HOST),
                    port: Number(process.env.REDIS_PORT)
                }
            });

            client.connect().then((conn) => {
                this.loggerService.logInfo("Connected to Redis.", "RedisDatabaseService");
                this.doesKeyExist(hashName, key).then((indicator) => {
                    if (indicator == false) {
                        conn.disconnect();
                        resolve(true);
                        return;
                    }

                    conn.hDel(hashName, key).then((val) => {
                        conn.disconnect();
                        resolve(true);
                    }, (err) => {
                        conn.disconnect();
                        this.loggerService.logError(err, "RedisDatabaseService");
                        reject(err);
                    })
                }, (err) => {
                    this.loggerService.logError(err, "RedisDatabaseService");
                    conn.disconnect();
                    reject(err);
                })
            })
        })
    }
}