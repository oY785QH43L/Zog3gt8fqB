import 'reflect-metadata';
import { inject, injectable } from 'inversify';
import { LoggerService } from './logger.service';
import mongoose from 'mongoose';


@injectable()
/**
 * The MongoDB database service.
 */
export class MongoDbDatabaseService {
    /**
     * Initializes the MongoDB database service.
     * @param loggerService The logger service.
     */
    constructor(@inject(LoggerService.name) private loggerService: LoggerService) { }

    /**
     * Generates a new ID for the given attribute in the given entity.
     * @param entityName The entity name.
     * @param attributeName The attribute name.
     * @returns New ID.
     */
    public async getNewId(entityName: string, attributeName: string): Promise<Number> {
        await mongoose.connect(process.env.MONGODB_URI, { dbName: process.env.MONGODB_DATABASE });
        let doc = await mongoose.connection.db.collection(entityName).findOne({ [attributeName]: { $exists: true } });
        let toReturn = 0;

        if (doc == null) {
            await mongoose.disconnect();
            this.loggerService.logInfo(`Generated new value for attribute '${attributeName}' in entity '${entityName}' - ${toReturn}.`, "MongoDbDatabaseService");
            return toReturn;
        }

        let foundDocument = await mongoose.connection.db.collection(entityName).find().sort({ [attributeName]: -1 }).limit(1).next();
        toReturn = Number(foundDocument[attributeName]) + 1;
        this.loggerService.logInfo(`Generated new value for attribute '${attributeName}' in entity '${entityName}' - ${toReturn}.`, "MongoDbDatabaseService");
        await mongoose.disconnect();
        return toReturn;
    }

    /**
     * Deletes the first entry from a Mongo DB entity where the given attribute equals the given value.
     * @param mongooseModel The mongoose model.
     * @param attributeName The attribute name.
     * @param attributeValue The attribute value.
     */
    public async deleteMongoDBEntryByAttribute(mongooseModel: mongoose.Model<any>, attributeName: string, attributeValue): Promise<void> {
        await mongoose.connect(process.env.MONGODB_URI, { dbName: process.env.MONGODB_DATABASE });

        try {
            // Remove the data
            await mongooseModel.findOneAndDelete({ [attributeName]: attributeValue });
            this.loggerService.logInfo(`Deleted first value ${attributeValue} in attribute '${attributeName}' in entity '${mongooseModel.modelName}'.`, "MongoDbDatabaseService");
            await mongoose.disconnect();
        }
        catch (err) {
            await mongoose.disconnect();
            throw err;
        }
    }

    /**
     * Deletes entries from a Mongo DB entity where the given attribute equals the given value.
     * @param mongooseModel The mongoose model.
     * @param attributeName The attribute name.
     * @param attributeValue The attribute value.
     */
    public async deleteMongoDBEntriesByAttribute(mongooseModel: mongoose.Model<any>, attributeName: string, attributeValue): Promise<void> {
        await mongoose.connect(process.env.MONGODB_URI, { dbName: process.env.MONGODB_DATABASE });

        try {
            // Remove the data
            await mongooseModel.deleteMany({ [attributeName]: attributeValue });
            this.loggerService.logInfo(`Deleted all values ${attributeValue} in attribute '${attributeName}' in entity '${mongooseModel.modelName}'.`, "MongoDbDatabaseService");
            await mongoose.disconnect();
        }
        catch (err) {
            await mongoose.disconnect();
            throw err;
        }
    }

    /**
     * Converts the content of the given file to a BASE64 format.
     * @param fileId The file ID.
     * @param bucket The bucket.
     * @returns The converted content.
     */
    public getFileBase64(fileId: mongoose.Types.ObjectId, bucket): Promise<string> {
        return new Promise((resolve, reject) => {
            const chunks: Buffer[] = [];
            bucket
                .openDownloadStream(fileId)
                .on("data", (chunk) => chunks.push(chunk))
                .on("error", (err) => reject(err))
                .on("end", () => {
                    const buffer = Buffer.concat(chunks);
                    resolve(buffer.toString("base64"));
                });
            this.loggerService.logInfo(`Converted file with ID '${fileId.toHexString()}' to base64.`, "MongoDbDatabaseService")
        });
    }
}