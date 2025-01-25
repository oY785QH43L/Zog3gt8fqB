import { inject, injectable } from 'inversify';
import { createClient } from 'redis';
import { RedisDatabaseService } from './redis.database.service';


/**
 * The customers session service.
 */
@injectable()
export class CustomersSessionService {
    constructor(@inject(RedisDatabaseService.name) private redisDatabaseService: RedisDatabaseService){}

    public async verifyCustomer(customerId: number): Promise<boolean>{
        return new Promise<boolean>((resolve, reject) => {
            this.redisDatabaseService.doesKeyExist(process.env.REDIS_CUSTOMER_SESSIONS, String(customerId)).then((response) => {
                if (!response){
                    resolve(false);
                    return;
                }

                this.redisDatabaseService.getValue(process.env.REDIS_CUSTOMER_SESSIONS, String(customerId)).then((response) => {
                    let jwt = require("jsonwebtoken");
                    let decodedToken;
                    let selfReference = this;
                    jwt.verify(response, 'secret', function(err, tokenData){
                        if (err){
                            selfReference.redisDatabaseService.removeValue(process.env.REDIS_CUSTOMER_SESSIONS, String(customerId)).then((response) => {
                                resolve(false);
                                return;
                              }).catch((err) => {
                                reject(err);
                            })
                            return;
                        }

                        decodedToken = tokenData;

                        if (decodedToken.role !== "customer"){
                          selfReference.redisDatabaseService.removeValue(process.env.REDIS_CUSTOMER_SESSIONS, String(customerId)).then((response) => {
                            resolve(false);
                            return;
                          }).catch((err) => {
                            reject(err);
                          })
                        } 

                        resolve(true);
                    })
                }).catch((error) => {
                    reject(error);
                })
            }).catch((err) => {
                reject(err);
            })
        })
    }

    public async registerCustomerSession(customerId: number): Promise<number>{
        try{
            let exists = await this.redisDatabaseService.doesKeyExist(process.env.REDIS_CUSTOMER_SESSIONS, String(customerId));

            if (exists){
                let removed = await this.redisDatabaseService.removeValue(process.env.REDIS_CUSTOMER_SESSIONS, String(customerId));
            }

            var jwt = require('jsonwebtoken');
            let token = jwt.sign({id: customerId, role: "customer"}, "secret", {expiresIn: "3h"});
            await this.redisDatabaseService.storeNewValue(process.env.REDIS_CUSTOMER_SESSIONS, String(customerId), token);
            return customerId;
        }
        catch (err){
            throw err;
        }
    }
}