import 'reflect-metadata';
import { inject, injectable } from 'inversify';
import { LoggerService } from "./logger.service";
import { MssqlDatabaseService } from "./mssql.database.service";
import { Sequelize } from 'sequelize';
import * as mongoose from "mongoose";
import { ICustomerAction } from '../../models/mongodb.models/mongodb.interfaces/customer.action.mongodb.interface';
import customerActionSchema from '../../models/mongodb.models/mongodb.schemas/customer.action.mongodb.schema';
import { CustomerAction } from '../../models/customer.action.model';

@injectable()
/**
 * The customer actions service.
 */
export class CustomerActionsService {
    /**
     * Initializes the customer actions service.
     * @param mssqlDatabaseService The MSSQL database service.
     * @param loggerService The logger service.
     */
    constructor(
        @inject(MssqlDatabaseService.name) private mssqlDatabaseService: MssqlDatabaseService,
        @inject(LoggerService.name) private loggerService: LoggerService
    ) { }

    /**
     * Creates a customer action.
     * @param customerAction The customer action.
     * @returns The created customer action.
     */
    public async createCustomerAction(customerAction: CustomerAction): Promise<CustomerAction> {
        let connection: Sequelize = await this.mssqlDatabaseService.initialize();
        await mongoose.connect(process.env.MONGODB_URI, { dbName: process.env.MONGODB_DATABASE });
        let CustomerAction = mongoose.model<ICustomerAction>("CustomerAction", customerActionSchema, "CustomerAction");

        try {
            // Check if the ID already exists
            let foundAction = await CustomerAction.findOne({ 'customerActionId': customerAction.customerActionId });
            this.loggerService.logInfo(`Fetched CustomerAction with ID '${customerAction.customerActionId}'.`, "CustomerActionsService-MongoDB");


            if (foundAction !== null) {
                await connection.close();
                await mongoose.disconnect();
                this.loggerService.logError(`Customer action with ID '${foundAction.customerActionId}' already exists.`, "CustomerActionsService");
                throw new Error(`Customer action with ID '${foundAction.customerActionId}' already exists!`);
            }

            // Check if the customer exists
            let foundCustomer = await connection.models.Customer.findOne({ where: { customerId: customerAction.customerId } });
            this.loggerService.logInfo(`Fetched Customer with ID '${customerAction.customerId}'.`, "CustomerActionsService-MSSQL");


            if (foundCustomer == null) {
                await connection.close();
                await mongoose.disconnect();
                this.loggerService.logError(`Customer with ID '${customerAction.customerId}' does not exist.`, "CustomerActionsService");
                throw new Error(`Customer with ID '${customerAction.customerId}' does not exist!`);
            }

            // Check if the product exists
            let foundProduct = await connection.models.VendorToProduct.findOne({ where: { vendorToProductId: customerAction.vendorToProductId } });
            this.loggerService.logInfo(`Fetched VendorToProduct with ID '${customerAction.vendorToProductId}'.`, "CustomerActionsService-MSSQL");


            if (foundProduct == null) {
                await connection.close();
                await mongoose.disconnect();
                this.loggerService.logError(`Vendor's product with ID '${customerAction.vendorToProductId}' does not exist.`, "CustomerActionsService");
                throw new Error(`Vendor's product with ID '${customerAction.vendorToProductId}' does not exist!`);
            }

            let toInsert = new CustomerAction({
                customerActionId: customerAction.customerActionId,
                customerId: customerAction.customerId,
                vendorToProductId: customerAction.vendorToProductId,
                actionType: customerAction.actionType,
                actionDate: customerAction.actionDate
            });

            await toInsert.save();
            this.loggerService.logInfo(`Created CustomerAction with ID '${customerAction.customerActionId}'.`, "CustomerActionsService-MongoDB");
            await connection.close();
            await mongoose.disconnect();
            return customerAction;
        }
        catch (err) {
            await connection.close();
            await mongoose.disconnect();
            throw err;
        }
    }
}