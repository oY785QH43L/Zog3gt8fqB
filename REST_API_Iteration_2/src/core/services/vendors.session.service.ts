import 'reflect-metadata';
import { inject, injectable } from 'inversify';
import { RedisDatabaseService } from './redis.database.service';
import { LoggerService } from './logger.service';

@injectable()
/**
 * The vendors session service.
 */
export class VendorsSessionService {
    /**
     * Initializes the vendors session service.
     * @param redisDatabaseService The Redis database service.
     * @param loggerService The logger service.
     */
    constructor(
        @inject(RedisDatabaseService.name) private redisDatabaseService: RedisDatabaseService,
        @inject(LoggerService.name) private loggerService: LoggerService) { }

    /**
     * Returns a boolean indicating whether the vendor is still authorized.
     * @param vendorId The vendor ID.
     * @returns Boolean indicating whether the vendor is still authorized.
     */
    public async verifyVendor(vendorId: number): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
            this.redisDatabaseService.doesKeyExist(process.env.SESSIONS_HASH, "vendor:" + String(vendorId)).then((response) => {
                if (!response) {
                    this.loggerService.logInfo(`Vendor under ID '${vendorId}' was rejected.`, "VendorsSessionService");
                    resolve(false);
                    return;
                }

                this.redisDatabaseService.getValue(process.env.SESSIONS_HASH, "vendor:" + String(vendorId)).then((response) => {
                    let jwt = require("jsonwebtoken");
                    let decodedToken;
                    let selfReference = this;
                    jwt.verify(response, 'secret', function(err, tokenData) {
                        if (err) {
                            selfReference.redisDatabaseService.removeValue(process.env.SESSIONS_HASH, "vendor:" + String(vendorId)).then((response) => {
                                selfReference.loggerService.logInfo(`Vendor under ID '${vendorId}' was rejected.`, "VendorsSessionService");
                                resolve(false);
                                return;
                            }).catch((err) => {
                                selfReference.loggerService.logError(err, "VendorsSessionService");
                                reject(err);
                            })
                            return;
                        }

                        decodedToken = tokenData;

                        if (decodedToken.role !== "vendor") {
                            selfReference.redisDatabaseService.removeValue(process.env.SESSIONS_HASH, "vendor:" + String(vendorId)).then((response) => {
                                selfReference.loggerService.logInfo(`Vendor under ID '${vendorId}' was rejected.`, "VendorsSessionService");
                                resolve(false);
                                return;
                            }).catch((err) => {
                                selfReference.loggerService.logError(err, "VendorsSessionService");
                                reject(err);
                            })
                        }

                        selfReference.loggerService.logInfo(`Vendor under ID '${vendorId}' was accepted.`, "VendorsSessionService");
                        resolve(true);
                    })
                }).catch((error) => {
                    this.loggerService.logError(error, "VendorsSessionService");
                    reject(error);
                })
            }).catch((err) => {
                this.loggerService.logError(err, "VendorsSessionService");
                reject(err);
            })
        })
    }

    /**
     * Registers a new session for the given vendor.
     * @param vendorId The vendor ID.
     * @returns The vendor ID.
     */
    public async registerVendorSession(vendorId: number): Promise<number> {
        try {
            let exists = await this.redisDatabaseService.doesKeyExist(process.env.SESSIONS_HASH, "vendor:" + String(vendorId));

            if (exists) {
                let removed = await this.redisDatabaseService.removeValue(process.env.SESSIONS_HASH, "vendor:" + String(vendorId));
            }

            var jwt = require('jsonwebtoken');
            let token = jwt.sign({ id: vendorId, role: "vendor" }, "secret", { expiresIn: "3h" });
            await this.redisDatabaseService.storeNewValue(process.env.SESSIONS_HASH, "vendor:" + String(vendorId), token);
            this.loggerService.logInfo(`Session for vendor with ID '${vendorId}' was registered.`, "VendorsSessionService");
            return vendorId;
        }
        catch (err) {
            this.loggerService.logError(err, "VendorsSessionService");
            throw err;
        }
    }
}