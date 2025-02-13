import 'reflect-metadata';
import { inject, injectable } from 'inversify';
import { MssqlDatabaseService } from './mssql.database.service';
import { Sequelize } from 'sequelize';
import { VendorToProduct } from '../../models/vendor.to.product.model';
import { Product } from '../../models/product.model';
import { Category } from '../../models/category.model';
import { ProductInformation } from '../../models/product.information.model';
import { LoggerService } from './logger.service';
import { Neo4jDatabaseService } from './neo4j.database.service';
import { MongoDbDatabaseService } from './mongodb.database.service';
import { Category as CategoryNeo4j } from '../../models/neo4j.models/category.neo4j.model';
import * as mongoose from "mongoose";
import { IProductImage } from '../../models/mongodb.models/mongodb.interfaces/product.image.mongodb.interface';
import productImageSchema from '../../models/mongodb.models/mongodb.schemas/product.image.mongodb.schema';
import { ProductImage } from '../../models/product.image.model';
import { ObjectId } from 'mongoose';
import { ProductVideo } from '../../models/product.video.model';
import { IProductVideo } from '../../models/mongodb.models/mongodb.interfaces/product.video.mongodb.interface';
import productVideoSchema from '../../models/mongodb.models/mongodb.schemas/product.video.mongodb.schema';

@injectable()
/**
 * The products service.
 */
export class ProductsService {
    /**
     * Initializes the products service.
     * @param mssqlDatabaseService The MSSQL database service.
     * @param neo4jDatabaseService The Neo4j database service.
     * @param mongoDBDatabaseService The MongoDB database service.
     * @param loggerService The logger service.
     */
    constructor(
        @inject(MssqlDatabaseService.name) private mssqlDatabaseService: MssqlDatabaseService,
        @inject(Neo4jDatabaseService.name) private neo4jDatabaseService: Neo4jDatabaseService,
        @inject(MongoDbDatabaseService.name) private mongoDBDatabaseService: MongoDbDatabaseService,
        @inject(LoggerService.name) private loggerService: LoggerService
    ) { }

    /**
     * Retrieves product information for the given ID.
     * @param vendorToProductId The vendor's product ID.
     * @returns The product information.
     */
    public async getVendorsProductInformation(vendorToProductId: number): Promise<ProductInformation> {
        let connection: Sequelize = await this.mssqlDatabaseService.initialize();
        let driver = await this.neo4jDatabaseService.initialize();
        let session = driver.session();

        try {
            let vendorToProductData = await connection.models.VendorToProduct.findOne({ where: { vendorToProductId: vendorToProductId } });
            this.loggerService.logInfo(`Fetched VendorToProduct with ID '${vendorToProductId}'.`, "ProductsService-MSSQL");

            if (vendorToProductData == null) {
                await connection.close();
                await session.close();
                this.loggerService.logError(`Vendor's product with ID '${vendorToProductId}' does not exist.`, "ProductsService");
                throw new Error(`Vendor's product with ID '${vendorToProductId}' does not exist!`);
            }

            let vendorToProductDataConverted = vendorToProductData.dataValues as VendorToProduct;
            let productData = await connection.models.Product.findOne({ where: { productId: vendorToProductDataConverted.productId } });
            this.loggerService.logInfo(`Fetched Product with ID '${vendorToProductDataConverted.productId}'.`, "ProductsService-MSSQL");
            let productDataConverted = productData.dataValues as Product;
            let categories = await session.executeRead(tx => tx.run(
                "MATCH (c)<-[r:HAS_CATEGORY]-(p:Product{ProductId: $productId}) return c"
                , { productId: productDataConverted.productId }));
            this.loggerService.logInfo(`Fetched categories for Product with ID '${productDataConverted.productId}'.`, "ProductsService-Neo4j");

            let categoriesConverted: Category[] = categories.records.map(function(v) {
                let category = v.get("c") as CategoryNeo4j;
                return { categoryId: Number(category.properties.CategoryId), name: category.properties.Name } as Category;
            });

            // Fetch the image and video
            let images = await this.getProductImages(vendorToProductId);
            let videos = await this.getProductVideos(vendorToProductId);
            let image = null;
            let video = null;

            if (images.length > 0) {
                image = images[0].imageContent;
            }

            if (videos.length > 0) {
                video = videos[0].videoContent;
            }

            let result = {
                productId: productDataConverted.productId, name: productDataConverted.name,
                description: productDataConverted.description, unitPriceEuro: vendorToProductDataConverted.unitPriceEuro,
                inventoryLevel: vendorToProductDataConverted.inventoryLevel, categories: categoriesConverted,
                productImage: image, productVideo: video
            } as ProductInformation;

            await connection.close();
            await session.close();
            return result;
        }
        catch (err) {
            await connection.close();
            await session.close();
            throw err;
        }
    }

    /**
     * Retrieves products' information for the given vendor.
     * @param vendorId The vendor ID.
     * @returns Products' information for the given vendor.
     */
    public async getVendorProducts(vendorId: number): Promise<Array<ProductInformation>> {
        let connection: Sequelize = await this.mssqlDatabaseService.initialize();

        try {
            // Check if vendor references exists
            let foundVendorReference = await connection.models.VendorToProduct.findOne({ where: { vendorId: vendorId } });
            this.loggerService.logInfo(`Fetched VendorToProduct with data ${JSON.stringify({ vendorId: vendorId })}.`, "ProductsService-MSSQL");

            if (foundVendorReference == null) {
                await connection.close();
                return [];
            }

            let ids = await connection.models.VendorToProduct.findAll({ attributes: ["vendorToProductId"], where: { vendorId: vendorId } });
            this.loggerService.logInfo(`Fetched VendorToProduct with data ${JSON.stringify({ vendorId: vendorId })}.`, "ProductsService-MSSQL");
            let idValues = ids.map(function(v) {
                return Number(v.dataValues["vendorToProductId"]);
            });

            let result: ProductInformation[] = [];

            for (let vpId of idValues) {
                let r = await this.getVendorsProductInformation(vpId);
                result.push(r);
            }

            await connection.close();
            return result;
        }
        catch (err) {
            await connection.close();
            throw err;
        }
    }

    /**
     * Retrieves images' data for the given vendor's product ID.
     * @param vendorToProductId The vendor's product ID.
     * @returns The retrieved images' data.
     */
    public async getProductImages(vendorToProductId: number): Promise<Array<ProductImage>> {
        let connection = await mongoose.connect(process.env.MONGODB_URI, { dbName: process.env.MONGODB_DATABASE });
        let database = connection.connection.db;
        mongoose.mongo.GridFSBucket
        let bucket = new mongoose.mongo.GridFSBucket(database, { bucketName: process.env.IMAGES_BUCKET_NAME });
        let ProductImage = mongoose.model<IProductImage>("ProductImage", productImageSchema, "ProductImage");

        try {
            let images = await ProductImage.find({ vendorToProductId: vendorToProductId });
            this.loggerService.logInfo(`Fetched ProductImage with data ${JSON.stringify({ vendorToProductId: vendorToProductId })}.`, "ProductsService-MongoDB");
            let result: ProductImage[] = [];

            // For each document, read the file from GridFS and convert to base64.
            for (let image of images) {
                let base64Content = await this.mongoDBDatabaseService.getFileBase64(image.imageContent, bucket);
                result.push({
                    pictureId: image.pictureId,
                    vendorToProductId: image.vendorToProductId,
                    imageContent: base64Content,
                } as ProductImage);
            }

            await mongoose.disconnect()
            return result;
        }
        catch (err) {
            await mongoose.disconnect();
            throw err;
        }
    }

    /**
     * Retrieves videos' data for the given vendor's product ID.
     * @param vendorToProductId The vendor's product ID.
     * @returns The retrieved videos' data.
     */
    public async getProductVideos(vendorToProductId: number): Promise<Array<ProductVideo>> {
        let connection = await mongoose.connect(process.env.MONGODB_URI, { dbName: process.env.MONGODB_DATABASE });
        let database = connection.connection.db;
        mongoose.mongo.GridFSBucket
        let bucket = new mongoose.mongo.GridFSBucket(database, { bucketName: process.env.VIDEOS_BUCKET_NAME });
        let ProductVideo = mongoose.model<IProductVideo>("ProductVideo", productVideoSchema, "ProductVideo");

        try {
            let videos = await ProductVideo.find({ vendorToProductId: vendorToProductId });
            this.loggerService.logInfo(`Fetched ProductVideo with data ${JSON.stringify({ vendorToProductId: vendorToProductId })}.`, "ProductsService-MongoDB");
            let result: ProductVideo[] = [];

            for (let video of videos) {
                let base64Content = await this.mongoDBDatabaseService.getFileBase64(video.videoContent, bucket);
                result.push({
                    videoId: video.videoId,
                    vendorToProductId: video.vendorToProductId,
                    videoContent: base64Content,
                } as ProductVideo);
            }

            await mongoose.disconnect()
            return result;
        }
        catch (err) {
            await mongoose.disconnect();
            throw err;
        }
    }

    /**
     * Removes images for the given vendor's product ID.
     * @param vendorToProductId The vendor's product ID.
     */
    public async removeProductImages(vendorToProductId: number): Promise<void> {
        await mongoose.connect(process.env.MONGODB_URI, { dbName: process.env.MONGODB_DATABASE });
        let ProductImage = mongoose.model<IProductImage>("ProductImage", productImageSchema, "ProductImage");

        try {
            let images = await ProductImage.find({ vendorToProductId: vendorToProductId });
            this.loggerService.logInfo(`Fetched ProductImage with data ${JSON.stringify({ vendorToProductId: vendorToProductId })}.`, "ProductsService-MongoDB");

            for (let image of images) {
                await this.removeProductImage(image.pictureId);
            }

            await mongoose.disconnect();
        }
        catch (err) {
            await mongoose.disconnect();
            throw err;
        }
    }

    /**
     * Removes the given image.
     * @param imageId The image ID.
     */
    public async removeProductImage(imageId: number): Promise<void> {
        let connection = await mongoose.connect(process.env.MONGODB_URI, { dbName: process.env.MONGODB_DATABASE });
        let ProductImage = mongoose.model<IProductImage>("ProductImage", productImageSchema, "ProductImage");

        try {
            let imageToDelete = await ProductImage.findOne({ pictureId: imageId });
            this.loggerService.logInfo(`Fetched ProductImage with ID '${imageId}'.`, "ProductsService-MongoDB");
            let imagesBucket = new mongoose.mongo.GridFSBucket(connection.connection.db, { bucketName: process.env.IMAGES_BUCKET_NAME });
            await imagesBucket.delete(imageToDelete.imageContent);
            this.loggerService.logInfo(`Deleted content from bucket '${process.env.IMAGES_BUCKET_NAME}'.`, "ProductsService-MongoDB");
            await this.mongoDBDatabaseService.deleteMongoDBEntryByAttribute(ProductImage, "pictureId", imageToDelete.pictureId);
            await mongoose.disconnect();
        }
        catch (err) {
            await mongoose.disconnect();
            throw err;
        }
    }

    /**
     * Removes videos for the given vendor's product ID.
     * @param vendorToProductId The vendor's product ID.
     */
    public async removeProductVideos(vendorToProductId: number): Promise<void> {
        await mongoose.connect(process.env.MONGODB_URI, { dbName: process.env.MONGODB_DATABASE });
        let ProductVideo = mongoose.model<IProductVideo>("ProductVideo", productVideoSchema, "ProductVideo");

        try {
            let videos = await ProductVideo.find({ vendorToProductId: vendorToProductId });
            this.loggerService.logInfo(`Fetched ProductVideo with data ${JSON.stringify({ vendorToProductId: vendorToProductId })}.`, "ProductsService-MongoDB");

            for (let video of videos) {
                await this.removeProductVideo(video.videoId);
            }

            await mongoose.disconnect();
        }
        catch (err) {
            await mongoose.disconnect();
            throw err;
        }
    }

    /**
     * Removes the given video.
     * @param imageId The video ID.
     */
    public async removeProductVideo(videoId: number): Promise<void> {
        let connection = await mongoose.connect(process.env.MONGODB_URI, { dbName: process.env.MONGODB_DATABASE });
        let ProductVideo = mongoose.model<IProductVideo>("ProductVideo", productVideoSchema, "ProductVideo");

        try {
            let videoToDelete = await ProductVideo.findOne({ videoId: videoId });
            this.loggerService.logInfo(`Fetched ProductVideo with ID '${videoId}'.`, "ProductsService-MongoDB");
            let videosBucket = new mongoose.mongo.GridFSBucket(connection.connection.db, { bucketName: process.env.VIDEOS_BUCKET_NAME });
            await videosBucket.delete(videoToDelete.videoContent);
            this.loggerService.logInfo(`Deleted content from bucket '${process.env.VIDEOS_BUCKET_NAME}'.`, "ProductsService-MongoDB");
            await this.mongoDBDatabaseService.deleteMongoDBEntryByAttribute(ProductVideo, "videoId", videoId);
            await mongoose.disconnect();
        }
        catch (err) {
            await mongoose.disconnect();
            throw err;
        }
    }

    /**
     * Creates a new image.
     * @param productImage The product image.
     * @param fileName The file name.
     * @param contentType The content type.
     * @param buffer The image buffer.
     * @returns The created image.
     */
    public async createProductImage(productImage: ProductImage, fileName: string, contentType: string, buffer): Promise<ProductImage> {
        let connection: Sequelize = await this.mssqlDatabaseService.initialize();
        let mongodbConnection = await mongoose.connect(process.env.MONGODB_URI, { dbName: process.env.MONGODB_DATABASE });
        let imagesBucket = new mongoose.mongo.GridFSBucket(mongodbConnection.connection.db, { bucketName: process.env.IMAGES_BUCKET_NAME });
        let ProductImage = mongoose.model<IProductImage>("ProductImage", productImageSchema, "ProductImage");

        try {
            // Check if the ID already exists
            let foundImage = await ProductImage.findOne({ 'pictureId': productImage.pictureId });
            this.loggerService.logInfo(`Fetched ProductImage with ID '${productImage.pictureId}'.`, "ProductsService-MongoDB");

            if (foundImage !== null) {
                await connection.close();
                await mongoose.disconnect();
                this.loggerService.logError(`Image with ID '${productImage.pictureId}' already exists.`, "ProductsService-MongoDB")
                throw new Error(`Image with ID '${productImage.pictureId}' already exists!`);
            }

            // Check if the product exists
            let foundProduct = await connection.models.VendorToProduct.findOne({ where: { vendorToProductId: productImage.vendorToProductId } });
            this.loggerService.logInfo(`Fetched VendorToProduct with ID '${productImage.vendorToProductId}'.`, "ProductsService-MSSQL");

            if (foundProduct == null) {
                await connection.close();
                await mongoose.disconnect();
                this.loggerService.logError(`Vendor's product with ID '${productImage.vendorToProductId}' does not exist.`, "ProductsService")
                throw new Error(`Vendor's product with ID '${productImage.vendorToProductId}' does not exist!`);
            }

            let fileId: ObjectId = await new Promise((resolve, reject) => {
                const uploadStream = imagesBucket.openUploadStream(fileName, {
                    contentType: contentType,
                });
                uploadStream.end(buffer);
                uploadStream.on("finish", (file) => resolve(file._id));
                uploadStream.on("error", (err) => reject(err));
            });
            this.loggerService.logInfo(`Uploaded content to bucket '${process.env.IMAGES_BUCKET_NAME}'.`, "ProductsService-MongoDB");

            let newImage = new ProductImage({
                pictureId: productImage.pictureId,
                vendorToProductId: productImage.vendorToProductId,
                imageContent: fileId,
            });
            await newImage.save();
            this.loggerService.logInfo(`Created ProductImage with ID '${newImage.pictureId}'.`, "ProductsService-MongoDB");
            await connection.close();
            await mongoose.disconnect();
            return productImage;
        }
        catch (err) {
            await connection.close();
            await mongoose.disconnect();
            throw err;
        }
    }

    /**
     * Creates a new video.
     * @param productVideo The product video.
     * @param fileName The file name.
     * @param contentType The content type.
     * @param buffer The video buffer.
     * @returns The created video.
     */
    public async createProductVideo(productVideo: ProductVideo, fileName: string, contentType: string, buffer): Promise<ProductVideo> {
        let connection: Sequelize = await this.mssqlDatabaseService.initialize();
        let mongodbConnection = await mongoose.connect(process.env.MONGODB_URI, { dbName: process.env.MONGODB_DATABASE });
        let videosBucket = new mongoose.mongo.GridFSBucket(mongodbConnection.connection.db, { bucketName: process.env.VIDEOS_BUCKET_NAME });
        let ProductVideo = mongoose.model<IProductVideo>("ProductVideo", productVideoSchema, "ProductVideo");

        try {
            // Check if the ID already exists
            let foundVideo = await ProductVideo.findOne({ 'videoId': productVideo.videoId });
            this.loggerService.logInfo(`Fetched ProductVideo with ID '${productVideo.videoId}'.`, "ProductsService-MongoDB");

            if (foundVideo !== null) {
                await connection.close();
                await mongoose.disconnect();
                this.loggerService.logError(`Video with ID '${productVideo.videoId}' already exists.`, "ProductsService-MongoDB")
                throw new Error(`Video with ID '${productVideo.videoContent}' already exists!`);
            }

            // Check if the product exists
            let foundProduct = await connection.models.VendorToProduct.findOne({ where: { vendorToProductId: productVideo.vendorToProductId } });
            this.loggerService.logInfo(`Fetched VendorToProduct with ID '${productVideo.vendorToProductId}'.`, "ProductsService-MSSQL");

            if (foundProduct == null) {
                await connection.close();
                await mongoose.disconnect();
                this.loggerService.logError(`Vendor's product with ID '${productVideo.vendorToProductId}' does not exist.`, "ProductsService")
                throw new Error(`Vendor's product with ID '${productVideo.vendorToProductId}' does not exist!`);
            }

            let fileId: ObjectId = await new Promise((resolve, reject) => {
                const uploadStream = videosBucket.openUploadStream(fileName, {
                    contentType: contentType,
                });
                uploadStream.end(buffer);
                uploadStream.on("finish", (file) => resolve(file._id));
                uploadStream.on("error", (err) => reject(err));
            });
            this.loggerService.logInfo(`Uploaded content to bucket '${process.env.VIDEOS_BUCKET_NAME}'.`, "ProductsService-MongoDB");

            let newVideo = new ProductVideo({
                videoId: productVideo.videoId,
                vendorToProductId: productVideo.vendorToProductId,
                videoContent: fileId,
            });
            await newVideo.save();
            this.loggerService.logInfo(`Created ProductVideo with ID '${newVideo.videoId}'.`, "ProductsService-MongoDB");
            await connection.close();
            await mongoose.disconnect();
            return productVideo;
        }
        catch (err) {
            await connection.close();
            await mongoose.disconnect();
            throw err;
        }
    }

    /**
     * Updates the given video.
     * @param productVideo The product video.
     * @param fileName The file name.
     * @param contentType The content type.
     * @param buffer The video buffer.
     * @returns The updated video.
     */
    public async updateVideo(productVideo: ProductVideo, fileName: string, contentType: string, buffer): Promise<ProductVideo> {
        try {
            await this.removeProductVideos(productVideo.vendorToProductId);
            await this.createProductVideo(productVideo, fileName, contentType, buffer);
            return productVideo;
        }
        catch (err) {
            throw err;
        }
    }

    /**
     * Updates the given image.
     * @param productImage The product image.
     * @param fileName The file name.
     * @param contentType The content type.
     * @param buffer The image buffer.
     * @returns The updated image.
     */
    public async updateImage(productImage: ProductImage, fileName: string, contentType: string, buffer): Promise<ProductImage> {
        try {
            await this.removeProductImages(productImage.vendorToProductId);
            await this.createProductImage(productImage, fileName, contentType, buffer);
            return productImage;
        }
        catch (err) {
            throw err;
        }
    }
}