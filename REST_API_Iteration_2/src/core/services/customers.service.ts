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
import { Vendor } from '../../models/vendor.model';
import { VendorInformation } from '../../models/vendor.information.model';
import { ProductToCart } from '../../models/product.to.cart.model';
import { SupplierInformation } from '../../models/supplier.information.model';
import { Supplier } from '../../models/supplier.model';
import { CustomerOrder } from '../../models/customer.order.model';
import sequelize = require('sequelize');
import { OrderPosition } from '../../models/order.position.model';
import neo4j, { Driver, Node, Relationship } from 'neo4j-driver';
import * as mongoose from "mongoose";
import {VendorToProduct as VendorToProductNeo4j} from '../../models/neo4j.models/vendor.to.product.neo4j.model';
import {ShoppingCart as ShoppingCartNeo4j} from '../../models/neo4j.models/shopping.cart.neo4j.model';
import { IReview } from '../../models/mongodb.models/mongodb.interfaces/review.mongodb.interface';
import {IS_IN} from '../../models/neo4j.models/is.in.neo4j.model'
import reviewSchema from '../../models/mongodb.models/mongodb.schemas/review.mongodb.schema';
import { IProductRecommendation } from '../../models/mongodb.models/mongodb.interfaces/product.recommendation.mongodb.interface';
import recommendationSchema from '../../models/mongodb.models/mongodb.schemas/product.recommendation.mongodb.schema';
import { ICustomerAction } from '../../models/mongodb.models/mongodb.interfaces/customer.action.mongodb.interface';
import customerActionSchema from '../../models/mongodb.models/mongodb.schemas/customer.action.mongodb.schema';

/**
 * The customers service.
 */
@injectable()
export class CustomersService {
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

    public async doesUsernameExist(userName: string): Promise<boolean>{
        let connection: Sequelize = await this.intializeMSSQL();

        try{
            let user = await connection.models.Customer.findOne({where: {userName: userName}});
            await connection.close();
            return user !== null;
        }
        catch (err){
            await connection.close();
            throw err;
        }
    }

    public async createNewCustomer(customer: Customer): Promise<Customer>{
        let connection: Sequelize = await this.intializeMSSQL();

        try{
            let foundCustomer = await connection.models.Customer.findByPk(customer.customerId);

            if (foundCustomer !== null){
                await connection.close();
                throw new Error(`Customer with ID ${customer.customerId} already exists!`);
            }

            let created = await connection.models.Customer.create(customer as any);
            let createdConverted = created.dataValues as Customer;
            await connection.close();
            return createdConverted;
        }
        catch (err){
            await connection.close();
            throw err;
        }    
    }

    public async updateExistingCustomer(customer: Customer, customerId: number): Promise<Customer>{
        let connection: Sequelize = await this.intializeMSSQL();

        try{
            if (customer.customerId !== customerId){
                await connection.close();
                throw new Error(`IDs ${customerId} and ${customer.customerId} do not match!`)
            }

            let foundCustomer = await connection.models.Customer.findByPk(customer.customerId);

            if (foundCustomer == null){
                await connection.close();
                throw new Error(`Customer with ID ${customer.customerId} does not exist!`);
            }

            await connection.models.Customer.update(customer, {where: {customerId: customerId}});
            await connection.close();
            return customer;
        }
        catch (err){
            await connection.close();
            throw err;
        }    
    }

    public async createNewShoppingCart(cart: ShoppingCart): Promise<ShoppingCart>{
        let connection: Sequelize = await this.intializeMSSQL();
        let driver = await this.initializeNeo4j();
        let session = driver.session();

        try{
            // Check if the cart exists in MSSQL
            let foundCart = await connection.models.ShoppingCart.findByPk(cart.cartId);

            if (foundCart !== null){
                await connection.close();
                await session.close();
                throw new Error(`Cart with ID ${cart.cartId} already exists!`);
            }

            // Check if the cart exists in Neo4j
            let foundReferenceResponse = await session.executeRead(tx => tx.run<ShoppingCartNeo4j>(
                "MATCH (c:ShoppingCart{CartId: $cartId}) RETURN c"
            , {cartId: cart.cartId}));

            if (foundReferenceResponse.records.length > 0){
                await connection.close();
                await session.close();
                throw new Error(`Cart with ID ${cart.cartId} already exists!`);
            }

            // Check if customer exists
            let foundCustomer = await connection.models.Customer.findByPk(cart.customerId);

            if (foundCustomer == null){
                await connection.close();
                await session.close();
                throw new Error(`Customer with ID ${cart.customerId} does not exist!`);
            }

            // Create the cart in MSSQL
            let created = await connection.models.ShoppingCart.create(cart as any);
            let createdConverted = created.dataValues as ShoppingCart;

            // Create replicate in Neo4j
            let dateConverted = neo4j.types.DateTime.fromStandardDate(cart.dateCreated); 
            await session.executeWrite(tx => tx.run(
                "CREATE (c:ShoppingCart{CartId: TOINTEGER($cartId), CustomerId: TOINTEGER($customerId), DateCreated: $dateCreated}) "
            , {cartId: cart.cartId, customerId: cart.customerId, dateCreated: dateConverted}));

            await connection.close();
            await session.close();
            return createdConverted;
        }
        catch (err){
            await connection.close();
            await session.close();
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

    public async createNewCustomerAddress(address: Address, customer: Customer): Promise<Address>{
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
                let createdReference = await this.createNewCustomerAddressReference(existingAddress.dataValues as Address, customer);
                return existingAddress.dataValues as Address;
            }

            let newAddress = await this.createNewAddress(address);
            let createdReference = await this.createNewCustomerAddressReference(newAddress, customer);
            let createdConverted  = newAddress;
            await connection.close();
            return createdConverted;
        }
        catch (err){
            await connection.close();
            throw err;
        }  
    }

    public async createNewCustomerAddressReference(address: Address, customer: Customer): Promise<CustomerToAddress>{
        let connection: Sequelize = await this.intializeMSSQL();

        try{
            let whereClause = {customerId: customer.customerId, addressId: address.addressId};
            let foundAddress = await connection.models.CustomerToAddress.findOne({where: whereClause});

            if (foundAddress !== null){
                await connection.close();
                throw new Error(`Customer address reference with address ID ${address.addressId} and customer ID ${customer.customerId} already exists!`);
            }


            let newId = await this.getNewId("CustomerToAddress", "CustomerToAddressId");
            let customerToAddress = {customerToAddressId: newId, addressId: address.addressId, customerId: customer.customerId} as CustomerToAddress;
            let created = await connection.models.CustomerToAddress.create(customerToAddress as any);
            let createdConverted = created.dataValues as CustomerToAddress;
            await connection.close();
            return createdConverted;
        }
        catch (err){
            await connection.close();
            throw err;
        }  
    }

    public async updateCustomerAddress(address: Address, customer: Customer): Promise<Address>{
        let connection: Sequelize = await this.intializeMSSQL();

        try{
            await connection.models.CustomerToAddress.destroy({where: {addressId: address.addressId, customerId: customer.customerId}});
            let whereClause = {street: address.street, city: address.city, postalCode: address.postalCode, country: address.country};
            let existingAddress = await connection.models.Address.findOne({where: whereClause});
            let addressToReturn: Address = null;

            if (existingAddress !== null){
                let createdReference = await this.createNewCustomerAddressReference(existingAddress.dataValues as Address, customer);
                addressToReturn = existingAddress.dataValues as Address;
            } else{
                let newId = await this.getNewId("Address", "AddressId");
                let addressTocreate = {addressId: newId, street: address.street, city: address.city, postalCode: address.postalCode, country: address.country} as Address;
                let newAddress = await this.createNewAddress(addressTocreate);
                let createdReference = await this.createNewCustomerAddressReference(newAddress, customer);
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

    public async deleteCustomerAddresses(addressIds: Array<number>, customerId: number): Promise<void>{
        try{
            for (let addressId of addressIds){
                await this.deleteCustomerAddress(addressId, customerId);
            }
        }
        catch (err){
            throw err;
        }  
    }

    public async deleteCustomerAddress(addressId: number, customerId: number): Promise<void>{
        let connection: Sequelize = await this.intializeMSSQL();

        try{
            await connection.models.CustomerToAddress.destroy({where: {addressId: addressId, customerId: customerId}});

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

    public async getVendorsProductInformation(vendorToProductId: number): Promise<ProductInformation>{
        let connection: Sequelize = await this.intializeMSSQL();

        try{
            let vendorToProductData = await connection.models.VendorToProduct.findOne({where: {vendorToProductId: vendorToProductId}});

            if (vendorToProductData == null){
                await connection.close();
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
            await connection.close();
            throw err;
        }  
    }

    public async getVendorInformation(vendorToProductId: number): Promise<VendorInformation>{
        let connection: Sequelize = await this.intializeMSSQL();

        try{
            let vendorToProductData = await connection.models.VendorToProduct.findOne({where: {vendorToProductId: vendorToProductId}});

            if (vendorToProductData == null){
                await connection.close();
                throw new Error(`Vendor's product with ID ${vendorToProductId} does not exist!`);
            }

            let vendorToProductDataConverted = vendorToProductData.dataValues as VendorToProduct;
            let vendorData = await connection.models.Vendor.findOne({where: {vendorId: vendorToProductDataConverted.vendorId}});
            let vendorDataConverted = vendorData.dataValues as Vendor;
            let addresses = await connection.query("select a.* from VendorToAddress va " +
                "left outer join Address a " +
                  "on va.AddressId = a.AddressId " +
                  `where va.VendorId = ${vendorToProductDataConverted.vendorId}`);
            let addressesConverted: Address[] = addresses[0].map(function(v){
                return {addressId: v["AddressId"], street: v["Street"], city: v["City"], postalCode: v["PostalCode"], country: v["Country"]} as Address;
            });
            let result = {
                vendorId: vendorDataConverted.vendorId,
                name: vendorDataConverted.name,
                userName: vendorDataConverted.userName,
                email: vendorDataConverted.email,
                phoneNumber: vendorDataConverted.phoneNumber,
                vendorAddresses: addressesConverted
            } as VendorInformation;
            await connection.close();
            return result;
        }
        catch (err){
            await connection.close();
            throw err;
        }  
    }

    public async addProductToCart(vendorToProductId: number, shoppingCartId: number, amount: number): Promise<void>{
        let connection: Sequelize = await this.intializeMSSQL();
        let driver = await this.initializeNeo4j();
        let session = driver.session();


        try{
            // Check if cart exists in MSSQL
            let cart = await connection.models.ShoppingCart.findOne({where: {cartId: shoppingCartId}});

            if (cart == null){
                await connection.close();
                await session.close();
                throw new Error(`No cart under the given ID ${shoppingCartId} exists!`);
            }

            // Check if the cart exists in Neo4j
            let response = await session.executeRead(tx => tx.run<ShoppingCartNeo4j>(
                "MATCH (c:ShoppingCart{CartId: $cartId}) return c"
            , {cartId: shoppingCartId}));

            if (response.records.length == 0){
                await connection.close();
                await session.close();
                throw new Error(`Cart with ID ${shoppingCartId} does not exist!`);
            }

            // Check if vendor's product exists in MSSQL
            let vendorToProduct = await connection.models.VendorToProduct.findOne({where: {vendorToProductId: vendorToProductId}});

            if (vendorToProduct == null){
                await connection.close();
                await session.close();
                throw new Error(`No vendor product under the given ID ${vendorToProductId} exists!`);
            }

            // Check if vendor's product exists in Neo4j
            let responseVendorProduct = await session.executeRead(tx => tx.run<VendorToProductNeo4j>(
                "MATCH (v:VendorToProduct{VendorToProductId: $vendorToProductId}) return v"
            , {vendorToProductId: vendorToProductId}));

            if (responseVendorProduct.records.length == 0){
                await connection.close();
                await session.close();
                throw new Error(`Vendor's product with ID ${vendorToProductId} does not exist!`);
            }

            let vendorProductConverted = vendorToProduct.dataValues as VendorToProduct;

            // Check if the product is already present
            let productInCardResponse = await session.executeRead(tx => tx.run(
                "MATCH (c:ShoppingCart{CartId: $cartId})<-[r:IS_IN]-(v:VendorToProduct{VendorToProductId:$vendorToProductId}) return r"
            , {cartId: shoppingCartId, vendorToProductId: vendorToProductId}));


            if (productInCardResponse.records.length == 0){
                if (amount > vendorProductConverted.inventoryLevel){
                    await connection.close();
                    await session.close();
                    throw new Error(`Invalid amount ${amount} selected (surpasses inventory level of vendor's product with ID ${vendorToProductId}!`);
                }

                let query = "MATCH (v:VendorToProduct{VendorToProductId: $vendorToProductId}), (s:ShoppingCart{CartId: $cartId}) CREATE (v)-[r:IS_IN{Amount: TOINTEGER($amount)}]->(s)";
                await session.executeWrite(tx => tx.run(query, {vendorToProductId: vendorToProductId, cartId: shoppingCartId, amount: amount}));
            } else{
                let cartRelationship = productInCardResponse.records[0].get("r") as IS_IN;
                let amountConverted = Number(amount) + Number(cartRelationship.properties.Amount);
                if (amountConverted > vendorProductConverted.inventoryLevel){
                    await connection.close();
                    await session.close();
                    throw new Error(`Invalid amount ${amount} selected (surpasses inventory level of vendor's product with ID ${vendorToProductId}!`);
                }

                let query = "MATCH (v:VendorToProduct{VendorToProductId: $vendorToProductId})-[r:IS_IN]-> (s:ShoppingCart{CartId: $cartId}) SET r.Amount = TOINTEGER($amount)";
                await session.executeWrite(tx => tx.run(query, {vendorToProductId: vendorToProductId, cartId: shoppingCartId, amount: amountConverted}))
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

    public async removeProductFromCart(vendorToProductId: number, shoppingCartId: number, amount: number): Promise<void>{
        let connection: Sequelize = await this.intializeMSSQL();

        try{
            let cart = await connection.models.ShoppingCart.findOne({where: {cartId: shoppingCartId}});

            if (cart == null){
                await connection.close();
                throw new Error(`No cart under the given ID ${shoppingCartId} exists!`);
            }

            let cartConverted = cart.dataValues as ShoppingCart;
            let vendorToProduct = await connection.models.VendorToProduct.findOne({where: {vendorToProductId: vendorToProductId}});

            if (vendorToProduct == null){
                await connection.close();
                throw new Error(`No vendor product under the given ID ${vendorToProductId} exists!`);
            }

            let vendorProductConverted = vendorToProduct.dataValues as VendorToProduct;
            
            let productToCart = await connection.models.ProductToCart.findOne({where: {vendorToProductId: vendorToProductId, cartId: shoppingCartId}});

            if (productToCart == null){
                await connection.close();
                throw new Error(`No vendor's product with ID ${vendorToProductId} was located in the cart with ID ${shoppingCartId}!`);
            } 
            
            let productToCartConverted = productToCart.dataValues as ProductToCart;

            if (amount > productToCartConverted.amount){
                await connection.close();
                throw new Error(`Invalid amount ${amount} selected (surpasses shopping cart level of vendor's product with ID ${vendorToProductId}!`);
            }

            await connection.models.ProductToCart.update({amount: productToCartConverted.amount - amount}, {where: {vendorToProductId: vendorToProductId, cartId: shoppingCartId}});

            if (amount == productToCartConverted.amount){
                await connection.close();
                await connection.models.ProductToCart.destroy({where: {vendorToProductId: vendorToProductId, cartId: shoppingCartId}})
            }

            await connection.close();
        }
        catch (err){
            await connection.close();
            throw err;
        }  
    }

    public async getSupplierInformation(supplierId: number): Promise<SupplierInformation>{
        let connection: Sequelize = await this.intializeMSSQL();

        try{
            let supplierData = await connection.models.Supplier.findOne({where: {supplierId: supplierId}});

            if (supplierData == null){
                await connection.close();
                throw new Error(`Supplier with ID ${supplierId} does not exist!`);
            }

            let supplierDataConverted = supplierData.dataValues as Supplier;
            let addresses = await connection.query("select a.* from SupplierToAddress sa " +
                "left outer join Address a " +
                  "on sa.AddressId = a.AddressId " +
                  `where sa.SupplierId = ${supplierId}`);
            let addressesConverted: Address[] = addresses[0].map(function(v){
                return {addressId: v["AddressId"], street: v["Street"], city: v["City"], postalCode: v["PostalCode"], country: v["Country"]} as Address;
            });
            let result = {
                supplierId: supplierId,
                name: supplierDataConverted.name,
                email: supplierDataConverted.email,
                phoneNumber: supplierDataConverted.phoneNumber,
                supplierAddresses: addressesConverted
            } as SupplierInformation;
            await connection.close();
            return result;
        }
        catch (err){
            await connection.close();
            throw err;
        }  
    }

    public async isItemAvailable(vendorToProductId: number, amount: number): Promise<boolean>{
        let connection: Sequelize = await this.intializeMSSQL();

        try{
            let vendorToProduct = await connection.models.VendorToProduct.findOne({where: {vendorToProductId}});

            if (vendorToProduct == null){
                await connection.close();
                return false;
            }

            let vendorToProductConverted = vendorToProduct.dataValues as VendorToProduct;

            await connection.close();
            return (!(amount > vendorToProductConverted.inventoryLevel));
        }
        catch (err){
            await connection.close();
            throw err;
        }  
    }

    public async makeOrder(shoppingCartId: number, billingAddressId: number, supplierCompanyId: number): Promise<CustomerOrder>{
        let connection: Sequelize = await this.intializeMSSQL();

        try{
            // Check if the address is valid
            let address = await connection.models.Address.findOne({where: {addressId: billingAddressId}});

            if (address == null){
                await connection.close();
                throw new Error(`No address under the given ID ${billingAddressId} exists!`);
            }

            // Check if the supplier exists
            let supplier = await connection.models.Supplier.findOne({where: {supplierId: supplierCompanyId}});

            if (supplier == null){
                await connection.close();
                throw new Error(`No supplier under the given ID ${supplierCompanyId} exists!`);
            }

            // Check if the shopping cart exists
            let cart = await connection.models.ShoppingCart.findOne({where: {cartId: shoppingCartId}});

            if (cart == null){
                await connection.close();
                throw new Error(`No cart under the given ID ${shoppingCartId} exists!`);
            }

            let cartConverted = cart.dataValues as ShoppingCart;

            // Retrieve products in cart
            let productToCarts = await connection.models.ProductToCart.findAll({where: {cartId: shoppingCartId}});

            if (productToCarts.length == 0){
                await connection.close();
                throw new Error(`No products were located in the cart with ID ${shoppingCartId}!`);
            } 

            let productToCartsConverted: ProductToCart[] = productToCarts.map(function(v){
                let r = {productToCartId: v.dataValues["productToCartId"], vendorToProductId: v.dataValues["vendorToProductId"],
                    cartId: v.dataValues["cartId"], amount: v.dataValues["amount"],
                } as ProductToCart;
                return r;
            });

            // Check if items are available
            for (let item of productToCartsConverted){
                let available = await this.isItemAvailable(item.vendorToProductId, item.amount);

                if (!available){
                    await connection.close();
                    throw new Error(`Vendor's item with ID ${item.vendorToProductId} is not availabe in amount of ${item.amount}!`);
                }
            }

            // Create new order
            let orderId = await this.getNewId("CustomerOrder", "OrderId");
            sequelize.DATE.prototype._stringify = function _stringify(date, options) {
                return this._applyTimezone(date, options).format('YYYY-MM-DD HH:mm:ss.SSS');
                };
            let order = {orderId: orderId, orderName: null, orderDate: new Date(), customerId: cartConverted.customerId, billingAddressId: billingAddressId, isPaid: false} as CustomerOrder;
            await connection.models.CustomerOrder.create(order as any);

            for (let item of productToCartsConverted){
                await this.placeItem(order, item, supplierCompanyId);
            }

            await connection.close();
            return order;
        }
        catch (err){
            await connection.close();
            throw err;
        }  
    }

    public async placeItem(order: CustomerOrder, orderItem: ProductToCart, supplierCompanyId: number): Promise<void>{
        let connection: Sequelize = await this.intializeMSSQL();

        try{
            // Check if the order is valid
            let orderInDB = await connection.models.CustomerOrder.findOne({where: {orderId: order.orderId}});

            if (orderInDB == null){
                await connection.close();
                throw new Error(`Order with ID ${order.orderId} does not exist!`);
            }

            // Check if the address is valid
            let address = await connection.models.Address.findOne({where: {addressId: order.billingAddressId}});

            if (address == null){
                await connection.close();
                throw new Error(`No address under the given ID ${order.billingAddressId} exists!`);
            }

            // Check if the supplier exists
            let supplier = await connection.models.Supplier.findOne({where: {supplierId: supplierCompanyId}});

            if (supplier == null){
                await connection.close();
                throw new Error(`No supplier under the given ID ${supplierCompanyId} exists!`);
            }

            // Create order position object
            sequelize.DATE.prototype._stringify = function _stringify(date, options) {
                return this._applyTimezone(date, options).format('YYYY-MM-DD HH:mm:ss.SSS');
                };
            let date = new Date();
            date.setDate(date.getDate() + 14);
            let newId = await this.getNewId("OrderPosition", "OrderPositionId");
            let orderPosition = {orderPositionId: newId, orderId: order.orderId, amount: orderItem.amount, 
                vendorToProductId: orderItem.vendorToProductId, supplierCompanyId: supplierCompanyId, 
                deliveryDate: date, deliveryAddressId: order.billingAddressId
            } as OrderPosition;
            
            // Create the order item
            await connection.models.OrderPosition.create(orderPosition as any);

            // Remove the order item from cart
            await connection.models.ProductToCart.destroy({where: {vendorToProductId: orderItem.vendorToProductId, cartId: orderItem.cartId}});

            // Update the inventory level
            let vendorToProduct = await connection.models.VendorToProduct.findOne({where: {vendorToProductId: orderItem.vendorToProductId}});
            let productConverted = vendorToProduct.dataValues as VendorToProduct;
            let isAvailable = await this.isItemAvailable(orderItem.vendorToProductId, orderItem.amount);

            if (!isAvailable){
                await connection.close();
                throw new Error(`The amount ${orderItem.amount} exceeeds the inventory level of vendor's product with ID ${productConverted.vendorToProductId}!`);
            }

            await connection.models.VendorToProduct.update({inventoryLevel: productConverted.inventoryLevel - orderItem.amount}, {where: {vendorToProductId: orderItem.vendorToProductId}});
            await connection.close();
        }
        catch (err){
            await connection.close();
            throw err;
        }  
    }

    public async deleteShoppingCartReferences(customerId: number): Promise<void>{
        let driver = await this.initializeNeo4j();
        let session = driver.session();

        try{
            await session.executeWrite(tx => tx.run("MATCH (v:VendorToProduct)-[r:IS_IN]->(c:ShoppingCart{CustomerId: $customerId}) DELETE r", {customerId: customerId}));
            await session.close();
        }
        catch (err){
            await session.close();
            throw err;
        }  
    }

    public async deleteShoppingCarts(customerId: number): Promise<void>{
        let connection: Sequelize = await this.intializeMSSQL();

        try{
            let ids = await connection.models.ShoppingCart.findAll({attributes: ["cartId"],where: {customerId: customerId}});
            let idValues = ids.map(function(v){
                return Number(v.dataValues["cartId"]);
            });

            for (let cartId of idValues){
                await this.deleteShoppingCart(cartId);
            }
        }
        catch (err){
            await connection.close();
            throw err;
        } 
    }

    public async deleteShoppingCart(cartId: number): Promise<void>{
        let connection: Sequelize = await this.intializeMSSQL();
        let driver = await this.initializeNeo4j();
        let session = driver.session();

        try{
            // Check if the cart is referenced
            let foundReferenceResponse = await session.executeRead(tx => tx.run<VendorToProductNeo4j>(
                "MATCH (v:VendorToProduct)-[r:IS_IN]->(c:ShoppingCart{CartId: $cartId}) RETURN v"
            , {cartId: cartId}));

            if (foundReferenceResponse.records.length > 0){
                await connection.close();
                await session.close();
                throw new Error(`Cart with ID ${cartId} is referenced and cannot be deleted!`);
            }

            // Delete the cart
            await connection.models.ShoppingCart.destroy({where: {cartId: cartId}});
            await session.executeWrite(tx => tx.run("MATCH (c:ShoppingCart{CartId: $cartId}) DELETE c", {cartId: cartId}));
            await connection.close();
            await session.close();
        }
        catch (err){
            await connection.close();
            await session.close();
            throw err;
        } 
    }

    public async deleteCustomer(customerId: number): Promise<void>{
        let connection: Sequelize = await this.intializeMSSQL();
        let driver = await this.initializeNeo4j();
        let session = driver.session();
        await mongoose.connect(process.env.MONGODB_URI, {dbName: process.env.MONGODB_DATABASE});

        try{
            // Check if the customer is referenced in Neo4j
            // Shopping cart replicate
            let foundReferenceResponse = await session.executeRead(tx => tx.run<ShoppingCartNeo4j>(
                "MATCH (s:ShoppingCart{CustomerId: $customerId}) RETURN s"
            , {customerId: customerId}));

            if (foundReferenceResponse.records.length > 0){
                await connection.close();
                await session.close();
                await mongoose.disconnect();
                throw new Error(`Customer with ID ${customerId} is referenced and cannot be deleted!`);
            }

            // Check if the customer is referenced in MongoDB
            // Review
            let Review = mongoose.model<IReview>("Review", reviewSchema, "Review");
            let foundReview = await Review.findOne({'customerId': customerId});

            if (foundReview != null){
                await connection.close();
                await session.close();
                await mongoose.disconnect();
                throw new Error(`Customer with ID ${customerId} is referenced and cannot be deleted!`);
            }

            // ProductRecommendation
            let ProductRecommendation = mongoose.model<IProductRecommendation>("ProductRecommendation", recommendationSchema, "ProductRecommendation");
            let foundRecommendation = await ProductRecommendation.findOne({'customerId': customerId});

            if (foundRecommendation != null){
                await connection.close();
                await session.close();
                await mongoose.disconnect();
                throw new Error(`Customer with ID ${customerId} is referenced and cannot be deleted!`);
            }

            // CustomerAction
            let CustomerAction = mongoose.model<ICustomerAction>("CustomerAction", customerActionSchema, "CustomerAction");
            let foundAction = await CustomerAction.findOne({'customerId': customerId});
            console.log(foundAction)

            if (foundAction != null){
                await connection.close();
                await session.close();
                await mongoose.disconnect();
                throw new Error(`Customer with ID ${customerId} is referenced and cannot be deleted!`);
            }


            await connection.models.Customer.destroy({where: {customerId: customerId}});
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

            sequelize.define("ShoppingCart",
                {
                    cartId: {
                        type: DataTypes.INTEGER,
                        allowNull: false,
                        primaryKey: true

                    },
                    customerId: {
                        type: DataTypes.INTEGER,
                        allowNull: false,
                    },
                    dateCreated:{
                        type: DataTypes.DATE,
                        allowNull: false
                    }
                },
                {
                    tableName: "ShoppingCart",
                    modelName: "ShoppingCart",
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

            sequelize.define("Vendor",
                {
                    vendorId: {
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
                        allowNull: true
                    },
                    userName: {
                        type: DataTypes.STRING,
                        allowNull: false
                    },
                    password: {
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

            resolve(sequelize);
        })
    }
}