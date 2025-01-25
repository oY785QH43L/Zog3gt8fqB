import { inject, injectable } from 'inversify';
import { createClient } from 'redis';
import 'reflect-metadata';
import { LoggerService } from './logger.service';

/**
 * The customers session service.
 */
@injectable()
export class RedisDatabaseService {
    constructor(@inject(LoggerService.name) private loggerService: LoggerService,
    ){}
    
    public async getKeys(hashName: string): Promise<string[]>{
        return new Promise<string[]>((resolve, reject) => {
            let client = createClient({
                socket:{
                    host: String(process.env.REDIS_HOST),
                    port: Number(process.env.REDIS_PORT)
                }
            });

            client.connect().then((conn) => {
                conn.hKeys(hashName).then((keys) => {
                    conn.disconnect();
                    resolve(keys);
                }, (err) => {
                    this.loggerService.logError(err);
                    conn.disconnect();
                    reject(err);
                })
            }).catch((err) => {
                reject(err);
            })
        });
    } 

    public async doesKeyExist(hashName: string, key: string): Promise<boolean>{
        return new Promise<boolean>((resolve, reject) => {
            let client = createClient({
                socket:{
                    host: String(process.env.REDIS_HOST),
                    port: Number(process.env.REDIS_PORT)
                }
            });
    
            client.connect().then((conn) => {
                conn.hExists(hashName, key).then((indicator) => {
                    if (!indicator){
                        conn.disconnect();
                        resolve(false);
                        return;
                    }
    
                    conn.disconnect();
                    resolve(true);
                }, (err) => {
                    this.loggerService.logError(err);
                    conn.disconnect();
                    reject(err);
                })
            }, (err) => {
                this.loggerService.logError(err);
                client.disconnect();
                reject(err);
            })
        });
    }

    public async getValue(hashName: string, key: string): Promise<any>{
        return new Promise<any>((resolve, reject) => {
            let client = createClient({
                socket:{
                    host: String(process.env.REDIS_HOST),
                    port: Number(process.env.REDIS_PORT)
                }
            });
            
            client.connect().then((conn) => {
                this.doesKeyExist(hashName, key).then((indicator) => {
                    if (indicator == false){
                        conn.disconnect();
                        reject("The key does not exist!")
                        return;
                    }
    
                    conn.hGet(hashName, key).then((val) => {
                        conn.disconnect();
                        resolve(val);
                    }, (err) => {
                        this.loggerService.logError(err);
                        conn.disconnect();
                        reject(err);
                    })
                }, (err) => {
                    this.loggerService.logError(err);
                    conn.disconnect();
                    reject(err);
                })
            })
        })
    }

    public async storeNewValue(hashName: string, key: string, value: any): Promise<void>{
        return new Promise<void>((resolve, reject) => {
            let client = createClient({
                socket:{
                    host: String(process.env.REDIS_HOST),
                    port: Number(process.env.REDIS_PORT)
                }
            });
    
            
            client.connect().then((conn) => {
                this.doesKeyExist(hashName, key).then((indicator) => {
                    if (indicator == true){
                        conn.disconnect();
                        reject("The key already exists!")
                        return;
                    }
    
                    conn.hSet(hashName, key, value).then((val) => {
                        conn.disconnect();
                        resolve();
                    }, (err) => {
                        conn.disconnect();
                        this.loggerService.logError(err);
                        reject(err);
                    })
                }, (err) => {
                    this.loggerService.logError(err);
                    conn.disconnect();
                    reject(err);
                })
            })
        })
    }

    public async removeValue(hashName: string, key: string): Promise<boolean>{
        return new Promise<boolean>((resolve, reject) => {
            let client = createClient({
                socket:{
                    host: String(process.env.REDIS_HOST),
                    port: Number(process.env.REDIS_PORT)
                }
            });

            client.connect().then((conn) => {
                this.doesKeyExist(hashName, key).then((indicator) => {
                    if (indicator == false){
                        conn.disconnect();
                        resolve(true);
                        return;
                    }
    
                    conn.hDel(hashName, key).then((val) => {
                        conn.disconnect();
                        resolve(true);
                    }, (err) => {
                        conn.disconnect();
                        this.loggerService.logError(err);
                        reject(err);
                    })
                }, (err) => {
                    this.loggerService.logError(err);
                    conn.disconnect();
                    reject(err);
                })
            })
        })
    }
}