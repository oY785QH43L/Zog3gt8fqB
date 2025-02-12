import { inject, injectable } from 'inversify';
import { RedisDatabaseService } from './redis.database.service';
import { LoggerService } from './logger.service';


@injectable()
/**
 * The customers session service.
 */
export class CustomersSessionService {
    /**
     * Initializes the customers session service.
     * @param redisDatabaseService The Redis database service.
     * @param loggerService The logger service.
     */
    constructor(@inject(RedisDatabaseService.name) private redisDatabaseService: RedisDatabaseService,
        @inject(LoggerService.name) private loggerService: LoggerService) { }

    /**
     * Returns a boolean indicating whether the client is still authorized.
     * @param customerId The customer ID.
     * @returns Boolean indicating whether the client is still authorized.
     */
    public async verifyCustomer(customerId: number): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
            this.redisDatabaseService.doesKeyExist(process.env.SESSIONS_HASH, "customer:" + String(customerId)).then((response) => {
                if (!response) {
                    this.loggerService.logInfo(`Customer under ID '${customerId}' was rejected.`, "CustomersSessionService");
                    resolve(false);
                    return;
                }

                this.redisDatabaseService.getValue(process.env.SESSIONS_HASH, "customer:" + String(customerId)).then((response) => {
                    let jwt = require("jsonwebtoken");
                    let decodedToken;
                    let selfReference = this;
                    jwt.verify(response, 'secret', function(err, tokenData) {
                        if (err) {
                            selfReference.redisDatabaseService.removeValue(process.env.SESSIONS_HASH, "customer:" + String(customerId)).then((response) => {
                                selfReference.loggerService.logInfo(`Customer under ID '${customerId}' was rejected.`, "CustomersSessionService");
                                resolve(false);
                                return;
                            }).catch((err) => {
                                selfReference.loggerService.logError(err, "CustomersSessionService");
                                reject(err);
                            })
                            return;
                        }

                        decodedToken = tokenData;

                        if (decodedToken.role !== "customer") {
                            selfReference.redisDatabaseService.removeValue(process.env.SESSIONS_HASH, "customer:" + String(customerId)).then((response) => {
                                resolve(false);
                                return;
                            }).catch((err) => {
                                selfReference.loggerService.logError(err, "CustomersSessionService");
                                reject(err);
                            })
                        }

                        selfReference.loggerService.logInfo(`Customer under ID '${customerId}' was accepted.`, "CustomersSessionService");
                        resolve(true);
                    })
                }).catch((error) => {
                    this.loggerService.logError(error, "CustomersSessionService");
                    reject(error);
                })
            }).catch((err) => {
                this.loggerService.logError(err, "CustomersSessionService");
                reject(err);
            })
        })
    }

    /**
     * Registers a new session for the given customer.
     * @param customerId The customer ID.
     * @returns The customer ID.
     */
    public async registerCustomerSession(customerId: number): Promise<number> {
        try {
            let exists = await this.redisDatabaseService.doesKeyExist(process.env.SESSIONS_HASH, "customer:" + String(customerId));

            if (exists) {
                let removed = await this.redisDatabaseService.removeValue(process.env.SESSIONS_HASH, "customer:" + String(customerId));
            }

            var jwt = require('jsonwebtoken');
            let token = jwt.sign({ id: customerId, role: "customer" }, "secret", { expiresIn: "3h" });
            await this.redisDatabaseService.storeNewValue(process.env.SESSIONS_HASH, "customer:" + String(customerId), token);
            this.loggerService.logInfo(`Session for customer with ID '${customerId}' was registered.`, "CustomersSessionService");
            return customerId;
        }
        catch (err) {
            this.loggerService.logError(err, "CustomersSessionService");
            throw err;
        }
    }
}