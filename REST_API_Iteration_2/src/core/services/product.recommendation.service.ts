import 'reflect-metadata';
import { LoggerService } from "./logger.service";
import { MssqlDatabaseService } from "./mssql.database.service";
import { inject, injectable } from 'inversify';
import * as mongoose from "mongoose";
import { IProductRecommendation } from '../../models/mongodb.models/mongodb.interfaces/product.recommendation.mongodb.interface';
import { ProductRecommendation } from '../../models/product.recommendation.model';
import recommendationSchema from "../../models/mongodb.models/mongodb.schemas/product.recommendation.mongodb.schema";
import { Sequelize } from "sequelize";

@injectable()
/**
 * The product recommendation service.
 */
export class ProductRecommendationService {
    /**
     * Initializes the product recommendation service.
     * @param mssqlDatabaseService The MSSQL database service.
     * @param loggerService The logger service.
     */
    constructor(
        @inject(MssqlDatabaseService.name) private mssqlDatabaseService: MssqlDatabaseService,
        @inject(LoggerService.name) private loggerService: LoggerService
    ) { }

    /**
     * Creates a product recommendation.
     * @param productRecommendation The product recommendation.
     * @returns The created product recommendation.
     */
    public async createProductRecommendation(productRecommendation: ProductRecommendation): Promise<ProductRecommendation> {
        let connection: Sequelize = await this.mssqlDatabaseService.initialize();
        await mongoose.connect(process.env.MONGODB_URI, { dbName: process.env.MONGODB_DATABASE });
        let ProductRecommendation = mongoose.model<IProductRecommendation>("ProductRecommendation", recommendationSchema, "ProductRecommendation");

        try {
            // Check if the ID already exists
            let foundRecommendation = await ProductRecommendation.findOne({ 'recommendationId': productRecommendation.recommendationId });
            this.loggerService.logInfo(`Fetched ProductRecommendation with ID '${productRecommendation.recommendationId}'.`, "ProductRecommendationService-MongoDB");

            if (foundRecommendation !== null) {
                await connection.close();
                await mongoose.disconnect();
                this.loggerService.logError(`Product recommendation with ID '${productRecommendation.recommendationId}' already exists.`, "ProductRecommendationService");
                throw new Error(`Product recommendation with ID '${productRecommendation.recommendationId}' already exists!`);
            }

            // Check if the customer exists
            let foundCustomer = await connection.models.Customer.findOne({ where: { customerId: productRecommendation.customerId } });
            this.loggerService.logInfo(`Fetched Customer with ID '${productRecommendation.customerId}'.`, "ProductRecommendationService-MSSQL");

            if (foundCustomer == null) {
                await connection.close();
                await mongoose.disconnect();
                this.loggerService.logError(`Customer with ID '${productRecommendation.customerId}' does not exist.`, "ProductRecommendationService");
                throw new Error(`Customer with ID '${productRecommendation.customerId}' does not exist!`);
            }

            // Check if the product exists
            let foundProduct = await connection.models.VendorToProduct.findOne({ where: { vendorToProductId: productRecommendation.vendorToProductId } });
            this.loggerService.logInfo(`Fetched VendorToProduct with ID '${productRecommendation.vendorToProductId}'.`, "ProductRecommendationService-MSSQL");

            if (foundProduct == null) {
                await connection.close();
                await mongoose.disconnect();
                this.loggerService.logError(`Vendor's product with ID '${productRecommendation.vendorToProductId}' does not exist.`, "ProductRecommendationService");
                throw new Error(`Vendor's product with ID '${productRecommendation.vendorToProductId}' does not exist!`);
            }

            let toInsert = new ProductRecommendation({
                recommendationId: productRecommendation.recommendationId,
                customerId: productRecommendation.customerId,
                vendorToProductId: productRecommendation.vendorToProductId,
                purchaseProbability: productRecommendation.purchaseProbability,
                recommendationDate: productRecommendation.recommendationDate
            });

            await toInsert.save();
            this.loggerService.logInfo(`Created ProductRecommendation with ID '${productRecommendation.recommendationId}'.`, "ProductRecommendationService-MongoDB");
            await connection.close();
            await mongoose.disconnect();
            return productRecommendation;
        }
        catch (err) {
            await connection.close();
            await mongoose.disconnect();
            throw err;
        }
    }

    /**
     * Updates the recommendation under the given ID.
     * @param recommendationId The recommendation ID.
     * @param productRecommendation The update data.
     * @returns The updated recommendation.
     */
    public async updateProductRecommendation(recommendationId: number, productRecommendation: ProductRecommendation): Promise<ProductRecommendation> {
        let connection: Sequelize = await this.mssqlDatabaseService.initialize();
        await mongoose.connect(process.env.MONGODB_URI, { dbName: process.env.MONGODB_DATABASE });
        let ProductRecommendation = mongoose.model<IProductRecommendation>("ProductRecommendation", recommendationSchema, "ProductRecommendation");

        try {
            // Check if IDs match
            if (recommendationId !== productRecommendation.recommendationId) {
                await connection.close();
                await mongoose.disconnect();
                this.loggerService.logError(`recommendationId and productRecommendation.recommendationId do not match.`, "ProductRecommendationService");
                throw new Error(`recommendationId and productRecommendation.recommendationId do not match!`);
            }

            // Check if the ID exists
            let foundRecommendation = await ProductRecommendation.findOne({ 'recommendationId': productRecommendation.recommendationId });
            this.loggerService.logInfo(`Fetched ProductRecommendation with ID '${productRecommendation.recommendationId}'.`, "ProductRecommendationService-MongoDB");

            if (foundRecommendation == null) {
                await connection.close();
                await mongoose.disconnect();
                this.loggerService.logError(`Product recommendation with ID '${productRecommendation.recommendationId}' does not exist.`, "ProductRecommendationService");
                throw new Error(`Product recommendation with ID '${productRecommendation.recommendationId}' does not exist!`);
            }

            // Check if the customer exists
            let foundCustomer = await connection.models.Customer.findOne({ where: { customerId: productRecommendation.customerId } });
            this.loggerService.logInfo(`Fetched Customer with ID '${productRecommendation.customerId}'.`, "ProductRecommendationService-MSSQL");

            if (foundCustomer == null) {
                await connection.close();
                await mongoose.disconnect();
                this.loggerService.logError(`Customer with ID '${productRecommendation.customerId}' does not exist.`, "ProductRecommendationService");
                throw new Error(`Customer with ID '${productRecommendation.customerId}' does not exist!`);
            }

            // Check if the product exists
            let foundProduct = await connection.models.VendorToProduct.findOne({ where: { vendorToProductId: productRecommendation.vendorToProductId } });
            this.loggerService.logInfo(`Fetched VendorToProduct with ID '${productRecommendation.vendorToProductId}'.`, "ProductRecommendationService-MSSQL");

            if (foundProduct == null) {
                await connection.close();
                await mongoose.disconnect();
                this.loggerService.logError(`Vendor's product with ID '${productRecommendation.vendorToProductId}' does not exist.`, "ProductRecommendationService");
                throw new Error(`Vendor's product with ID '${productRecommendation.vendorToProductId}' does not exist!`);
            }

            // Update the data
            await ProductRecommendation.findOneAndUpdate({ recommendationId: productRecommendation.recommendationId },
                {
                    customerId: productRecommendation.customerId, vendorToProductId: productRecommendation.vendorToProductId,
                    purchaseProbability: productRecommendation.purchaseProbability
                }
            );
            this.loggerService.logInfo(`ProductRecommendation with ID '${productRecommendation.recommendationId}' was updated.`, "ProductRecommendationService-MongoDB");
            await connection.close();
            await mongoose.disconnect();
            return productRecommendation;
        }
        catch (err) {
            await connection.close();
            await mongoose.disconnect();
            throw err;
        }
    }

    /**
     * Fetches the product recommendations for the given customer.
     * @param customerId The customer ID.
     * @returns The product recommendations.
     */
    public async getProductRecommendations(customerId: number): Promise<ProductRecommendation[]> {
        await mongoose.connect(process.env.MONGODB_URI, { dbName: process.env.MONGODB_DATABASE });
        let ProductRecommendation = mongoose.model<IProductRecommendation>("ProductRecommendation", recommendationSchema, "ProductRecommendation");

        try {
            // Fetch the recommendations
            let recommendations = await ProductRecommendation.find({ customerId: customerId });
            this.loggerService.logInfo(`Fetched ProductRecommendation with data ${JSON.stringify({ customerId: customerId })}.`, "ProductRecommendationService-MongoDB");
            let result = recommendations.map(function(r) {
                let toReturn = {
                    recommendationId: r.recommendationId, customerId: r.customerId,
                    vendorToProductId: r.vendorToProductId, purchaseProbability: r.purchaseProbability,
                    recommendationDate: r.recommendationDate
                } as ProductRecommendation;
                return toReturn;
            });

            await mongoose.disconnect();
            return result;
        }
        catch (err) {
            await mongoose.disconnect();
            throw err;
        }
    }
}