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
            connection.close();

            if (id == null){
                return 0;
            }

            connection.close();
            return Number(id) + 1;
        }
        catch (err){
            connection.close();
            throw err;
        }
    }

    public async doesUsernameExist(userName: string): Promise<boolean>{
        let connection: Sequelize = await this.intializeMSSQL();

        try{
            let user = await connection.models.Vendor.findOne({where: {userName: userName}});
            connection.close();
            return user !== null;
        }
        catch (err){
            connection.close();
            throw err;
        }
    }
    
    public async createNewAddress(address: Address): Promise<Address>{
        let connection: Sequelize = await this.intializeMSSQL();

        try{
            let foundAddressByPk = await connection.models.Address.findByPk(address.addressId);

            if (foundAddressByPk !== null){
                connection.close();
                throw new Error(`Address with ID ${address.addressId} already exists!`);
            }

            let whereClause = {street: address.street, city: address.city, postalCode: address.postalCode, country: address.country};
            let foundAddress = await connection.models.Address.findOne({where: whereClause});

            if (foundAddress !== null){
                connection.close();
                throw new Error(`Address with the given data already exists!`);
            }

            let created = await connection.models.Address.create(address as any);
            let createdConverted = created.dataValues as Address;
            connection.close();
            return createdConverted;
        }
        catch (err){
            connection.close();
            throw err;
        }  
    }

    public async createNewVendor(vendor: Vendor): Promise<Vendor>{
        let connection: Sequelize = await this.intializeMSSQL();

        try{
            let foundVendor = await connection.models.Vendor.findByPk(vendor.vendorId);

            if (foundVendor !== null){
                connection.close();
                throw new Error(`Vendor with ID ${vendor.vendorId} already exists!`);
            }

            let created = await connection.models.Vendor.create(vendor as any);
            let createdConverted = created.dataValues as Vendor;
            connection.close();
            return createdConverted;
        }
        catch (err){
            connection.close();
            throw err;
        }    
    }

    public async createNewVendorAddress(address: Address, vendor: Vendor): Promise<Address>{
        let connection: Sequelize = await this.intializeMSSQL();

        try{
            let foundAddress = await connection.models.Address.findByPk(address.addressId);

            if (foundAddress !== null){
                connection.close();
                throw new Error(`Address with ID ${address.addressId} already exists!`);
            }

            let whereClause = {street: address.street, city: address.city, postalCode: address.postalCode, country: address.country};
            let existingAddress = await connection.models.Address.findOne({where: whereClause});

            if (existingAddress !== null){
                let createdReference = await this.createNewVendorAddressReference(existingAddress.dataValues as Address, vendor);
                return existingAddress.dataValues as Address;
            }

            let newAddress = await this.createNewAddress(address);
            let createdReference = await this.createNewVendorAddressReference(newAddress, vendor);
            let createdConverted  = newAddress;
            connection.close();
            return createdConverted;
        }
        catch (err){
            connection.close();
            throw err;
        }  
    }

    public async createNewVendorAddressReference(address: Address, vendor: Vendor): Promise<VendorToAddress>{
        let connection: Sequelize = await this.intializeMSSQL();

        try{
            let whereClause = {vendorId: vendor.vendorId, addressId: address.addressId};
            let foundAddress = await connection.models.VendorToAddress.findOne({where: whereClause});

            if (foundAddress !== null){
                connection.close();
                throw new Error(`Vendor address reference with address ID ${address.addressId} and vendor ID ${vendor.vendorId} already exists!`);
            }


            let newId = await this.getNewId("VendorToAddress", "VendorToAddressId");
            let vendorToAddress = {vendorToAddressId: newId, addressId: address.addressId, vendorId: vendor.vendorId} as VendorToAddress;
            let created = await connection.models.VendorToAddress.create(vendorToAddress as any);
            let createdConverted = created.dataValues as VendorToAddress;
            connection.close();
            return createdConverted;
        }
        catch (err){
            connection.close();
            throw err;
        }  
    }

    public async updateExistingVendor(vendor: Vendor, vendorId: number): Promise<Vendor>{
        let connection: Sequelize = await this.intializeMSSQL();

        try{
            if (vendor.vendorId !== vendorId){
                throw new Error(`IDs ${vendorId} and ${vendor.vendorId} do not match!`)
            }

            let foundVendor = await connection.models.Vendor.findByPk(vendor.vendorId);

            if (foundVendor == null){
                connection.close();
                throw new Error(`Vendor with ID ${vendor.vendorId} does not exist!`);
            }

            await connection.models.Vendor.update(vendor, {where: {vendorId: vendorId}});
            connection.close();
            return vendor;
        }
        catch (err){
            connection.close();
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
        connection.close();
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
                connection.close();
                return;
            }

            let foundVendorResult = await foundVendorReference;

            if (foundVendorResult !== null){
                connection.close();
                return;
            }

            let foundSupplierResult = await foundSupplierReference;

            if (foundSupplierResult !== null){
                connection.close();
                return;
            }

            let foundDeliveryResult = await foundDeliveryReference;

            if (foundDeliveryResult !== null){
                connection.close();
                return;
            }

            let foundOrderResult = await foundOrderReference;

            if (foundOrderResult !== null){
                connection.close();
                return;
            }

            await connection.models.Address.destroy({where: {addressId: addressId}});
            connection.close();
            return;
        }
        catch (err){
            connection.close();
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
                connection.close();
                return addressToReturn;
            }

            let foundVendorResult = await foundVendorReference;

            if (foundVendorResult !== null){
                connection.close();
                return addressToReturn;
            }

            let foundSupplierResult = await foundSupplierReference;

            if (foundSupplierResult !== null){
                connection.close();
                return addressToReturn;
            }

            let foundDeliveryResult = await foundDeliveryReference;

            if (foundDeliveryResult !== null){
                connection.close();
                return addressToReturn;
            }

            let foundOrderResult = await foundOrderReference;

            if (foundOrderResult !== null){
                connection.close();
                return addressToReturn;
            }

            await connection.models.Address.destroy({where: {addressId: address.addressId}});
            connection.close();
            return addressToReturn;
        }
        catch (err){
            connection.close();
            throw err;
        }  
    }

    public async getVendorsProductInformation(vendorToProductId: number): Promise<ProductInformation>{
        let connection: Sequelize = await this.intializeMSSQL();

        try{
            let vendorToProductData = await connection.models.VendorToProduct.findOne({where: {vendorToProductId: vendorToProductId}});

            if (vendorToProductData == null){
                throw new Error(`Vendor's product with ID ${vendorToProductId} does not exist!`);
            }

            let vendorToProductDataConverted = vendorToProductData.dataValues as VendorToProduct;
            let productData = await connection.models.Product.findOne({where: {productId: vendorToProductDataConverted.productId}});
            let productDataConverted = productData.dataValues as Product;
            let categories = await connection.query("select c.* from ProductToCategory pc " +
                "left outer join Category c " +
                    "on pc.CategoryId = c.CategoryId " +
                    `where pc.ProductId = ${productDataConverted.productId}`);
            let categoriesConverted: Category[] = categories[0].map(function(v){
                return {categoryId: v["CategoryId"], name: v["Name"]} as Category;
            });
            let result = {productId: productDataConverted.productId, name: productDataConverted.name,
                description: productDataConverted.description, unitPriceEuro: vendorToProductDataConverted.unitPriceEuro,
                inventoryLevel: vendorToProductDataConverted.inventoryLevel, categories: categoriesConverted
            } as ProductInformation;
            return result;
        }
        catch (err){
            connection.close();
            throw err;
        }  
    }

    public async getVendorProducts(vendorId: number): Promise<Array<ProductInformation>>{
        let connection: Sequelize = await this.intializeMSSQL();

        try{
            // Check if vendor references exists
            let foundVendorReference = await connection.models.VendorToProduct.findOne({where: {vendorId: vendorId}});

            if (foundVendorReference == null){
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

            connection.close();
            return result;
        }
        catch (err){
            connection.close();
            throw err;
        }  
    }

    public async createProductCategoryReferencesIfNotExist(productId: number, categoryIds: number[]): Promise<void>{
        for (let id of categoryIds){
            await this.createProductCategoryReferenceIfNotExist(productId, id);
        }
    }

    public async createProductCategoryReferenceIfNotExist(productId: number, categoryId: number): Promise<void>{
        let connection: Sequelize = await this.intializeMSSQL();

        try{
            // Check if the category exists
            let category = await connection.models.Category.findByPk(categoryId);

            if (category == null){
                throw new Error(`Category under ID ${categoryId} does not exist!`);
            }

            // Check if the product exists
            let product = await connection.models.Product.findByPk(productId);

            if (product == null){
                throw new Error(`product under ID ${productId} does not exist!`);
            }      
            
            // Check if reference exists
            let productToCategory = await connection.models.ProductToCategory.findOne({where: {productId: productId, categoryId: categoryId}});

            if (productToCategory == null){
                let newId = await this.getNewId("ProductToCategory", "ProductToCategoryId");
                let pcRef = {productToCategoryId: newId, productId: productId, categoryId: categoryId} as ProductToCategory;
                await connection.models.ProductToCategory.create(pcRef as any);
            }   

            connection.close();
        }
        catch (err){
            connection.close();
            throw err;
        } 
    }

    public async createNewVendorProduct(vendorId: number, productInformation: ProductInformation): Promise<ProductInformation>{
        let connection: Sequelize = await this.intializeMSSQL();

        try{
            // Check if vendor exists
            let foundVendor = await connection.models.Vendor.findByPk(vendorId);

            if (foundVendor == null){
                throw new Error(`Vendor with ID ${vendorId} does not exist!`);
            }

            // Check for already own existing product
            let vendorProducts = await this.getVendorProducts(vendorId);
            let existingProduct = vendorProducts.find((p) => p.name == productInformation.name);

            if (existingProduct !== undefined){
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
            
            if (otherVendorsProductsConverted.length == 0){
                let newProduct = {productId: productInformation.productId, name: productInformation.name, description: productInformation.description} as Product;
                await connection.models.Product.create(newProduct as any);
                let newVendorToProductId = await this.getNewId("VendorToProduct", "VendorToProductId");
                let productReference = {vendorToProductId: newVendorToProductId, vendorId: vendorId, productId: productInformation.productId, unitPriceEuro: productInformation.unitPriceEuro, inventoryLevel: productInformation.inventoryLevel} as VendorToProduct;
                await connection.models.VendorToProduct.create(productReference as any);
                productId = newProduct.productId;
            } else{
                let newVendorToProductId = await this.getNewId("VendorToProduct", "VendorToProductId");
                let productReference = {vendorToProductId: newVendorToProductId, vendorId: vendorId, productId: otherVendorsProductsConverted[0].productId, unitPriceEuro: productInformation.unitPriceEuro, inventoryLevel: productInformation.inventoryLevel} as VendorToProduct;
                await connection.models.VendorToProduct.create(productReference as any);
                productId = otherVendorsProductsConverted[0].productId;
            }

            if (productInformation.categories.length == 0){
                return productInformation;
            }

            let catIds = productInformation.categories.map(function(c){
                return c.categoryId;
            });

            connection.close();
            await this.createProductCategoryReferencesIfNotExist(productId, catIds);
            return productInformation;
        }
        catch (err){
            connection.close();
            throw err;
        }  
    }

    public async updateVendorProduct(vendorId: number, vendorToProductId: number, informationToUpdate: ProductInformation): Promise<ProductInformation>{
        let connection: Sequelize = await this.intializeMSSQL();

        try{
            // Check if vendor exists
            let foundVendor = await connection.models.Vendor.findByPk(vendorId);

            if (foundVendor == null){
                throw new Error(`Vendor with ID ${vendorId} does not exist!`);
            }

            // Check if product belongs to vendor
            let foundVendorReference = await connection.models.VendorToProduct.findOne({where: {vendorId: vendorId, vendorToProductId: vendorToProductId}});

            if (foundVendorReference == null){
                throw new Error(`Vendor with ID ${vendorId} does not have a product with vendor's product ID ${vendorToProductId}`);
            }

            let referenceConverted = foundVendorReference.dataValues as VendorToProduct;

            // Check if the product is already referenced by some customers
            let orderPositionReference = await connection.models.OrderPosition.findOne({where: {vendorToProductId: vendorToProductId}});
            let shoppingCartReference = await connection.models.ProductToCart.findOne({where: {vendorToProductId: vendorToProductId}});

            if (orderPositionReference !== null){
                throw new Error(`The product information about inventory and unit price cannot be updated because it is referenced by another order position!`);
            }

            if (shoppingCartReference !== null){
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
            } else{
                let newProductId = await this.getNewId("Product", "ProductId");
                let productData = {productId: newProductId, name: informationToUpdate.name, description: informationToUpdate.description} as Product;
                await connection.models.Product.create(productData as any);
                let updateData = {productId: newProductId, unitPriceEuro: informationToUpdate.unitPriceEuro, inventoryLevel: informationToUpdate.inventoryLevel};
                await connection.models.VendorToProduct.update(updateData, {where: {vendorToProductId: vendorToProductId}})
            }

            // Remove the old product if it is no longer referenced
            let otherProductReference = await connection.models.VendorToProduct.findOne({where: {productId: referenceConverted.productId}});

            if (otherProductReference == null){
                await connection.models.ProductToCategory.destroy({where: {productId: referenceConverted.productId}});
                await connection.models.Product.destroy({where: {productId: referenceConverted.productId}});
            }

            connection.close();
            return informationToUpdate;
        }
        catch (err){
            connection.close();
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

        try{
            let productReference = await connection.models.VendorToProduct.findOne({where: {vendorToProductId: vendorToProductId}});

            // Remove product if it is not referenced
            if (productReference == null){
                throw new Error(`Product with vendor's product ID ${vendorToProductId} does not exist!`);
            }

            let referenceConverted = productReference.dataValues as VendorToProduct;

            // Remove items from product to cart
            await connection.models.ProductToCart.destroy({where: {vendorToProductId: vendorToProductId}});

            // Remove items from order position
            await connection.models.OrderPosition.destroy({where: {vendorToProductId: vendorToProductId}});

            // Remove the product reference
            await connection.models.VendorToProduct.destroy({where: {vendorToProductId: vendorToProductId}});
            let otherReference = await connection.models.VendorToProduct.findOne({where: {productId: referenceConverted.productId}});

            if (otherReference == null){
                await connection.models.ProductToCategory.destroy({where: {productId: referenceConverted.productId}});
                await connection.models.Product.destroy({where: {productId: referenceConverted.productId}});
            }
        }
        catch (err){
            connection.close();
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