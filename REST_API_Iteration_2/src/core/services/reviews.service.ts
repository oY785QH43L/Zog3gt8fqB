import 'reflect-metadata';
import { inject, injectable } from 'inversify';
import { LoggerService } from "./logger.service";
import { MssqlDatabaseService } from "./mssql.database.service";
import { Review } from '../../models/review.model';
import { Sequelize } from 'sequelize';
import * as mongoose from "mongoose";
import { IReview } from '../../models/mongodb.models/mongodb.interfaces/review.mongodb.interface';
import reviewSchema from '../../models/mongodb.models/mongodb.schemas/review.mongodb.schema';

@injectable()
/**
 * The reviews service.
 */
export class ReviewsService {
    /**
     * Initializes the reviews service.
     * @param mssqlDatabaseService The MSSQL database service.
     * @param loggerService The logger service.
     */
    constructor(
        @inject(MssqlDatabaseService.name) private mssqlDatabaseService: MssqlDatabaseService,
        @inject(LoggerService.name) private loggerService: LoggerService
    ) { }

    /**
     * Creates a new review.
     * @param review The review data.
     * @returns The created review.
     */
    public async createReview(review: Review): Promise<Review> {
        let connection: Sequelize = await this.mssqlDatabaseService.initialize();
        await mongoose.connect(process.env.MONGODB_URI, { dbName: process.env.MONGODB_DATABASE });
        let Review = mongoose.model<IReview>("Review", reviewSchema, "Review");

        try {
            // Check if the ID already exists
            let foundReview = await Review.findOne({ 'reviewId': review.reviewId });
            this.loggerService.logInfo(`Fetched Review with ID '${review.reviewId}'.`, "ReviewsService-MongoDB");

            if (foundReview !== null) {
                await connection.close();
                await mongoose.disconnect();
                this.loggerService.logError(`Review with ID '${foundReview.reviewId}' already exists.`, "ReviewsService");
                throw new Error(`Review with ID '${foundReview.reviewId}' already exists!`);
            }

            // Check if the customer exists
            let foundCustomer = await connection.models.Customer.findOne({ where: { customerId: review.customerId } });
            this.loggerService.logInfo(`Fetched Customer with ID '${review.customerId}'.`, "ReviewsService-MSSQL");

            if (foundCustomer == null) {
                await connection.close();
                await mongoose.disconnect();
                this.loggerService.logError(`Customer with ID '${review.customerId}' does not exist.`, "ReviewsService");
                throw new Error(`Customer with ID '${review.customerId}' does not exist!`);
            }

            // Check if the product exists
            let foundProduct = await connection.models.VendorToProduct.findOne({ where: { vendorToProductId: review.vendorToProductId } });
            this.loggerService.logInfo(`Fetched VendorToProduct with ID '${review.vendorToProductId}'.`, "ReviewsService-MSSQL");

            if (foundProduct == null) {
                await connection.close();
                await mongoose.disconnect();
                this.loggerService.logError(`Vendor's product with ID '${review.vendorToProductId}' does not exist.`, "ReviewsService");
                throw new Error(`Vendor's product with ID '${review.vendorToProductId}' does not exist!`);
            }

            let toInsert = new Review({
                reviewId: review.reviewId,
                customerId: review.customerId,
                vendorToProductId: review.vendorToProductId,
                reviewText: review.reviewText,
                rating: review.rating,
                reviewDate: review.reviewDate
            });

            await toInsert.save();
            this.loggerService.logInfo(`Created Review with ID '${review.reviewId}'.`, "ReviewsService-MongoDB");
            await connection.close();
            await mongoose.disconnect();
            return review;
        }
        catch (err) {
            await connection.close();
            await mongoose.disconnect();
            throw err;
        }
    }

    /**
     * Updates the given review.
     * @param reviewId The review ID.
     * @param review The update data.
     * @returns The updated review.
     */
    public async updateReview(reviewId: number, review: Review): Promise<Review> {
        let connection: Sequelize = await this.mssqlDatabaseService.initialize();
        await mongoose.connect(process.env.MONGODB_URI, { dbName: process.env.MONGODB_DATABASE });
        let Review = mongoose.model<IReview>("Review", reviewSchema, "Review");

        try {
            // Check if IDs match
            if (reviewId !== review.reviewId) {
                await connection.close();
                await mongoose.disconnect();
                this.loggerService.logError(`reviewId and review.reviewId do not match.`, "ReviewsService");
                throw new Error(`reviewId and review.reviewId do not match!`);
            }

            // Check if the ID exists
            let foundReview = await Review.findOne({ 'reviewId': review.reviewId });
            this.loggerService.logInfo(`Fetched Review with ID '${review.reviewId}'.`, "ReviewsService-MongoDB");

            if (foundReview == null) {
                await connection.close();
                await mongoose.disconnect();
                this.loggerService.logError(`Review with ID '${review.reviewId}' does not exist.`, "ReviewsService");
                throw new Error(`Review with ID '${review.reviewId}' does not exist!`);
            }

            // Check if the customer exists
            let foundCustomer = await connection.models.Customer.findOne({ where: { customerId: review.customerId } });
            this.loggerService.logInfo(`Fetched Customer with ID '${review.customerId}'.`, "ReviewsService-MSSQL");

            if (foundCustomer == null) {
                await connection.close();
                await mongoose.disconnect();
                this.loggerService.logError(`Customer with ID '${review.customerId}' does not exist.`, "ReviewsService");
                throw new Error(`Customer with ID '${review.customerId}' does not exist!`);
            }

            // Check if the product exists
            let foundProduct = await connection.models.VendorToProduct.findOne({ where: { vendorToProductId: review.vendorToProductId } });
            this.loggerService.logInfo(`Fetched VendorToProduct with ID '${review.vendorToProductId}'.`, "ReviewsService-MSSQL");

            if (foundProduct == null) {
                await connection.close();
                await mongoose.disconnect();
                this.loggerService.logError(`Vendor's product with ID '${review.vendorToProductId}' does not exist.`, "ReviewsService");
                throw new Error(`Vendor's product with ID '${review.vendorToProductId}' does not exist!`);
            }

            // Update the data
            await Review.findOneAndUpdate({ reviewId: review.reviewId },
                {
                    reviewText: review.reviewText, rating: review.rating
                }
            );

            this.loggerService.logInfo(`Review with ID '${review.reviewId}' was updated.`, "ReviewsService-MongoDB");
            await connection.close();
            await mongoose.disconnect();
            return review;
        }
        catch (err) {
            await connection.close();
            await mongoose.disconnect();
            throw err;
        }
    }

    /**
     * Fetches reviews for the given vendor's product.
     * @param vendorToProductId The vendor's product ID.
     * @returns The fetched reviews.
     */
    public async getReviews(vendorToProductId: number): Promise<Review[]> {
        await mongoose.connect(process.env.MONGODB_URI, { dbName: process.env.MONGODB_DATABASE });
        let Review = mongoose.model<IReview>("Review", reviewSchema, "Review");

        try {
            let resultValues = await Review.find({ "vendorToProductId": vendorToProductId });
            this.loggerService.logInfo(`Fetched Review with data ${JSON.stringify({ "vendorToProductId": vendorToProductId })}.`, "ReviewsService-MongoDB");
            let reviews: Review[] = resultValues.map(function(r) {
                let returnVal = {
                    reviewId: r.reviewId, customerId: r.customerId,
                    vendorToProductId: r.vendorToProductId, reviewText: r.reviewText,
                    rating: r.rating, reviewDate: r.reviewDate
                } as Review;
                return returnVal;
            });

            await mongoose.disconnect();
            return reviews;
        }
        catch (err) {
            await mongoose.disconnect();
            throw err;
        }
    }

    /**
     * Fetches the first review where the given attribute equals the given value.
     * @param attributeName The attribute name.
     * @param attributeValue The attribute value.
     * @returns The fetched review.
     */
    public async getReviewByAttribute(attributeName: string, attributeValue): Promise<Review> {
        await mongoose.connect(process.env.MONGODB_URI, { dbName: process.env.MONGODB_DATABASE });
        let Review = mongoose.model<IReview>("Review", reviewSchema, "Review");

        try {
            let result = await Review.findOne({ [attributeName]: attributeValue });
            this.loggerService.logInfo(`Fetched Review with attribute '${attributeName}' value ${attributeValue}.`, "ReviewsService-MongoDB");
            let toReturn = {
                reviewId: result.reviewId, customerId: result.customerId,
                vendorToProductId: result.vendorToProductId, reviewText: result.reviewText,
                rating: result.rating, reviewDate: result.reviewDate
            } as Review;
            return toReturn;
        }
        catch (err) {
            await mongoose.disconnect();
            throw err;
        }
    }
}