import { injectable } from 'inversify';
import 'reflect-metadata';
import { DataTypes, Sequelize } from "sequelize";
import { Customer } from '../../models/customer.model';
import { ShoppingCart } from '../../models/shopping.cart.model';
import { Address } from '../../models/address.model';
import { CustomerToAddress } from '../../models/customer.to.address.model';
import { ProductInformation } from '../../models/product.information.model';
import { VendorToProduct } from '../../models/vendor.to.product.model';
import { Product } from '../../models/product.model';
import { Category } from '../../models/category.model';
import {Category as CategoryNeo4j} from '../../models/neo4j.models/category.neo4j.model';
import {Product as ProductNeo4j} from '../../models/neo4j.models/product.neo4j.model';
import { Vendor } from '../../models/vendor.model';
import { VendorInformation } from '../../models/vendor.information.model';
import { ProductToCart } from '../../models/product.to.cart.model';
import { SupplierInformation } from '../../models/supplier.information.model';
import { Supplier } from '../../models/supplier.model';
import { CustomerOrder } from '../../models/customer.order.model';
import sequelize = require('sequelize');
import { OrderPosition } from '../../models/order.position.model';
import { SupplierToAddress } from '../../models/supplier.to.address.model';
import { Op } from 'sequelize';
import neo4j, { Driver, Node, Relationship } from 'neo4j-driver'
import { ProductRecommendation } from '../../models/product.recommendation.model';
import * as mongoose from "mongoose";
import { MongoClient } from 'mongodb';
import { IProductRecommendation } from '../../models/mongodb.models/mongodb.interfaces/product.recommendation.mongodb.interface';
import recommendationSchema from '../../models/mongodb.models/mongodb.schemas/product.recommendation.mongodb.schema';
import { Review } from '../../models/review.model';

/**
 * The admin service.
 */
@injectable()
export class AdminService {
    public async connectToMssql(): Promise<Sequelize>{
        return new Promise<Sequelize>(function(resolve, reject){
            let sequelize = new Sequelize(
                String(process.env.MSSQL_DB),
                String(process.env.MSSQL_USER),
                String(process.env.MSSQL_PASSWORD),
                {
                  host: String(process.env.MSSQL_HOST),
                  dialect: "mssql",
                  ssl: false,
                  password: String(process.env.MSSQL_PASSWORD),
                  port: Number(process.env.MSSQL_PORT)
                }
              );

            sequelize.authenticate().then(() => {
                resolve(sequelize);
            }).catch((err) => {
                reject(err);
            })
        });
    }

    public async getNewId(entityName: string, attributeName: string): Promise<Number>{
        let connection: Sequelize = await this.intializeMSSQL();

        try{
            let id = await connection.models[entityName].max(attributeName);
            await connection.close();

            if (id == null){
                return 0;
            }

            await connection.close();
            return Number(id) + 1;
        }
        catch (err){
            await connection.close();
            throw err;
        }
    }

    public async getNewIdMongoDB(entityName: string, attributeName: string): Promise<Number>{
        await mongoose.connect(process.env.MONGODB_URI, {dbName: process.env.MONGODB_DATABASE});
        let doc = await mongoose.connection.db.collection(entityName).findOne({[attributeName]: {$exists: true}});

        if (doc == null){
            await mongoose.disconnect();
            return 0;
        }

        let foundDocument = await mongoose.connection.db.collection(entityName).find().sort({[attributeName]:-1}).limit(1).next(); 
        await mongoose.disconnect();
        return foundDocument[attributeName] + 1;
    }

    public async doesNameExist(name: string): Promise<boolean>{
        let connection: Sequelize = await this.intializeMSSQL();

        try{
            let supplier = await connection.models.Supplier.findOne({where: {name: name}});
            await connection.close();
            return supplier !== null;
        }
        catch (err){
            await connection.close();
            throw err;
        }
    }

    public async createNewSupplier(supplier: Supplier): Promise<Supplier>{
        let connection: Sequelize = await this.intializeMSSQL();

        try{
            let foundSupplier = await connection.models.Supplier.findByPk(supplier.supplierId);

            if (foundSupplier !== null){
                await connection.close();
                throw new Error(`Supplier with ID ${supplier.supplierId} already exists!`);
            }

            let created = await connection.models.Supplier.create(supplier as any);
            let createdConverted = created.dataValues as Supplier;
            await connection.close();
            return createdConverted;
        }
        catch (err){
            await connection.close();
            throw err;
        }    
    }

    public async createNewAddress(address: Address): Promise<Address>{
        let connection: Sequelize = await this.intializeMSSQL();

        try{
            let foundAddressByPk = await connection.models.Address.findByPk(address.addressId);

            if (foundAddressByPk !== null){
                await connection.close();
                throw new Error(`Address with ID ${address.addressId} already exists!`);
            }

            let whereClause = {street: address.street, city: address.city, postalCode: address.postalCode, country: address.country};
            let foundAddress = await connection.models.Address.findOne({where: whereClause});

            if (foundAddress !== null){
                await connection.close();
                throw new Error(`Address with the given data already exists!`);
            }

            let created = await connection.models.Address.create(address as any);
            let createdConverted = created.dataValues as Address;
            await connection.close();
            return createdConverted;
        }
        catch (err){
            await connection.close();
            throw err;
        }  
    }

    public async createNewSupplierAddress(address: Address, supplier: Supplier): Promise<Address>{
        let connection: Sequelize = await this.intializeMSSQL();

        try{
            let foundAddress = await connection.models.Address.findByPk(address.addressId);

            if (foundAddress !== null){
                await connection.close();
                throw new Error(`Address with ID ${address.addressId} already exists!`);
            }

            let whereClause = {street: address.street, city: address.city, postalCode: address.postalCode, country: address.country};
            let existingAddress = await connection.models.Address.findOne({where: whereClause});

            if (existingAddress !== null){
                let createdReference = await this.createNewSupplierAddressReference(existingAddress.dataValues as Address, supplier);
                await connection.close();
                return existingAddress.dataValues as Address;
            }

            let newAddress = await this.createNewAddress(address);
            let createdReference = await this.createNewSupplierAddressReference(newAddress, supplier);
            let createdConverted  = newAddress;
            await connection.close();
            return createdConverted;
        }
        catch (err){
            await connection.close();
            throw err;
        }  
    }

    public async createNewSupplierAddressReference(address: Address, supplier: Supplier): Promise<SupplierToAddress>{
        let connection: Sequelize = await this.intializeMSSQL();

        try{
            let whereClause = {supplierId: supplier.supplierId, addressId: address.addressId};
            let foundAddress = await connection.models.SupplierToAddress.findOne({where: whereClause});

            if (foundAddress !== null){
                await connection.close();
                throw new Error(`Supplier address reference with address ID ${address.addressId} and supplier ID ${supplier.supplierId} already exists!`);
            }


            let newId = await this.getNewId("SupplierToAddress", "SupplierToAddressId");
            let supplierToAddress = {supplierToAddressId: newId, addressId: address.addressId, supplierId: supplier.supplierId} as SupplierToAddress;
            let created = await connection.models.SupplierToAddress.create(supplierToAddress as any);
            let createdConverted = created.dataValues as SupplierToAddress;
            await connection.close();
            return createdConverted;
        }
        catch (err){
            await connection.close();
            throw err;
        }  
    }

    public async updateSupplierAddress(address: Address, supplier: Supplier): Promise<Address>{
        let connection: Sequelize = await this.intializeMSSQL();

        try{
            await connection.models.SupplierToAddress.destroy({where: {addressId: address.addressId, supplierId: supplier.supplierId}});
            let whereClause = {street: address.street, city: address.city, postalCode: address.postalCode, country: address.country};
            let existingAddress = await connection.models.Address.findOne({where: whereClause});
            let addressToReturn: Address = null;

            if (existingAddress !== null){
                let createdReference = await this.createNewSupplierAddressReference(existingAddress.dataValues as Address, supplier);
                addressToReturn = existingAddress.dataValues as Address;
            } else{
                let newId = await this.getNewId("Address", "AddressId");
                let addressTocreate = {addressId: newId, street: address.street, city: address.city, postalCode: address.postalCode, country: address.country} as Address;
                let newAddress = await this.createNewAddress(addressTocreate);
                let createdReference = await this.createNewSupplierAddressReference(newAddress, supplier);
                addressToReturn = newAddress;
            }

            // Delete old address if no existing references
            let foundCustomerReference = connection.models.CustomerToAddress.findOne({where: {addressId: address.addressId}});
            let foundVendorReference = connection.models.VendorToAddress.findOne({where: {addressId: address.addressId}});
            let foundSupplierReference = connection.models.SupplierToAddress.findOne({where: {addressId: address.addressId}});
            let foundDeliveryReference = connection.models.OrderPosition.findOne({where: {deliveryAddressId: address.addressId}});
            let foundOrderReference = connection.models.CustomerOrder.findOne({where: {billingAddressId: address.addressId}});

            let foundCustomerResult = await foundCustomerReference;

            if (foundCustomerResult !== null){
                await connection.close();
                return addressToReturn;
            }

            let foundVendorResult = await foundVendorReference;

            if (foundVendorResult !== null){
                await connection.close();
                return addressToReturn;
            }

            let foundSupplierResult = await foundSupplierReference;

            if (foundSupplierResult !== null){
                await connection.close();
                return addressToReturn;
            }

            let foundDeliveryResult = await foundDeliveryReference;

            if (foundDeliveryResult !== null){
                await connection.close();
                return addressToReturn;
            }

            let foundOrderResult = await foundOrderReference;

            if (foundOrderResult !== null){
                await connection.close();
                return addressToReturn;
            }

            await connection.models.Address.destroy({where: {addressId: address.addressId}});
            await connection.close();
            return addressToReturn;
        }
        catch (err){
            await connection.close();
            throw err;
        }  
    }

    public async updateExistingSupplier(supplier: Supplier, supplierId: number): Promise<Supplier>{
        let connection: Sequelize = await this.intializeMSSQL();

        try{
            if (supplier.supplierId !== supplierId){
                await connection.close();
                throw new Error(`IDs ${supplierId} and ${supplier.supplierId} do not match!`)
            }

            let foundSupplier = await connection.models.Supplier.findByPk(supplier.supplierId);

            if (foundSupplier == null){
                await connection.close();
                throw new Error(`Supplier with ID ${supplier.supplierId} does not exist!`);
            }

            await connection.models.Supplier.update(supplier, {where: {supplierId: supplierId}});
            await connection.close();
            return supplier;
        }
        catch (err){
            await connection.close();
            throw err;
        }    
    }

    public async deleteSupplierAddresses(addressIds: Array<number>, supplierId: number): Promise<void>{
        try{
            for (let addressId of addressIds){
                await this.deleteSupplierAddress(addressId, supplierId);
            }
        }
        catch (err){
            throw err;
        }  
    }

    public async deleteSupplierAddress(addressId: number, supplierId: number): Promise<void>{
        let connection: Sequelize = await this.intializeMSSQL();

        try{
            await connection.models.SupplierToAddress.destroy({where: {addressId: addressId, supplierId: supplierId}});

            // Delete old address if no existing references
            let foundCustomerReference = connection.models.CustomerToAddress.findOne({where: {addressId: addressId}});
            let foundVendorReference = connection.models.VendorToAddress.findOne({where: {addressId: addressId}});
            let foundSupplierReference = connection.models.SupplierToAddress.findOne({where: {addressId: addressId}});
            let foundDeliveryReference = connection.models.OrderPosition.findOne({where: {deliveryAddressId: addressId}});
            let foundOrderReference = connection.models.CustomerOrder.findOne({where: {billingAddressId: addressId}});

            let foundCustomerResult = await foundCustomerReference;

            if (foundCustomerResult !== null){
                await connection.close();
                return;
            }

            let foundVendorResult = await foundVendorReference;

            if (foundVendorResult !== null){
                await connection.close();
                return;
            }

            let foundSupplierResult = await foundSupplierReference;

            if (foundSupplierResult !== null){
                await connection.close();
                return;
            }

            let foundDeliveryResult = await foundDeliveryReference;

            if (foundDeliveryResult !== null){
                await connection.close();
                return;
            }

            let foundOrderResult = await foundOrderReference;

            if (foundOrderResult !== null){
                await connection.close();
                return;
            }

            await connection.models.Address.destroy({where: {addressId: addressId}});
            await connection.close();
            return;
        }
        catch (err){
            await connection.close();
            throw err;
        }  
    }

    public async createCategory(category: Category): Promise<Category>{
        let connection: Sequelize = await this.intializeMSSQL();
        let driver = await this.initializeNeo4j();
        let session = driver.session();

        try{
            // Check if the category exists in MSSQL
            let foundCategory = await connection.models.Category.findOne({where: {categoryId: category.categoryId}});

            if (foundCategory !== null){
                await connection.close();
                await session.close();
                throw new Error(`Category with ID ${category.categoryId} already exists!`);
            }

            // Check if the category exists in Neo4j
            let response = await session.executeRead(tx => tx.run<CategoryNeo4j>(
                "MATCH (c:Category{CategoryId: $categoryId}) return c"
            , {categoryId: category.categoryId}));

            if (response.records.length > 0){
                await connection.close();
                await session.close();
                throw new Error(`Category with ID ${category.categoryId} already exist!`);
            }

            // Check if the category exists by name in MSSQL
            let foundCategoryByName = await connection.models.Category.findOne({where:  {name: category.name}});

            if (foundCategoryByName !== null){
                await connection.close();
                await session.close();
                throw new Error(`Category with name '${category.name}' already exists!`);
            }

            // Check if the category exists by name in Neo4j
            let responseByName = await session.executeRead(tx => tx.run<CategoryNeo4j>(
                "MATCH (c:Category{Name: $name}) return c"
            , {name: category.name}));

            if (responseByName.records.length > 0){
                await connection.close();
                await session.close();
                throw new Error(`Category with name '${category.name}' already exists!`);
            }
            
            // Create the category in MSSQL and Neo4j
            await connection.models.Category.create(category as any);
            await session.executeWrite(tx => tx.run("CREATE (c:Category{CategoryId: TOINTEGER($categoryId), Name: $name})", {categoryId: category.categoryId, name: category.name}));
            await connection.close();
            await session.close();
            return category;
        }
        catch (err){
            await connection.close();
            await session.close();
            throw err;
        }  
    }

    public async updateCategory(categoryId: number, categoryData: Category): Promise<Category>{
        let connection: Sequelize = await this.intializeMSSQL();
        let driver = await this.initializeNeo4j();
        let session = driver.session();

        try{
            if (categoryId != categoryData.categoryId){
                await connection.close();
                await session.close();
                throw new Error("categoryId and categoryData.categoryId do not match!");
            }

            // Check if the category exists in MSSQL
            let foundCategory = await connection.models.Category.findOne({where: {categoryId: categoryId}});

            if (foundCategory == null){
                await connection.close();
                await session.close();
                throw new Error(`Category with ID ${categoryData.categoryId} does not exist!`);
            }

            // Check if the category exists in Neo4j
            let response = await session.executeRead(tx => tx.run<CategoryNeo4j>(
                "MATCH (c:Category{CategoryId: $categoryId}) return c"
            , {categoryId: categoryData.categoryId}));

            if (response.records.length === 0){
                await connection.close();
                await session.close();
                throw new Error(`Category with ID ${categoryData.categoryId} does not exist!`);
            }

            // Check if other category exists by name in MSSQL
            let foundCategoryByName = await connection.models.Category.findOne({where:  {name: categoryData.name, categoryId: {[Op.ne]: categoryId}}});

            if (foundCategoryByName !== null){
                await connection.close();
                await session.close();
                throw new Error(`Category with name '${categoryData.name}' already exists!`);
            }

            // Check if other category exists by name in Neo4j
            let responseByName = await session.executeRead(tx => tx.run<CategoryNeo4j>(
                "MATCH (c:Category) WHERE c.Name = $name AND c.CategoryId <> $categoryId RETURN c"
            , {name: categoryData.name, categoryId: categoryId}));

            if (responseByName.records.length > 0){
                await connection.close();
                await session.close();
                throw new Error(`Category with name '${categoryData.name}' already exists!`);
            }
            
            await connection.models.Category.update({name: categoryData.name}, {where: {categoryId: categoryId}});
            await session.executeWrite(tx => tx.run<CategoryNeo4j>(
                "MATCH (c:Category{CategoryId: $categoryId}) SET c.Name = $name RETURN c"
            , {name: categoryData.name, categoryId: categoryId}));
            await connection.close();
            await session.close();
            return categoryData;
        }
        catch (err){
            await connection.close();
            await session.close();
            throw err;
        }  
    }

    public async deleteCategory(categoryId: number): Promise<void>{
        let connection: Sequelize = await this.intializeMSSQL();
        let driver = await this.initializeNeo4j();
        let session = driver.session();

        try{
            // Check if the category is referenced
            let foundReferenceResponse = await session.executeRead(tx => tx.run<ProductNeo4j>(
                "MATCH (p:Product)-[h:HAS_CATEGORY]->(c:Category{CategoryId: $categoryId}) RETURN p"
            , {categoryId: categoryId}));

            if (foundReferenceResponse.records.length > 0){
                await connection.close();
                await session.close();
                throw new Error(`Category with ID ${categoryId} is referenced and cannot be deleted!`);
            }

            // Delete the category
            await connection.models.Category.destroy({where: {categoryId: categoryId}});
            await session.executeWrite(tx => tx.run("MATCH (c:Category{CategoryId: $categoryId}) DELETE c", {categoryId: categoryId}));
            await connection.close();
            await session.close();
        }
        catch (err){
            await connection.close();
            await session.close();
            throw err;
        } 
    }

    public async createProductRecommendation(productRecommendation: ProductRecommendation): Promise<ProductRecommendation>{
        let connection: Sequelize = await this.intializeMSSQL();
        await mongoose.connect(process.env.MONGODB_URI, {dbName: process.env.MONGODB_DATABASE});
        let ProductRecommendation = mongoose.model<IProductRecommendation>("ProductRecommendation", recommendationSchema, "ProductRecommendation");

        try{
            // Check if the ID already exists
            let foundRecommendation = await ProductRecommendation.findOne({'recommendationId': productRecommendation.recommendationId});

            if (foundRecommendation !== null){
                await connection.close();
                await mongoose.disconnect();
                throw new Error(`Product recommendation with ID ${productRecommendation.recommendationId} already exists!`);
            }

            // Check if the customer exists
            let foundCustomer = await connection.models.Customer.findOne({where: {customerId: productRecommendation.customerId}});

            if (foundCustomer == null){
                await connection.close();
                await mongoose.disconnect();
                throw new Error(`Customer with ID ${productRecommendation.customerId} does not exist!`);
            }

            // Check if the product exists
            let foundProduct = await connection.models.VendorToProduct.findOne({where: {vendorToProductId: productRecommendation.vendorToProductId}});

            if (foundProduct == null){
                await connection.close();
                await mongoose.disconnect();
                throw new Error(`Vendor's product with ID ${productRecommendation.vendorToProductId} does not exist!`);
            }

            let toInsert = new ProductRecommendation({
                recommendationId: productRecommendation.recommendationId,
                customerId: productRecommendation.customerId,
                vendorToProductId: productRecommendation.vendorToProductId,
                purchaseProbability: productRecommendation.purchaseProbability,
                recommendationDate: productRecommendation.recommendationDate
            });

            await toInsert.save();
            await connection.close();
            await mongoose.disconnect();
            return productRecommendation;
        }
        catch (err){
            await connection.close();
            await mongoose.disconnect();
            throw err;
        } 
    }

    public async updateProductRecommendation(recommendationId: number, productRecommendation: ProductRecommendation): Promise<ProductRecommendation>{
        let connection: Sequelize = await this.intializeMSSQL();
        await mongoose.connect(process.env.MONGODB_URI, {dbName: process.env.MONGODB_DATABASE});
        let ProductRecommendation = mongoose.model<IProductRecommendation>("ProductRecommendation", recommendationSchema, "ProductRecommendation");

        try{
            // Check if IDs match
            if (recommendationId !== productRecommendation.recommendationId){
                await connection.close();
                await mongoose.disconnect();
                throw new Error(`recommendationId and productRecommendation.recommendationId do not match!`);
            }

            // Check if the ID exists
            let foundRecommendation = await ProductRecommendation.findOne({'recommendationId': productRecommendation.recommendationId});

            if (foundRecommendation == null){
                await connection.close();
                await mongoose.disconnect();
                throw new Error(`Product recommendation with ID ${productRecommendation.recommendationId} does not exist!`);
            }

            // Check if the customer exists
            let foundCustomer = await connection.models.Customer.findOne({where: {customerId: productRecommendation.customerId}});

            if (foundCustomer == null){
                await connection.close();
                await mongoose.disconnect();
                throw new Error(`Customer with ID ${productRecommendation.customerId} does not exist!`);
            }

            // Check if the product exists
            let foundProduct = await connection.models.VendorToProduct.findOne({where: {vendorToProductId: productRecommendation.vendorToProductId}});

            if (foundProduct == null){
                await connection.close();
                await mongoose.disconnect();
                throw new Error(`Vendor's product with ID ${productRecommendation.vendorToProductId} does not exist!`);
            }

            // Update the data
            await ProductRecommendation.findOneAndUpdate({recommendationId: productRecommendation.recommendationId},
                {customerId: productRecommendation.customerId, vendorToProductId: productRecommendation.vendorToProductId,
                    purchaseProbability: productRecommendation.purchaseProbability
                }
            );
            await connection.close();
            await mongoose.disconnect();
            return productRecommendation;
        }
        catch (err){
            await connection.close();
            await mongoose.disconnect();
            throw err;
        } 
    }

    public async deleteMongoDBEntryByAttribute(mongooseModel: mongoose.Model<any>, attributeName: string, attributeValue): Promise<void>{
        await mongoose.connect(process.env.MONGODB_URI, {dbName: process.env.MONGODB_DATABASE});

        try{
            // Remove the data
            await mongooseModel.findOneAndDelete({[attributeName]: attributeValue});
            await mongoose.disconnect();
        }
        catch (err){
            await mongoose.disconnect();
            throw err;
        } 
    }

    public async intializeMSSQL(): Promise<Sequelize>{
        return new Promise<Sequelize>((resolve, reject) => {
            this.connectToMssql().then((sequelize) => {
                this.defineModels(sequelize).then((sequelize) => {
                    resolve(sequelize);
                })
                .catch((err) => {
                    reject(err);
                })
            }).catch((err) => {
                reject(err);
            })
        });
    }

    public async initializeNeo4j(): Promise<Driver>{
        return new Promise<Driver>((resolve, reject) => {
            try{
            let driver = neo4j.driver(
                process.env.NEO4J_URI,
                neo4j.auth.basic(process.env.NEO4J_USERNAME, process.env.NEO4J_PASSWORD)
            );
            resolve(driver);
            } catch (err){
                reject(err);
            }
        });
    }

    private async defineModels(sequelize: Sequelize): Promise<Sequelize>{
        return new Promise<Sequelize>((resolve, reject) => {
            sequelize.define("Address",
                {
                    addressId: {
                        type: DataTypes.INTEGER,
                        allowNull: false,
                        primaryKey: true
                    },
                    street: {
                        type: DataTypes.STRING,
                        allowNull: false
                    },
                    city: {
                        type: DataTypes.STRING,
                        allowNull: false
                    },
                    postalCode: {
                        type: DataTypes.STRING,
                        allowNull: false
                    },
                    country: {
                        type: DataTypes.INTEGER,
                        allowNull: false
                    }
                },
                {
                    tableName: "Address",
                    modelName: "Address",
                    createdAt: false,
                    updatedAt: false
                }
            );

            sequelize.define("CustomerToAddress",
                {
                    customerToAddressId: {
                        type: DataTypes.INTEGER,
                        allowNull: false,
                        primaryKey: true

                    },
                    customerId: {
                        type: DataTypes.INTEGER,
                        allowNull: false,
                    },
                    addressId:{
                        type: DataTypes.INTEGER,
                        allowNull: false
                    }
                },
                {
                    tableName: "CustomerToAddress",
                    modelName: "CustomerToAddress",
                    createdAt: false,
                    updatedAt: false
                }
            );

            sequelize.define("VendorToAddress",
                {
                    vendorToAddressId: {
                        type: DataTypes.INTEGER,
                        allowNull: false,
                        primaryKey: true

                    },
                    vendorId: {
                        type: DataTypes.INTEGER,
                        allowNull: false,
                    },
                    addressId:{
                        type: DataTypes.INTEGER,
                        allowNull: false
                    }
                },
                {
                    tableName: "VendorToAddress",
                    modelName: "VendorToAddress",
                    createdAt: false,
                    updatedAt: false
                }
            );

            sequelize.define("SupplierToAddress",
                {
                    supplierToAddressId: {
                        type: DataTypes.INTEGER,
                        allowNull: false,
                        primaryKey: true

                    },
                    supplierId: {
                        type: DataTypes.INTEGER,
                        allowNull: false,
                    },
                    addressId:{
                        type: DataTypes.INTEGER,
                        allowNull: false
                    }
                },
                {
                    tableName: "SupplierToAddress",
                    modelName: "SupplierToAddress",
                    createdAt: false,
                    updatedAt: false
                }
            );

            sequelize.define("OrderPosition",
                {
                    orderPositionId: {
                        type: DataTypes.INTEGER,
                        allowNull: false,
                        primaryKey: true
                    },
                    orderId: {
                        type: DataTypes.INTEGER,
                        allowNull: false,
                    },
                    amount:{
                        type: DataTypes.INTEGER,
                        allowNull: true
                    },
                    vendorToProductId: {
                        type: DataTypes.INTEGER,
                        allowNull: false
                    },
                    supplierCompanyId: {
                        type: DataTypes.INTEGER,
                        allowNull: false
                    },
                    deliveryDate: {
                        type: DataTypes.DATE,
                        allowNull: false
                    },
                    deliveryAddressId: {
                        type: DataTypes.INTEGER,
                        allowNull: false
                    }
                },
                {
                    tableName: "OrderPosition",
                    modelName: "OrderPosition",
                    createdAt: false,
                    updatedAt: false
                }
            );

            sequelize.define("CustomerOrder",
                {
                    orderId: {
                        type: DataTypes.INTEGER,
                        allowNull: false,
                        primaryKey: true

                    },
                    orderName: {
                        type: DataTypes.STRING,
                        allowNull: true
                    },
                    orderDate:{
                        type: DataTypes.DATE,
                        allowNull: false
                    },
                    customerId: {
                        type: DataTypes.INTEGER,
                        allowNull: false
                    },
                    billingAddressId: {
                        type: DataTypes.INTEGER,
                        allowNull: false
                    },
                    isPaid: {
                        type: DataTypes.BOOLEAN,
                        allowNull: false
                    }
                },
                {
                    tableName: "CustomerOrder",
                    modelName: "CustomerOrder",
                    createdAt: false,
                    updatedAt: false
                }
            );

            sequelize.define("Supplier",
                {
                    supplierId: {
                        type: DataTypes.INTEGER,
                        allowNull: false,
                        primaryKey: true

                    },
                    name: {
                        type: DataTypes.STRING,
                        allowNull: false
                    },
                    email: {
                        type: DataTypes.STRING,
                        allowNull: false
                    },
                    phoneNumber: {
                        type: DataTypes.STRING,
                        allowNull: false
                    }
                },
                {
                    tableName: "Supplier",
                    modelName: "Supplier",
                    createdAt: false,
                    updatedAt: false
                }
            );

            sequelize.define("Category",
                {
                    categoryId: {
                        type: DataTypes.INTEGER,
                        allowNull: false,
                        primaryKey: true

                    },
                    name: {
                        type: DataTypes.STRING,
                        allowNull: false
                    }
                },
                {
                    tableName: "Category",
                    modelName: "Category",
                    createdAt: false,
                    updatedAt: false
                }
            );

            sequelize.define("VendorToProduct",
                {
                    vendorToProductId: {
                        type: DataTypes.INTEGER,
                        allowNull: false,
                        primaryKey: true

                    },
                    vendorId: {
                        type: DataTypes.INTEGER,
                        allowNull: false
                    },
                    productId:{
                        type: DataTypes.INTEGER,
                        allowNull: false
                    },
                    unitPriceEuro:{
                        type: DataTypes.DECIMAL,
                        allowNull: false
                    },
                    inventoryLevel:{
                        type: DataTypes.INTEGER,
                        allowNull: false
                    }
                },
                {
                    tableName: "VendorToProduct",
                    modelName: "VendorToProduct",
                    createdAt: false,
                    updatedAt: false
                }
            );

            sequelize.define("Customer",
                {
                    customerId: {
                        type: DataTypes.INTEGER,
                        allowNull: false,
                        primaryKey: true
                    },
                    userName: {
                        type: DataTypes.STRING,
                        allowNull: false
                    },
                    firstName: {
                        type: DataTypes.STRING,
                        allowNull: false
                    },
                    lastName: {
                        type: DataTypes.STRING,
                        allowNull: false
                    },
                    email: {
                        type: DataTypes.STRING,
                        allowNull: false
                    },
                    password: {
                        type: DataTypes.STRING,
                        allowNull: false
                    },
                    phoneNumber: {
                        type: DataTypes.STRING,
                        allowNull: false
                    }
                },
                {
                    tableName: "Customer",
                    modelName: "Customer",
                    createdAt: false,
                    updatedAt: false
                }
            );

            resolve(sequelize);
        })
    }
}