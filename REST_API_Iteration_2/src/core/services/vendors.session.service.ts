import { inject, injectable } from 'inversify';
import { createClient } from 'redis';
import { RedisDatabaseService } from './redis.database.service';


/**
 * The vendors session service.
 */
@injectable()
export class VendorsSessionService {
    constructor(@inject(RedisDatabaseService.name) private redisDatabaseService: RedisDatabaseService){}

    public async verifyVendor(vendorId: number): Promise<boolean>{
        return new Promise<boolean>((resolve, reject) => {
            this.redisDatabaseService.doesKeyExist(process.env.SESSIONS_HASH, "vendor:" + String(vendorId)).then((response) => {
                if (!response){
                    resolve(false);
                    return;
                }

                this.redisDatabaseService.getValue(process.env.SESSIONS_HASH, "vendor:" + String(vendorId)).then((response) => {
                    let jwt = require("jsonwebtoken");
                    let decodedToken;
                    let selfReference = this;
                    jwt.verify(response, 'secret', function(err, tokenData){
                        if (err){
                            selfReference.redisDatabaseService.removeValue(process.env.SESSIONS_HASH, "vendor:" + String(vendorId)).then((response) => {
                                resolve(false);
                                return;
                              }).catch((err) => {
                                reject(err);
                            })
                            return;
                        }

                        decodedToken = tokenData;

                        if (decodedToken.role !== "vendor"){
                          selfReference.redisDatabaseService.removeValue(process.env.SESSIONS_HASH, "vendor:" + String(vendorId)).then((response) => {
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

    public async registerVendorSession(vendorId: number): Promise<number>{
        try{
            let exists = await this.redisDatabaseService.doesKeyExist(process.env.SESSIONS_HASH, "vendor:" + String(vendorId));

            if (exists){
                let removed = await this.redisDatabaseService.removeValue(process.env.SESSIONS_HASH, "vendor:" + String(vendorId));
            }

            var jwt = require('jsonwebtoken');
            let token = jwt.sign({id: vendorId, role: "vendor"}, "secret", {expiresIn: "3h"});
            await this.redisDatabaseService.storeNewValue(process.env.SESSIONS_HASH, "vendor:" + String(vendorId), token);
            return vendorId;
        }
        catch (err){
            throw err;
        }
    }
}