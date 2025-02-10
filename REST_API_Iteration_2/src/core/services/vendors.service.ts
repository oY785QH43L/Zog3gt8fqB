import { injectable } from 'inversify';
import 'reflect-metadata';
import { DataTypes, literal, Op, Sequelize } from 'sequelize';
import { Vendor } from '../../models/vendor.model';
import { Address } from '../../models/address.model';
import { VendorToAddress } from '../../models/vendor.to.address.model';
import { ProductInformation } from '../../models/product.information.model';
import { Product } from '../../models/product.model';
import { Category } from '../../models/category.model';
import { VendorToProduct } from '../../models/vendor.to.product.model';
import { ProductToCategory } from '../../models/product.to.category.model';
import neo4j, { Driver, Node, Relationship } from 'neo4j-driver';
import * as mongoose from "mongoose";
import { IProductRecommendation } from '../../models/mongodb.models/mongodb.interfaces/product.recommendation.mongodb.interface';
import recommendationSchema from '../../models/mongodb.models/mongodb.schemas/product.recommendation.mongodb.schema';
import { IReview } from '../../models/mongodb.models/mongodb.interfaces/review.mongodb.interface';
import reviewSchema from '../../models/mongodb.models/mongodb.schemas/review.mongodb.schema';
import { ICustomerAction } from '../../models/mongodb.models/mongodb.interfaces/customer.action.mongodb.interface';
import customerActionSchema from '../../models/mongodb.models/mongodb.schemas/customer.action.mongodb.schema';
import { IProductImage } from '../../models/mongodb.models/mongodb.interfaces/product.image.mongodb.interface';
import productImageSchema from '../../models/mongodb.models/mongodb.schemas/product.image.mongodb.schema';
import { IProductVideo } from '../../models/mongodb.models/mongodb.interfaces/product.video.mongodb.interface';
import productVideoSchema from '../../models/mongodb.models/mongodb.schemas/product.video.mongodb.schema';
import { ProductImage } from '../../models/product.image.model';
import { ObjectId } from 'mongoose';
import { ProductVideo } from '../../models/product.video.model';
import {Category as CategoryNeo4j} from '../../models/neo4j.models/category.neo4j.model';

/**
 * The vendors service.
 */
@injectable()
export class VendorsService {
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

    public async doesUsernameExist(userName: string): Promise<boolean>{
        let connection: Sequelize = await this.intializeMSSQL();

        try{
            let user = await connection.models.Vendor.findOne({where: {userName: userName}});
            await connection.close();
            return user !== null;
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

    public async createNewVendor(vendor: Vendor): Promise<Vendor>{
        let connection: Sequelize = await this.intializeMSSQL();

        try{
            let foundVendor = await connection.models.Vendor.findByPk(vendor.vendorId);

            if (foundVendor !== null){
                await connection.close();
                throw new Error(`Vendor with ID ${vendor.vendorId} already exists!`);
            }

            let created = await connection.models.Vendor.create(vendor as any);
            let createdConverted = created.dataValues as Vendor;
            await connection.close();
            return createdConverted;
        }
        catch (err){
            await connection.close();
            throw err;
        }    
    }

    public async createNewVendorAddress(address: Address, vendor: Vendor): Promise<Address>{
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
                await connection.close();
                let createdReference = await this.createNewVendorAddressReference(existingAddress.dataValues as Address, vendor);
                return existingAddress.dataValues as Address;
            }

            let newAddress = await this.createNewAddress(address);
            let createdReference = await this.createNewVendorAddressReference(newAddress, vendor);
            let createdConverted  = newAddress;
            await connection.close();
            return createdConverted;
        }
        catch (err){
            await connection.close();
            throw err;
        }  
    }

    public async createNewVendorAddressReference(address: Address, vendor: Vendor): Promise<VendorToAddress>{
        let connection: Sequelize = await this.intializeMSSQL();

        try{
            let whereClause = {vendorId: vendor.vendorId, addressId: address.addressId};
            let foundAddress = await connection.models.VendorToAddress.findOne({where: whereClause});

            if (foundAddress !== null){
                await connection.close();
                throw new Error(`Vendor address reference with address ID ${address.addressId} and vendor ID ${vendor.vendorId} already exists!`);
            }


            let newId = await this.getNewId("VendorToAddress", "VendorToAddressId");
            let vendorToAddress = {vendorToAddressId: newId, addressId: address.addressId, vendorId: vendor.vendorId} as VendorToAddress;
            let created = await connection.models.VendorToAddress.create(vendorToAddress as any);
            let createdConverted = created.dataValues as VendorToAddress;
            await connection.close();
            return createdConverted;
        }
        catch (err){
            await connection.close();
            throw err;
        }  
    }

    public async updateExistingVendor(vendor: Vendor, vendorId: number): Promise<Vendor>{
        let connection: Sequelize = await this.intializeMSSQL();

        try{
            if (vendor.vendorId !== vendorId){
                await connection.close();
                throw new Error(`IDs ${vendorId} and ${vendor.vendorId} do not match!`)
            }

            let foundVendor = await connection.models.Vendor.findByPk(vendor.vendorId);

            if (foundVendor == null){
                await connection.close();
                throw new Error(`Vendor with ID ${vendor.vendorId} does not exist!`);
            }

            await connection.models.Vendor.update(vendor, {where: {vendorId: vendorId}});
            await connection.close();
            return vendor;
        }
        catch (err){
            await connection.close();
            throw err;
        }    
    }

    public async deleteVendorAddresses(addressIds: Array<number>, vendorId: number): Promise<void>{
        try{
            for (let addressId of addressIds){
                await this.deleteVendorAddress(addressId, vendorId);
            }
        }
        catch (err){
            throw err;
        }  
    }

    public async getVendorAddresses(vendorId: number): Promise<Address[]>{
        let connection = await this.intializeMSSQL();
        let data = await connection.query("select a.* from Vendor v left outer join VendorToAddress va " +
                                          "on v.VendorId = va.VendorId " +
                                            "left outer join Address a " +
                                            "on va.AddressId = a.AddressId " +
                                            `where v.VendorId = ${vendorId}`);
        await connection.close();
        let addresses: Address[] = data[0].map(function(information){
            let a = {addressId: information["AddressId"], street: information["Street"], 
                city: information["City"], postalCode: information["PostalCode"], 
                country: information["Country"]} as Address;
            return a;
        });
        return addresses;
    }

    public async deleteVendorAddress(addressId: number, vendorId: number): Promise<void>{
        let connection: Sequelize = await this.intializeMSSQL();

        try{
            await connection.models.VendorToAddress.destroy({where: {addressId: addressId, vendorId: vendorId}});

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

    public async updateVendorAddress(address: Address, vendor: Vendor): Promise<Address>{
        let connection: Sequelize = await this.intializeMSSQL();

        try{
            await connection.models.VendorToAddress.destroy({where: {addressId: address.addressId, vendorId: vendor.vendorId}});
            let whereClause = {street: address.street, city: address.city, postalCode: address.postalCode, country: address.country};
            let existingAddress = await connection.models.Address.findOne({where: whereClause});
            let addressToReturn: Address = null;

            if (existingAddress !== null){
                let createdReference = await this.createNewVendorAddressReference(existingAddress.dataValues as Address, vendor);
                addressToReturn = existingAddress.dataValues as Address;
            } else{
                let newId = await this.getNewId("Address", "AddressId");
                let addressTocreate = {addressId: newId, street: address.street, city: address.city, postalCode: address.postalCode, country: address.country} as Address;
                let newAddress = await this.createNewAddress(addressTocreate);
                let createdReference = await this.createNewVendorAddressReference(newAddress, vendor);
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

    public async getVendorsProductInformation(vendorToProductId: number): Promise<ProductInformation>{
        let connection: Sequelize = await this.intializeMSSQL();
        let driver = await this.initializeNeo4j();
        let session = driver.session();

        try{
            let vendorToProductData = await connection.models.VendorToProduct.findOne({where: {vendorToProductId: vendorToProductId}});

            if (vendorToProductData == null){
                await connection.close();
                await session.close();
                throw new Error(`Vendor's product with ID ${vendorToProductId} does not exist!`);
            }

            let vendorToProductDataConverted = vendorToProductData.dataValues as VendorToProduct;
            let productData = await connection.models.Product.findOne({where: {productId: vendorToProductDataConverted.productId}});
            let productDataConverted = productData.dataValues as Product;
            let categories = await session.executeRead(tx => tx.run(
                "MATCH (c)<-[r:HAS_CATEGORY]-(p:Product{ProductId: $productId}) return c"
            , {productId: productDataConverted.productId}));

            let categoriesConverted: Category[] = categories.records.map(function(v){
                let category = v.get("c") as CategoryNeo4j;
                return {categoryId: Number(category.properties.CategoryId), name: category.properties.Name} as Category;
            });

            // Fetch the image and video
            let images = await this.getProductImages(vendorToProductId);
            let videos = await this.getProductVideos(vendorToProductId);
            let image = null;
            let video = null;

            if (images.length > 0){
                image = images[0].imageContent;
            }

            if (videos.length > 0){
                video = videos[0].videoContent;
            }

            let result = {productId: productDataConverted.productId, name: productDataConverted.name,
                description: productDataConverted.description, unitPriceEuro: vendorToProductDataConverted.unitPriceEuro,
                inventoryLevel: vendorToProductDataConverted.inventoryLevel, categories: categoriesConverted,
                productImage: image, productVideo: video
            } as ProductInformation;

            await connection.close();
            await session.close();
            return result;
        }
        catch (err){
            await connection.close();
            await session.close();
            throw err;
        }  
    }

    public async getVendorProducts(vendorId: number): Promise<Array<ProductInformation>>{
        let connection: Sequelize = await this.intializeMSSQL();

        try{
            // Check if vendor references exists
            let foundVendorReference = await connection.models.VendorToProduct.findOne({where: {vendorId: vendorId}});

            if (foundVendorReference == null){
                await connection.close();
                return [];
            }

            let ids = await connection.models.VendorToProduct.findAll({attributes: ["vendorToProductId"],where: {vendorId: vendorId}});
            let idValues = ids.map(function(v){
                return Number(v.dataValues["vendorToProductId"]);
            });

            let result: ProductInformation[] = [];

            for (let vpId of idValues){
                let r = await this.getVendorsProductInformation(vpId);
                result.push(r);
            }

            await connection.close();
            return result;
        }
        catch (err){
            await connection.close();
            throw err;
        }  
    }

    public async createProductCategoryReferencesIfNotExist(productId: number, categoryIds: number[]): Promise<void>{
        for (let id of categoryIds){
            await this.createProductCategoryReferenceIfNotExist(productId, id);
        }
    }

    public async doesCategoryExist(productId: number, categoryId: number): Promise<boolean>{
        let driver = await this.initializeNeo4j();
        let session = driver.session(); 

        try{

            // Check if reference exists
            let productToCategory = await session.executeRead(tx => tx.run(
                "MATCH (p:Product{ProductId: $productId})-[r:HAS_CATEGORY]->(c:Category{CategoryId: $categoryId}) return r"
            , {productId: productId, categoryId: categoryId}));

            await session.close();
            return productToCategory.records.length > 0;
        }
        catch (err){
            await session.close();
            throw err;
        } 
    }

    public async createProductCategoryReferenceIfNotExist(productId: number, categoryId: number): Promise<void>{
        let connection: Sequelize = await this.intializeMSSQL();
        let driver = await this.initializeNeo4j();
        let session = driver.session();

        try{
            // Check if the category exists
            let category = await connection.models.Category.findByPk(categoryId);

            if (category == null){
                await connection.close();
                await session.close();
                throw new Error(`Category under ID ${categoryId} does not exist!`);
            }

            // Check if the category exists in Neo4j
            let categoriesNeo4j = await session.executeRead(tx => tx.run(
                "MATCH (c:Category{CategoryId: $categoryId}) return c"
            , {categoryId: categoryId}));

            if (categoriesNeo4j.records.length === 0){
                await connection.close();
                await session.close();
                throw new Error(`Category with ID ${categoryId} does not exist!`);
            }

            // Check if the product exists
            let product = await connection.models.Product.findByPk(productId);

            if (product == null){
                await connection.close();
                await session.close();
                throw new Error(`product under ID ${productId} does not exist!`);
            }      

            // Check if the product exists in Neo4j
            let productsNeo4j = await session.executeRead(tx => tx.run(
                "MATCH (p:Product{ProductId: $productId}) return p"
            , {productId: productId}));

            if (productsNeo4j.records.length === 0){
                await connection.close();
                await session.close();
                throw new Error(`Product under ID ${productId} does not exist!`);
            }
            
            // Check if reference exists
            let doesReferenceExist = await this.doesCategoryExist(productId, categoryId);

            if (!doesReferenceExist){
                await session.executeWrite(tx => tx.run(
                    "MATCH (p:Product{ProductId: $productId}), (c:Category{CategoryId: $categoryId}) CREATE (p)-[r:HAS_CATEGORY]->(c)"
                , {productId: productId, categoryId: categoryId}));
            }   

            await connection.close();
            await session.close();
        }
        catch (err){
            await connection.close();
            await session.close();
            throw err;
        } 
    }

    public async removeProductCategoryReference(productId: number, categoryId: number): Promise<void>{
        let driver = await this.initializeNeo4j();
        let session = driver.session();

        try{

            // Check if reference exists
            let doesReferenceExist = await this.doesCategoryExist(productId, categoryId);

            if (!doesReferenceExist){
                await session.close();
                return;
            }   


            await session.executeWrite(tx => tx.run(
                "MATCH (p:Product{ProductId: $productId})-[r:HAS_CATEGORY]->(c:Category{CategoryId: $categoryId}) DELETE r"
            , {productId: productId, categoryId: categoryId}));
            await session.close();
        }
        catch (err){
            await session.close();
            throw err;
        } 
    }

    public async createNewVendorProduct(vendorId: number, productInformation: ProductInformation): Promise<Number>{
        let connection: Sequelize = await this.intializeMSSQL();
        let driver = await this.initializeNeo4j();
        let session = driver.session();

        try{
            // Check if vendor exists
            let foundVendor = await connection.models.Vendor.findByPk(vendorId);

            if (foundVendor == null){
                await connection.close();
                await session.close();
                throw new Error(`Vendor with ID ${vendorId} does not exist!`);
            }

            // Check for already own existing product
            let vendorProducts = await this.getVendorProducts(vendorId);
            let existingProduct = vendorProducts.find((p) => p.name == productInformation.name);

            if (existingProduct !== undefined){
                await connection.close();
                throw new Error(`Vendor already owns the product with name ${productInformation.name}!`);
            }

            // Check if other vendor owns the product with the same name
            let otherVendorsProducts = await connection.query("select p.* from VendorToProduct vp " +
                "left outer join Product p " +
                  "on vp.ProductId = p.ProductId " +
                  `where vp.VendorId != ${vendorId} and p.Name = '${productInformation.name}'`);
            let otherVendorsProductsConverted: Product[] = otherVendorsProducts[0].map(function(v){
                return {productId: v["ProductId"], name: v["Name"], description: v["Description"]} as Product;
            });

            let productId = 0;
            let vendorToProductId = 0;
            
            if (otherVendorsProductsConverted.length == 0){
                let newProduct = {productId: productInformation.productId, name: productInformation.name, description: productInformation.description} as Product;
                await connection.models.Product.create(newProduct as any);
                await session.executeWrite(tx => tx.run(
                    "CREATE (p:Product{ProductId: TOINTEGER($productId), Name: $name, Description: $description})"
                , {productId: productInformation.productId, name: productInformation.name, description: productInformation.description}));
                let newId = await this.getNewId("VendorToProduct", "VendorToProductId");
                vendorToProductId = Number(newId);
                let productReference = {vendorToProductId: vendorToProductId, vendorId: vendorId, productId: productInformation.productId, unitPriceEuro: productInformation.unitPriceEuro, inventoryLevel: productInformation.inventoryLevel} as VendorToProduct;
                await connection.models.VendorToProduct.create(productReference as any);
                let query = "CREATE (v:VendorToProduct{VendorToProductId: TOINTEGER($vendorToProductId), VendorId: TOINTEGER($vendorId), ProductId: TOINTEGER($productId), UnitPriceEuro: $priceEuro, InventoryLevel: TOINTEGER($inventoryLevel)})";
                await session.executeWrite(tx => tx.run(query, {vendorToProductId: vendorToProductId, vendorId: vendorId, productId: productInformation.productId, priceEuro: productInformation.unitPriceEuro, inventoryLevel: productInformation.inventoryLevel}));
                productId = newProduct.productId;
            } else{
                let newId = await this.getNewId("VendorToProduct", "VendorToProductId");
                vendorToProductId = Number(newId);
                let productReference = {vendorToProductId: vendorToProductId, vendorId: vendorId, productId: otherVendorsProductsConverted[0].productId, unitPriceEuro: productInformation.unitPriceEuro, inventoryLevel: productInformation.inventoryLevel} as VendorToProduct;
                await connection.models.VendorToProduct.create(productReference as any);
                let query = "CREATE (v:VendorToProduct{VendorToProductId: TOINTEGER($vendorToProductId), VendorId: TOINTEGER($vendorId), ProductId: TOINTEGER($productId), UnitPriceEuro: $priceEuro, InventoryLevel: TOINTEGER($inventoryLevel)})";
                await session.executeWrite(tx => tx.run(query, {vendorToProductId: vendorToProductId, vendorId: vendorId, productId: otherVendorsProductsConverted[0].productId, priceEuro: productInformation.unitPriceEuro, inventoryLevel: productInformation.inventoryLevel}))
                productId = otherVendorsProductsConverted[0].productId;
            }

            if (productInformation.categories.length == 0){
                await connection.close();
                await session.close();
                return vendorToProductId;
            }

            let catIds = productInformation.categories.map(function(c){
                return c.categoryId;
            });

            await connection.close();
            await session.close();
            await this.createProductCategoryReferencesIfNotExist(productId, catIds);
            return vendorToProductId;
        }
        catch (err){
            await connection.close();
            await session.close();
            throw err;
        }  
    }

    public async updateVendorProduct(vendorId: number, vendorToProductId: number, informationToUpdate: ProductInformation): Promise<ProductInformation>{
        let connection: Sequelize = await this.intializeMSSQL();
        let driver = await this.initializeNeo4j();
        let session = driver.session();

        try{
            // Check if vendor exists
            let foundVendor = await connection.models.Vendor.findByPk(vendorId);

            if (foundVendor == null){
                await connection.close();
                await session.close();
                throw new Error(`Vendor with ID ${vendorId} does not exist!`);
            }

            // Check if product belongs to vendor
            let foundVendorReference = await connection.models.VendorToProduct.findOne({where: {vendorId: vendorId, vendorToProductId: vendorToProductId}});

            if (foundVendorReference == null){
                await connection.close();
                await session.close();
                throw new Error(`Vendor with ID ${vendorId} does not have a product with vendor's product ID ${vendorToProductId}`);
            }

            // Check if product belongs to vendor in Neo4j
            let foundVendorToProductsNeo4j = await session.executeRead(tx => tx.run(
                "MATCH (v:VendorToProduct{VendorId: $vendorId, VendorToProductId: $vendorToProductId}) RETURN v"
            , {vendorId: vendorId, vendorToProductId: vendorToProductId}));

            if (foundVendorToProductsNeo4j.records.length == 0){
                await connection.close();
                await session.close();
                throw new Error(`Vendor with ID ${vendorId} does not have a product with vendor's product ID ${vendorToProductId}`);
            }

            let referenceConverted = foundVendorReference.dataValues as VendorToProduct;

            // Check if the product is already referenced by some customers
            let orderPositionReference = await connection.models.OrderPosition.findOne({where: {vendorToProductId: vendorToProductId}});
            let shoppingCartReference = await session.executeRead(tx => tx.run(
                "MATCH (v:VendorToProduct{VendorToProductId: $vendorToProductId})-[r:IS_IN]->(s:ShoppingCart) RETURN v,r,s"
            , {vendorToProductId: vendorToProductId}));

            if (orderPositionReference !== null){
                await connection.close();
                await session.close();
                throw new Error(`The product information about inventory and unit price cannot be updated because it is referenced by another order position!`);
            }

            if (shoppingCartReference.records.length > 0){
                await connection.close();
                await session.close();
                throw new Error(`The product information about inventory and unit price cannot be updated because it is referenced by an item in a shopping cart!`);
            }

            // Check if the product already exists
            let otherExistingProduct = await connection.models.Product.findOne({where: {name: informationToUpdate.name, description: {
                [Op.like]: informationToUpdate.description
              }}});


            if (otherExistingProduct !== null){
                let otherProductConverted = otherExistingProduct.dataValues as Product;
                let updateData = {productId: otherProductConverted.productId, unitPriceEuro: informationToUpdate.unitPriceEuro, inventoryLevel: informationToUpdate.inventoryLevel};
                await connection.models.VendorToProduct.update(updateData, {where: {vendorToProductId: vendorToProductId}})
                await session.executeWrite(tx => tx.run(
                    "MATCH (v:VendorToProduct{VendorToProductId: $vendorToProductId}) SET v.ProductId = TOINTEGER($productId), v.UnitPriceEuro = $priceEuro, v.InventoryLevel = TOINTEGER($inventoryLevel) RETURN v"
                , {vendorToProductId: vendorToProductId, productId: otherProductConverted.productId, priceEuro: informationToUpdate.unitPriceEuro, inventoryLevel: informationToUpdate.inventoryLevel }));
            } else{
                let newProductId = await this.getNewId("Product", "ProductId");
                let productData = {productId: newProductId, name: informationToUpdate.name, description: informationToUpdate.description} as Product;
                await connection.models.Product.create(productData as any);
                await session.executeWrite(tx => tx.run(
                    "CREATE (p:Product{ProductId: TOINTEGER($productId), Name: $name, Description: $description}) "
                , {productId: newProductId, name: informationToUpdate.name, description: informationToUpdate.description}));
                let updateData = {productId: newProductId, unitPriceEuro: informationToUpdate.unitPriceEuro, inventoryLevel: informationToUpdate.inventoryLevel};
                await connection.models.VendorToProduct.update(updateData, {where: {vendorToProductId: vendorToProductId}});
                await session.executeWrite(tx => tx.run(
                    "MATCH (v:VendorToProduct{VendorToProductId: $vendorToProductId}) SET v.ProductId = TOINTEGER($productId), v.UnitPriceEuro = $priceEuro, v.InventoryLevel = TOINTEGER($inventoryLevel) RETURN v"
                , {vendorToProductId: vendorToProductId, productId: newProductId, priceEuro: informationToUpdate.unitPriceEuro, inventoryLevel: informationToUpdate.inventoryLevel}));
            }

            // Remove the old product if it is no longer referenced
            let otherProductReference = await connection.models.VendorToProduct.findOne({where: {productId: referenceConverted.productId}});

            if (otherProductReference == null){
                await session.executeWrite(tx => tx.run(
                    "MATCH (p:Product{ProductId: $productId})-[r:HAS_CATEGORY]->(c) DELETE r"
                , {productId: referenceConverted.productId}));
                await connection.models.Product.destroy({where: {productId: referenceConverted.productId}});
                await session.executeWrite(tx => tx.run(
                    "MATCH (p:Product{ProductId: $productId}) DELETE p"
                , {productId: referenceConverted.productId}));
            }

            await connection.close();
            await session.close();
            return informationToUpdate;
        }
        catch (err){
            await connection.close();
            await session.close();
            throw err;
        }  
    }

    public async removeVedorToProducts(vendorToProductIds: Array<number>): Promise<void>{
        for (let vpId of vendorToProductIds){
            await this.removeVendorProduct(vpId);
        }
    }

    public async removeVendorProduct(vendorToProductId: number): Promise<void>{
        let connection: Sequelize = await this.intializeMSSQL();
        await mongoose.connect(process.env.MONGODB_URI, {dbName: process.env.MONGODB_DATABASE});
        let driver = await this.initializeNeo4j();
        let session = driver.session();
        let ProductRecommendation = mongoose.model<IProductRecommendation>("ProductRecommendation", recommendationSchema, "ProductRecommendation");
        let Review = mongoose.model<IReview>("Review", reviewSchema, "Review");
        let CustomerAction = mongoose.model<ICustomerAction>("CustomerAction", customerActionSchema, "CustomerAction");

        try{
            let productReference = await connection.models.VendorToProduct.findOne({where: {vendorToProductId: vendorToProductId}});

            // Return if already deleted
            if (productReference == null){
                await connection.close();
                await session.close();
                await mongoose.disconnect();
                return;
            }

            let referenceConverted = productReference.dataValues as VendorToProduct;

            // Remove items from product to cart
            await session.executeWrite(tx => tx.run(
                "MATCH (v:VendorToProduct{VendorToProductId:$vendorToProductId})-[r:IS_IN]->(s:ShoppingCart) DELETE r"
            , {vendorToProductId: vendorToProductId}));

            // Remove items from order position
            await connection.models.OrderPosition.destroy({where: {vendorToProductId: vendorToProductId}});

            // Remove the reviews
            await Review.deleteMany({vendorToProductId: vendorToProductId});

            // Remove the recommendations
            await ProductRecommendation.deleteMany({vendorToProductId: vendorToProductId});

            // Remove the customer actions
            await CustomerAction.deleteMany({vendorToProductId: vendorToProductId});

            // Remove the images
            await this.removeProductImages(vendorToProductId);

            // Remove the videos
            await this.removeProductVideos(vendorToProductId);

            // Remove the product reference
            await this.removeVendorToProductEntry(vendorToProductId);
            let otherReference = await connection.models.VendorToProduct.findOne({where: {productId: referenceConverted.productId}});

            // Remove the global products and category references if necessary
            if (otherReference == null){
                await session.executeWrite(tx => tx.run(
                    "MATCH (p:Product{ProductId:$productId})-[r:HAS_CATEGORY]->(c:Category) DELETE r"
                , {productId: referenceConverted.productId}));
                await connection.models.Product.destroy({where: {productId: referenceConverted.productId}});
                await session.executeWrite(tx => tx.run(
                    "MATCH (p:Product{ProductId:$productId}) DELETE p"
                , {productId: referenceConverted.productId}));
            }

            await connection.close();
            await session.close();
            await mongoose.disconnect();
        }
        catch (err){
            await connection.close();
            await session.close();
            await mongoose.disconnect();
            throw err;
        }  
    }

    public async removeVendorToProductEntry(vendorToProductId: number): Promise<void>{
        let connection: Sequelize = await this.intializeMSSQL();
        await mongoose.connect(process.env.MONGODB_URI, {dbName: process.env.MONGODB_DATABASE});
        let driver = await this.initializeNeo4j();
        let session = driver.session();
        let ProductRecommendation = mongoose.model<IProductRecommendation>("ProductRecommendation", recommendationSchema, "ProductRecommendation");
        let Review = mongoose.model<IReview>("Review", reviewSchema, "Review");
        let CustomerAction = mongoose.model<ICustomerAction>("CustomerAction", customerActionSchema, "CustomerAction");
        let ProductImage = mongoose.model<IProductImage>("ProductImage", productImageSchema, "ProductImage");
        let ProductVideo = mongoose.model<IProductVideo>("ProductVideo", productVideoSchema, "ProductVideo");

        try{
            // Check if the entry is referenced by product in cart
            let foundReferenceResponse = await session.executeRead(tx => tx.run(
                "MATCH (v:VendorToProduct{VendorToProductId:$vendorToProductId})-[r:IS_IN]->(s:ShoppingCart) RETURN r,s,v"
            , {vendorToProductId: vendorToProductId}));

            if (foundReferenceResponse.records.length > 0){
                await connection.close();
                await session.close();
                await mongoose.disconnect();
                throw new Error(`Vendor's product with ID ${vendorToProductId} is referenced and cannot be deleted!`);
            }

            // Check for recommendation reference
            let foundRecommendation = await ProductRecommendation.findOne({'vendorToProductId': vendorToProductId});

            if (foundRecommendation !== null){
                await connection.close();
                await session.close();
                await mongoose.disconnect();
                throw new Error(`Vendor's product with ID ${vendorToProductId} is referenced and cannot be deleted!`);
            }

            // Check for review reference
            let foundReview = await Review.findOne({'vendorToProductId': vendorToProductId});

            if (foundReview !== null){
                await connection.close();
                await session.close();
                await mongoose.disconnect();
                throw new Error(`Vendor's product with ID ${vendorToProductId} is referenced and cannot be deleted!`);
            }

            // Check for action reference
            let foundAction = await CustomerAction.findOne({'vendorToProductId': vendorToProductId});

            if (foundAction !== null){
                await connection.close();
                await session.close();
                await mongoose.disconnect();
                throw new Error(`Vendor's product with ID ${vendorToProductId} is referenced and cannot be deleted!`);
            }

            // Check for image reference
            let foundImage = await ProductImage.findOne({'vendorToProductId': vendorToProductId});

            if (foundImage !== null){
                await connection.close();
                await session.close();
                await mongoose.disconnect();
                throw new Error(`Vendor's product with ID ${vendorToProductId} is referenced and cannot be deleted!`);
            }

            // Check for video reference
            let foundVideo = await ProductVideo.findOne({'vendorToProductId': vendorToProductId});

            if (foundVideo !== null){
                await connection.close();
                await session.close();
                await mongoose.disconnect();
                throw new Error(`Vendor's product with ID ${vendorToProductId} is referenced and cannot be deleted!`);
            }

            await connection.models.VendorToProduct.destroy({where: {vendorToProductId: vendorToProductId}});
            await session.executeWrite(tx => tx.run(
                "MATCH (v:VendorToProduct{VendorToProductId:$vendorToProductId}) DELETE v"
            , {vendorToProductId: vendorToProductId}));
            await connection.close();
            await session.close();
            await mongoose.disconnect();
        }
        catch (err){
            await connection.close();
            await session.close();
            await mongoose.disconnect();
            throw err;
        }  
    }

    public async removeProductImages(vendorToProductId: number): Promise<void>{
        await mongoose.connect(process.env.MONGODB_URI, {dbName: process.env.MONGODB_DATABASE});
        let ProductImage = mongoose.model<IProductImage>("ProductImage", productImageSchema, "ProductImage");

        try{
            let images = await ProductImage.find({vendorToProductId: vendorToProductId});

            for (let image of images){
                await this.removeProductImage(image.pictureId);
            }

            await mongoose.disconnect();
        }
        catch (err){
            await mongoose.disconnect();
            throw err;
        }  
    }

    public async removeProductImage(imageId: number): Promise<void>{
        let connection = await mongoose.connect(process.env.MONGODB_URI, {dbName: process.env.MONGODB_DATABASE});
        let ProductImage = mongoose.model<IProductImage>("ProductImage", productImageSchema, "ProductImage");

        try{
            let imageToDelete = await ProductImage.findOne({pictureId: imageId});
            let imagesBucket = new mongoose.mongo.GridFSBucket(connection.connection.db, {bucketName: process.env.IMAGES_BUCKET_NAME});
            await imagesBucket.delete(imageToDelete.imageContent);
            await this.deleteMongoDBEntryByAttribute(ProductImage, "pictureId", imageToDelete.pictureId);
            await mongoose.disconnect();
        }
        catch (err){
            await mongoose.disconnect();
            throw err;
        }  
    }

    public async removeProductVideos(vendorToProductId: number): Promise<void>{
        await mongoose.connect(process.env.MONGODB_URI, {dbName: process.env.MONGODB_DATABASE});
        let ProductVideo = mongoose.model<IProductVideo>("ProductVideo", productVideoSchema, "ProductVideo");

        try{
            let videos = await ProductVideo.find({vendorToProductId: vendorToProductId});

            for (let video of videos){
                await this.removeProductVideo(video.videoId);
            }

            await mongoose.disconnect();
        }
        catch (err){
            await mongoose.disconnect();
            throw err;
        }  
    }

    public async removeProductVideo(videoId: number): Promise<void>{
        let connection = await mongoose.connect(process.env.MONGODB_URI, {dbName: process.env.MONGODB_DATABASE});
        let ProductVideo = mongoose.model<IProductVideo>("ProductVideo", productVideoSchema, "ProductVideo");

        try{
            let videoToDelete = await ProductVideo.findOne({videoId: videoId});
            let videosBucket = new mongoose.mongo.GridFSBucket(connection.connection.db, {bucketName: process.env.VIDEOS_BUCKET_NAME});
            await videosBucket.delete(videoToDelete.videoContent);
            await this.deleteMongoDBEntryByAttribute(ProductVideo, "videoId", videoId);
            await mongoose.disconnect();
        }
        catch (err){
            await mongoose.disconnect();
            throw err;
        }  
    }

    public async createProductImage(productImage: ProductImage, fileName: string, contentType: string, buffer): Promise<ProductImage>{
        let connection: Sequelize = await this.intializeMSSQL();
        let mongodbConnection = await mongoose.connect(process.env.MONGODB_URI, {dbName: process.env.MONGODB_DATABASE});
        let imagesBucket = new mongoose.mongo.GridFSBucket(mongodbConnection.connection.db, {bucketName: process.env.IMAGES_BUCKET_NAME});
        let ProductImage = mongoose.model<IProductImage>("ProductImage", productImageSchema, "ProductImage");

        try{
            // Check if the ID already exists
            let foundImage = await ProductImage.findOne({'pictureId': productImage.pictureId});

            if (foundImage !== null){
                await connection.close();
                await mongoose.disconnect();
                throw new Error(`Image with ID ${productImage.pictureId} already exists!`);
            }

            // Check if the product exists
            let foundProduct = await connection.models.VendorToProduct.findOne({where: {vendorToProductId: productImage.vendorToProductId}});

            if (foundProduct == null){
                await connection.close();
                await mongoose.disconnect();
                throw new Error(`Vendor's product with ID ${productImage.vendorToProductId} does not exist!`);
            }

            let fileId: ObjectId = await new Promise((resolve, reject) => {
                const uploadStream = imagesBucket.openUploadStream(fileName, {
                contentType: contentType,
                });
                uploadStream.end(buffer);
                uploadStream.on("finish", (file) => resolve(file._id));
                uploadStream.on("error", (err) => reject(err));
            });

            let newImage = new ProductImage({
                pictureId: productImage.pictureId,
                vendorToProductId: productImage.vendorToProductId,
                imageContent: fileId,
            });
            await newImage.save();
            await connection.close();
            await mongoose.disconnect();
            return productImage;
        }
        catch (err){
            await connection.close();
            await mongoose.disconnect();
            throw err;
        } 
    }

    public async createProductVideo(productVideo: ProductVideo, fileName: string, contentType: string, buffer): Promise<ProductVideo>{
        let connection: Sequelize = await this.intializeMSSQL();
        let mongodbConnection = await mongoose.connect(process.env.MONGODB_URI, {dbName: process.env.MONGODB_DATABASE});
        let videosBucket = new mongoose.mongo.GridFSBucket(mongodbConnection.connection.db, {bucketName: process.env.VIDEOS_BUCKET_NAME});
        let ProductVideo = mongoose.model<IProductVideo>("ProductVideo", productVideoSchema, "ProductVideo");

        try{
            // Check if the ID already exists
            let foundVideo = await ProductVideo.findOne({'videoId': productVideo.videoId});

            if (foundVideo !== null){
                await connection.close();
                await mongoose.disconnect();
                throw new Error(`Video with ID ${productVideo.videoContent} already exists!`);
            }

            // Check if the product exists
            let foundProduct = await connection.models.VendorToProduct.findOne({where: {vendorToProductId: productVideo.vendorToProductId}});

            if (foundProduct == null){
                await connection.close();
                await mongoose.disconnect();
                throw new Error(`Vendor's product with ID ${productVideo.vendorToProductId} does not exist!`);
            }

            let fileId: ObjectId = await new Promise((resolve, reject) => {
                const uploadStream = videosBucket.openUploadStream(fileName, {
                contentType: contentType,
                });
                uploadStream.end(buffer);
                uploadStream.on("finish", (file) => resolve(file._id));
                uploadStream.on("error", (err) => reject(err));
            });

            let newVideo = new ProductVideo({
                videoId: productVideo.videoId,
                vendorToProductId: productVideo.vendorToProductId,
                videoContent: fileId,
            });
            await newVideo.save();
            await connection.close();
            await mongoose.disconnect();
            return productVideo;
        }
        catch (err){
            await connection.close();
            await mongoose.disconnect();
            throw err;
        } 
    }

    public async getProductImages(vendorToProductId: number): Promise<Array<ProductImage>>{
        let connection = await mongoose.connect(process.env.MONGODB_URI, {dbName: process.env.MONGODB_DATABASE});
        let database = connection.connection.db;
        mongoose.mongo.GridFSBucket
        let bucket = new mongoose.mongo.GridFSBucket(database, {bucketName: process.env.IMAGES_BUCKET_NAME});
        let ProductImage = mongoose.model<IProductImage>("ProductImage", productImageSchema, "ProductImage");

        try{
            let images = await ProductImage.find({ vendorToProductId: vendorToProductId });
            let result: ProductImage[] = [];
    
            // For each document, read the file from GridFS and convert to base64.
            for (let image of images) {
            let base64Content = await this.getFileBase64(image.imageContent, bucket);
            result.push({
                pictureId: image.pictureId,
                vendorToProductId: image.vendorToProductId,
                imageContent: base64Content,
            } as ProductImage);
            }

            await mongoose.disconnect()
            return result;
        }
        catch (err){
            await mongoose.disconnect();
            throw err;
        } 
    }

    public async getProductVideos(vendorToProductId: number): Promise<Array<ProductVideo>>{
        let connection = await mongoose.connect(process.env.MONGODB_URI, {dbName: process.env.MONGODB_DATABASE});
        let database = connection.connection.db;
        mongoose.mongo.GridFSBucket
        let bucket = new mongoose.mongo.GridFSBucket(database, {bucketName: process.env.VIDEOS_BUCKET_NAME});
        let ProductVideo = mongoose.model<IProductVideo>("ProductVideo", productVideoSchema, "ProductVideo");

        try{
            let videos = await ProductVideo.find({ vendorToProductId: vendorToProductId });
            let result: ProductVideo[] = [];
    
            for (let video of videos) {
            let base64Content = await this.getFileBase64(video.videoContent, bucket);
            result.push({
                videoId: video.videoId,
                vendorToProductId: video.vendorToProductId,
                videoContent: base64Content,
            } as ProductVideo);
            }

            await mongoose.disconnect()
            return result;
        }
        catch (err){
            await mongoose.disconnect();
            throw err;
        } 
    }

    public async updateVideo(productVideo: ProductVideo, fileName: string, contentType: string, buffer): Promise<ProductVideo>{
        try{
            await this.removeProductVideos(productVideo.vendorToProductId);
            await this.createProductVideo(productVideo, fileName, contentType, buffer);
            return productVideo;
        }
        catch (err){

            throw err;
        } 
    }

    public async updateImage(productImage: ProductImage, fileName: string, contentType: string, buffer): Promise<ProductImage>{
        try{
            await this.removeProductImages(productImage.vendorToProductId);
            await this.createProductImage(productImage, fileName, contentType, buffer);
            return productImage;
        }
        catch (err){

            throw err;
        } 
    }

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
        });
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

    public async deleteMongoDBEntriesByAttribute(mongooseModel: mongoose.Model<any>, attributeName: string, attributeValue): Promise<void>{
        await mongoose.connect(process.env.MONGODB_URI, {dbName: process.env.MONGODB_DATABASE});

        try{
            // Remove the data
            await mongooseModel.deleteMany({[attributeName]: attributeValue});
            await mongoose.disconnect();
        }
        catch (err){
            await mongoose.disconnect();
            throw err;
        } 
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

    private async defineModels(sequelize: Sequelize): Promise<Sequelize>{
        return new Promise<Sequelize>((resolve, reject) => {
            sequelize.define("Vendor",
                {
                    vendorId: {
                        type: DataTypes.INTEGER,
                        allowNull: false,
                        primaryKey: true
                    },
                    userName: {
                        type: DataTypes.STRING,
                        allowNull: false
                    },
                    name: {
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
                    tableName: "Vendor",
                    modelName: "Vendor",
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

            sequelize.define("Product",
                {
                    productId: {
                        type: DataTypes.INTEGER,
                        allowNull: false,
                        primaryKey: true

                    },
                    name: {
                        type: DataTypes.STRING,
                        allowNull: false
                    },
                    description:{
                        type: DataTypes.TEXT,
                        allowNull: false
                    }
                },
                {
                    tableName: "Product",
                    modelName: "Product",
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

            sequelize.define("ProductToCategory",
                {
                    productToCategoryId: {
                        type: DataTypes.INTEGER,
                        allowNull: false,
                        primaryKey: true

                    },
                    productId: {
                        type: DataTypes.INTEGER,
                        allowNull: false
                    },
                    categoryId:{
                        type: DataTypes.INTEGER,
                        allowNull: false
                    }
                },
                {
                    tableName: "ProductToCategory",
                    modelName: "ProductToCategory",
                    createdAt: false,
                    updatedAt: false
                }
            );

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

            sequelize.define("ProductToCart",
                {
                    productToCartId: {
                        type: DataTypes.INTEGER,
                        allowNull: false,
                        primaryKey: true

                    },
                    vendorToProductId: {
                        type: DataTypes.INTEGER,
                        allowNull: false
                    },
                    cartId: {
                        type: DataTypes.INTEGER,
                        allowNull: false
                    },
                    amount: {
                        type: DataTypes.INTEGER,
                        allowNull: false
                    }
                },
                {
                    tableName: "ProductToCart",
                    modelName: "ProductToCart",
                    createdAt: false,
                    updatedAt: false
                }
            );

            resolve(sequelize);
        })
    }
}