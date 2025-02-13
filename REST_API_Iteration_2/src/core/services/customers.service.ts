import 'reflect-metadata';
import { inject, injectable } from 'inversify';
import { Sequelize } from "sequelize";
import { Customer } from '../../models/customer.model';
import { ShoppingCart } from '../../models/shopping.cart.model';
import { Address } from '../../models/address.model';
import { CustomerToAddress } from '../../models/customer.to.address.model';
import { VendorToProduct } from '../../models/vendor.to.product.model';
import { Vendor } from '../../models/vendor.model';
import { VendorInformation } from '../../models/vendor.information.model';
import { ProductToCart } from '../../models/product.to.cart.model';
import { SupplierInformation } from '../../models/supplier.information.model';
import { Supplier } from '../../models/supplier.model';
import { CustomerOrder } from '../../models/customer.order.model';
import sequelize = require('sequelize');
import { OrderPosition } from '../../models/order.position.model';
import neo4j from 'neo4j-driver';
import * as mongoose from "mongoose";
import { VendorToProduct as VendorToProductNeo4j } from '../../models/neo4j.models/vendor.to.product.neo4j.model';
import { ShoppingCart as ShoppingCartNeo4j } from '../../models/neo4j.models/shopping.cart.neo4j.model';
import { IReview } from '../../models/mongodb.models/mongodb.interfaces/review.mongodb.interface';
import { IS_IN } from '../../models/neo4j.models/is.in.neo4j.model'
import reviewSchema from '../../models/mongodb.models/mongodb.schemas/review.mongodb.schema';
import { IProductRecommendation } from '../../models/mongodb.models/mongodb.interfaces/product.recommendation.mongodb.interface';
import recommendationSchema from '../../models/mongodb.models/mongodb.schemas/product.recommendation.mongodb.schema';
import { ICustomerAction } from '../../models/mongodb.models/mongodb.interfaces/customer.action.mongodb.interface';
import customerActionSchema from '../../models/mongodb.models/mongodb.schemas/customer.action.mongodb.schema';
import { CustomerAction } from '../../models/customer.action.model';
import { VendorProductIsInCart } from '../../models/neo4j.models/product.is.in.cart.neo4j.model';
import { MssqlDatabaseService } from './mssql.database.service';
import { Neo4jDatabaseService } from './neo4j.database.service';
import { AddressService } from './address.service';
import { LoggerService } from './logger.service';
import { MongoDbDatabaseService } from './mongodb.database.service';
import { CustomerActionsService } from './customer.actions.service';

@injectable()
/**
 * The customers service.
 */
export class CustomersService {
    /**
     * Initializes the customers service.
     * @param mssqlDatabaseService The MSSQL database service.
     * @param neo4jDatabaseService The Neo4j database service.
     * @param mongoDBDatabaseService The MongoDB database service.
     * @param addressService The address service.
     * @param customerActionService The customer actions service.
     * @param loggerService The logger service.
     */
    constructor(
        @inject(MssqlDatabaseService.name) private mssqlDatabaseService: MssqlDatabaseService,
        @inject(Neo4jDatabaseService.name) private neo4jDatabaseService: Neo4jDatabaseService,
        @inject(MongoDbDatabaseService.name) private mongoDBDatabaseService: MongoDbDatabaseService,
        @inject(AddressService.name) private addressService: AddressService,
        @inject(CustomerActionsService.name) private customerActionService: CustomerActionsService,
        @inject(LoggerService.name) private loggerService: LoggerService
    ) { }

    /**
     * Returns a boolean indicating whether the customer exists by username.
     * @param userName The username.
     * @returns Boolean indicating whether the customer exists by username.
     */
    public async doesUsernameExist(userName: string): Promise<boolean> {
        let connection: Sequelize = await this.mssqlDatabaseService.initialize();

        try {
            let user = await connection.models.Customer.findOne({ where: { userName: userName } });
            this.loggerService.logInfo(`Fetched Customer with data ${JSON.stringify({ userName: userName })}.`, "CustomersService-MSSQL");
            await connection.close();
            return user !== null;
        }
        catch (err) {
            await connection.close();
            throw err;
        }
    }

    /**
     * Creates a new customer.
     * @param customer The customer to create.
     * @returns The created customer.
     */
    public async createNewCustomer(customer: Customer): Promise<Customer> {
        let connection: Sequelize = await this.mssqlDatabaseService.initialize();

        try {
            let foundCustomer = await connection.models.Customer.findByPk(customer.customerId);
            this.loggerService.logInfo(`Fetched Customer with ID '${customer.customerId}'.`, "CustomersService-MSSQL");

            if (foundCustomer !== null) {
                await connection.close();
                this.loggerService.logError(`Customer with ID '${customer.customerId}' already exists.`, "CustomersService");
                throw new Error(`Customer with ID '${customer.customerId}' already exists!`);
            }

            let created = await connection.models.Customer.create(customer as any);
            this.loggerService.logInfo(`Created Customer with ID '${customer.customerId}'.`, "CustomersService-MSSQL");
            let createdConverted = created.dataValues as Customer;
            await connection.close();
            return createdConverted;
        }
        catch (err) {
            await connection.close();
            throw err;
        }
    }

    /**
     * Updates an existing customer.
     * @param customer The customer update data.
     * @param customerId The customer ID.
     * @returns The updated customer.
     */
    public async updateExistingCustomer(customer: Customer, customerId: number): Promise<Customer> {
        let connection: Sequelize = await this.mssqlDatabaseService.initialize();

        try {
            if (customer.customerId !== customerId) {
                await connection.close();
                this.loggerService.logError(`IDs '${customerId}' and '${customer.customerId}' do not match.`, "CustomersService");
                throw new Error(`IDs '${customerId}' and '${customer.customerId}' do not match!`)
            }

            let foundCustomer = await connection.models.Customer.findByPk(customer.customerId);
            this.loggerService.logInfo(`Fetched Customer with ID '${customer.customerId}'.`, "CustomersService-MSSQL");

            if (foundCustomer == null) {
                await connection.close();
                this.loggerService.logError(`Customer with ID '${customer.customerId}' does not exist.`, "CustomersService");
                throw new Error(`Customer with ID '${customer.customerId}' does not exist!`);
            }

            await connection.models.Customer.update(customer, { where: { customerId: customerId } });
            this.loggerService.logInfo(`Customer with ID '${customerId}' was updated.`, "CustomersService-MSSQL");
            await connection.close();
            return customer;
        }
        catch (err) {
            await connection.close();
            throw err;
        }
    }

    /**
     * Creates a new shopping cart.
     * @param cart The cart to create.
     * @returns The created shopping cart.
     */
    public async createNewShoppingCart(cart: ShoppingCart): Promise<ShoppingCart> {
        let connection: Sequelize = await this.mssqlDatabaseService.initialize();
        let driver = await this.neo4jDatabaseService.initialize();
        let session = driver.session();

        try {
            // Check if the cart exists in MSSQL
            let foundCart = await connection.models.ShoppingCart.findByPk(cart.cartId);
            this.loggerService.logInfo(`Fetched ShoppingCart with ID '${cart.cartId}'.`, "CustomersService-MSSQL");

            if (foundCart !== null) {
                await connection.close();
                await session.close();
                this.loggerService.logError(`Cart with ID '${cart.cartId}' already exists.`, "CustomersService");
                throw new Error(`Cart with ID '${cart.cartId}' already exists!`);
            }

            // Check if the cart exists in Neo4j
            let foundReferenceResponse = await session.executeRead(tx => tx.run<ShoppingCartNeo4j>(
                "MATCH (c:ShoppingCart{CartId: $cartId}) RETURN c"
                , { cartId: cart.cartId }));
            this.loggerService.logInfo(`Fetched ShoppingCart with ID '${cart.cartId}'.`, "CustomersService-Neo4j");

            if (foundReferenceResponse.records.length > 0) {
                await connection.close();
                await session.close();
                this.loggerService.logError(`Cart with ID '${cart.cartId}' already exists.`, "CustomersService");
                throw new Error(`Cart with ID '${cart.cartId}' already exists!`);
            }

            // Check if customer exists
            let foundCustomer = await connection.models.Customer.findByPk(cart.customerId);
            this.loggerService.logInfo(`Fetched Customer with ID '${cart.customerId}'.`, "CustomersService-MSSQL");

            if (foundCustomer == null) {
                await connection.close();
                await session.close();
                this.loggerService.logError(`Customer with ID '${cart.customerId}' does not exist.`, "CustomersService");
                throw new Error(`Customer with ID '${cart.customerId}' does not exist!`);
            }

            // Create the cart in MSSQL
            let created = await connection.models.ShoppingCart.create(cart as any);
            this.loggerService.logInfo(`Created ShoppingCart with ID '${cart.cartId}'.`, "CustomersService-MSSQL");
            let createdConverted = created.dataValues as ShoppingCart;

            // Create replicate in Neo4j
            let dateConverted = neo4j.types.DateTime.fromStandardDate(cart.dateCreated);
            await session.executeWrite(tx => tx.run(
                "CREATE (c:ShoppingCart{CartId: TOINTEGER($cartId), CustomerId: TOINTEGER($customerId), DateCreated: $dateCreated}) "
                , { cartId: cart.cartId, customerId: cart.customerId, dateCreated: dateConverted }));
            this.loggerService.logInfo(`Created ShoppingCart with ID '${cart.cartId}'.`, "CustomersService-Neo4j");

            await connection.close();
            await session.close();
            return createdConverted;
        }
        catch (err) {
            await connection.close();
            await session.close();
            throw err;
        }
    }

    /**
     * Registers a new address for the given customer.
     * @param address The address to register.
     * @param customer The customer.
     * @returns The registered address.
     */
    public async createNewCustomerAddress(address: Address, customer: Customer): Promise<Address> {
        let connection: Sequelize = await this.mssqlDatabaseService.initialize();

        try {
            let foundAddress = await connection.models.Address.findByPk(address.addressId);
            this.loggerService.logInfo(`Fetched Address with ID '${address.addressId}'.`, "CustomersService-MSSQL");

            if (foundAddress !== null) {
                await connection.close();
                this.loggerService.logError(`Address with ID '${address.addressId}' already exists.`, "CustomersService");
                throw new Error(`Address with ID '${address.addressId}' already exists!`);
            }

            let whereClause = { street: address.street, city: address.city, postalCode: address.postalCode, country: address.country };
            let existingAddress = await connection.models.Address.findOne({ where: whereClause });
            this.loggerService.logInfo(`Fetched Address with data ${JSON.stringify(whereClause)}.`, "CustomersService-MSSQL");

            if (existingAddress !== null) {
                await connection.close();
                let createdReference = await this.createNewCustomerAddressReference(existingAddress.dataValues as Address, customer);
                return existingAddress.dataValues as Address;
            }

            let newAddress = await this.addressService.createNewAddress(address);
            let createdReference = await this.createNewCustomerAddressReference(newAddress, customer);
            let createdConverted = newAddress;
            await connection.close();
            return createdConverted;
        }
        catch (err) {
            await connection.close();
            throw err;
        }
    }

    /**
     * Creates an address reference to the given customer.
     * @param address The address to reference.
     * @param customer The customer.
     * @returns The created address reference.
     */
    public async createNewCustomerAddressReference(address: Address, customer: Customer): Promise<CustomerToAddress> {
        let connection: Sequelize = await this.mssqlDatabaseService.initialize();

        try {
            let whereClause = { customerId: customer.customerId, addressId: address.addressId };
            let foundAddress = await connection.models.CustomerToAddress.findOne({ where: whereClause });
            this.loggerService.logInfo(`Fetched CustomerToAddress with data ${JSON.stringify(whereClause)}.`, "CustomersService-MSSQL");

            if (foundAddress !== null) {
                await connection.close();
                this.loggerService.logError(`Customer address reference with address ID '${address.addressId}' and customer ID '${customer.customerId}' already exists.`, "CustomersService");
                throw new Error(`Customer address reference with address ID '${address.addressId}' and customer ID '${customer.customerId}' already exists!`);
            }

            let newId = await this.mssqlDatabaseService.getNewId("CustomerToAddress", "CustomerToAddressId");
            let customerToAddress = { customerToAddressId: newId, addressId: address.addressId, customerId: customer.customerId } as CustomerToAddress;
            let created = await connection.models.CustomerToAddress.create(customerToAddress as any);
            this.loggerService.logInfo(`Created CustomerToAddress with ID '${newId}'.`, "CustomersService-MSSQL");
            let createdConverted = created.dataValues as CustomerToAddress;
            await connection.close();
            return createdConverted;
        }
        catch (err) {
            await connection.close();
            throw err;
        }
    }

    /**
     * Updates an address for the given customer.
     * @param address The address.
     * @param customer The customer.
     * @returns The updated address.
     */
    public async updateCustomerAddress(address: Address, customer: Customer): Promise<Address> {
        let connection: Sequelize = await this.mssqlDatabaseService.initialize();

        try {
            await connection.models.CustomerToAddress.destroy({ where: { addressId: address.addressId, customerId: customer.customerId } });
            this.loggerService.logInfo(`Deleted CustomerToAddress with data ${JSON.stringify({ addressId: address.addressId, customerId: customer.customerId })}.`, "CustomersService-MSSQL");
            let whereClause = { street: address.street, city: address.city, postalCode: address.postalCode, country: address.country };
            let existingAddress = await connection.models.Address.findOne({ where: whereClause });
            this.loggerService.logInfo(`Fetched Address with data ${JSON.stringify(whereClause)}.`, "CustomersService-MSSQL");
            let addressToReturn: Address = null;

            if (existingAddress !== null) {
                let createdReference = await this.createNewCustomerAddressReference(existingAddress.dataValues as Address, customer);
                addressToReturn = existingAddress.dataValues as Address;
            } else {
                let newId = await this.mssqlDatabaseService.getNewId("Address", "AddressId");
                let addressTocreate = { addressId: newId, street: address.street, city: address.city, postalCode: address.postalCode, country: address.country } as Address;
                let newAddress = await this.addressService.createNewAddress(addressTocreate);
                let createdReference = await this.createNewCustomerAddressReference(newAddress, customer);
                addressToReturn = newAddress;
            }

            // Delete old address if no existing references
            let foundCustomerReference = connection.models.CustomerToAddress.findOne({ where: { addressId: address.addressId } });
            this.loggerService.logInfo(`Fetched CustomerToAddress with data ${JSON.stringify({ addressId: address.addressId })}.`, "CustomersService-MSSQL");
            let foundVendorReference = connection.models.VendorToAddress.findOne({ where: { addressId: address.addressId } });
            this.loggerService.logInfo(`Fetched VendorToAddress with data ${JSON.stringify({ addressId: address.addressId })}.`, "CustomersService-MSSQL");
            let foundSupplierReference = connection.models.SupplierToAddress.findOne({ where: { addressId: address.addressId } });
            this.loggerService.logInfo(`Fetched SupplierToAddress with data ${JSON.stringify({ addressId: address.addressId })}.`, "CustomersService-MSSQL");
            let foundDeliveryReference = connection.models.OrderPosition.findOne({ where: { deliveryAddressId: address.addressId } });
            this.loggerService.logInfo(`Fetched OrderPosition with data ${JSON.stringify({ deliveryAddressId: address.addressId })}.`, "CustomersService-MSSQL");
            let foundOrderReference = connection.models.CustomerOrder.findOne({ where: { billingAddressId: address.addressId } });
            this.loggerService.logInfo(`Fetched CustomerOrder with data ${JSON.stringify({ billingAddressId: address.addressId })}.`, "CustomersService-MSSQL");

            let foundCustomerResult = await foundCustomerReference;

            if (foundCustomerResult !== null) {
                await connection.close();
                return addressToReturn;
            }

            let foundVendorResult = await foundVendorReference;

            if (foundVendorResult !== null) {
                await connection.close();
                return addressToReturn;
            }

            let foundSupplierResult = await foundSupplierReference;

            if (foundSupplierResult !== null) {
                await connection.close();
                return addressToReturn;
            }

            let foundDeliveryResult = await foundDeliveryReference;

            if (foundDeliveryResult !== null) {
                await connection.close();
                return addressToReturn;
            }

            let foundOrderResult = await foundOrderReference;

            if (foundOrderResult !== null) {
                await connection.close();
                return addressToReturn;
            }

            await connection.models.Address.destroy({ where: { addressId: address.addressId } });
            this.loggerService.logInfo(`Deleted Address with data ${JSON.stringify({ addressId: address.addressId })}.`, "CustomersService-MSSQL");
            await connection.close();
            return addressToReturn;
        }
        catch (err) {
            await connection.close();
            throw err;
        }
    }

    /**
     * Deletes the addresses for the given customer.
     * @param addressIds The address IDs.
     * @param customerId The customer ID.
     */
    public async deleteCustomerAddresses(addressIds: Array<number>, customerId: number): Promise<void> {
        try {
            for (let addressId of addressIds) {
                await this.deleteCustomerAddress(addressId, customerId);
            }
        }
        catch (err) {
            throw err;
        }
    }

    /**
     * Deletes the given address from the given customer.
     * @param addressId The address ID.
     * @param customerId The customer ID.
     */
    public async deleteCustomerAddress(addressId: number, customerId: number): Promise<void> {
        let connection: Sequelize = await this.mssqlDatabaseService.initialize();

        try {
            await connection.models.CustomerToAddress.destroy({ where: { addressId: addressId, customerId: customerId } });
            this.loggerService.logInfo(`Deleted CustomerToAddress with data ${JSON.stringify({ addressId: addressId, customerId: customerId })}.`, "CustomersService-MSSQL");

            // Delete old address if no existing references
            let foundCustomerReference = connection.models.CustomerToAddress.findOne({ where: { addressId: addressId } });
            this.loggerService.logInfo(`Fetched CustomerToAddress with data ${JSON.stringify({ addressId: addressId })}.`, "CustomersService-MSSQL");
            let foundVendorReference = connection.models.VendorToAddress.findOne({ where: { addressId: addressId } });
            this.loggerService.logInfo(`Fetched VendorToAddress with data ${JSON.stringify({ addressId: addressId })}.`, "CustomersService-MSSQL");
            let foundSupplierReference = connection.models.SupplierToAddress.findOne({ where: { addressId: addressId } });
            this.loggerService.logInfo(`Fetched SupplierToAddress with data ${JSON.stringify({ addressId: addressId })}.`, "CustomersService-MSSQL");
            let foundDeliveryReference = connection.models.OrderPosition.findOne({ where: { deliveryAddressId: addressId } });
            this.loggerService.logInfo(`Fetched OrderPosition with data ${JSON.stringify({ deliveryAddressId: addressId })}.`, "CustomersService-MSSQL");
            let foundOrderReference = connection.models.CustomerOrder.findOne({ where: { billingAddressId: addressId } });
            this.loggerService.logInfo(`Fetched CustomerOrder with data ${JSON.stringify({ billingAddressId: addressId })}.`, "CustomersService-MSSQL");

            let foundCustomerResult = await foundCustomerReference;

            if (foundCustomerResult !== null) {
                await connection.close();
                return;
            }

            let foundVendorResult = await foundVendorReference;

            if (foundVendorResult !== null) {
                await connection.close();
                return;
            }

            let foundSupplierResult = await foundSupplierReference;

            if (foundSupplierResult !== null) {
                await connection.close();
                return;
            }

            let foundDeliveryResult = await foundDeliveryReference;

            if (foundDeliveryResult !== null) {
                await connection.close();
                return;
            }

            let foundOrderResult = await foundOrderReference;

            if (foundOrderResult !== null) {
                await connection.close();
                return;
            }

            await connection.models.Address.destroy({ where: { addressId: addressId } });
            this.loggerService.logInfo(`Deleted Address with data ${JSON.stringify({ addressId: addressId })}.`, "CustomersService-MSSQL");
            await connection.close();
        }
        catch (err) {
            await connection.close();
            throw err;
        }
    }

    /**
     * Retrieves vendor information based on one of their products.
     * @param vendorToProductId The vendor's product ID.
     * @returns The vendor information.
     */
    public async getVendorInformation(vendorToProductId: number): Promise<VendorInformation> {
        let connection: Sequelize = await this.mssqlDatabaseService.initialize();

        try {
            let vendorToProductData = await connection.models.VendorToProduct.findOne({ where: { vendorToProductId: vendorToProductId } });
            this.loggerService.logInfo(`Fetched VendorToProduct with data ${JSON.stringify({ vendorToProductId: vendorToProductId })}.`, "CustomersService-MSSQL");

            if (vendorToProductData == null) {
                await connection.close();
                this.loggerService.logError(`Vendor's product with ID '${vendorToProductId}' does not exist.`, "CustomersService");
                throw new Error(`Vendor's product with ID '${vendorToProductId}' does not exist!`);
            }

            let vendorToProductDataConverted = vendorToProductData.dataValues as VendorToProduct;
            let vendorData = await connection.models.Vendor.findOne({ where: { vendorId: vendorToProductDataConverted.vendorId } });
            this.loggerService.logInfo(`Fetched Vendor with ID '${vendorToProductDataConverted.vendorId}'.`, "CustomersService-MSSQL");
            let vendorDataConverted = vendorData.dataValues as Vendor;
            let addresses = await connection.query("select a.* from VendorToAddress va " +
                "left outer join Address a " +
                "on va.AddressId = a.AddressId " +
                `where va.VendorId = ${vendorToProductDataConverted.vendorId}`);
            this.loggerService.logInfo(`Fetched Address for Vendor with ID '${vendorToProductDataConverted.vendorId}'.`, "CustomersService-MSSQL");
            let addressesConverted: Address[] = addresses[0].map(function(v) {
                return { addressId: v["AddressId"], street: v["Street"], city: v["City"], postalCode: v["PostalCode"], country: v["Country"] } as Address;
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
        catch (err) {
            await connection.close();
            throw err;
        }
    }

    /**
     * Adds the given amount of items of the product to the customer's cart.
     * @param vendorToProductId The vendor's product ID.
     * @param shoppingCartId The shopping cart ID.
     * @param amount The amount to add.
     */
    public async addProductToCart(vendorToProductId: number, shoppingCartId: number, amount: number): Promise<void> {
        let connection: Sequelize = await this.mssqlDatabaseService.initialize();
        let driver = await this.neo4jDatabaseService.initialize();
        let session = driver.session();

        try {
            // Check if cart exists in MSSQL
            let cart = await connection.models.ShoppingCart.findOne({ where: { cartId: shoppingCartId } });
            this.loggerService.logInfo(`Fetched ShoppingCart with ID '${shoppingCartId}'.`, "CustomersService-MSSQL");


            if (cart == null) {
                await connection.close();
                await session.close();
                this.loggerService.logError(`No cart under the given ID '${shoppingCartId}' exists.`, "CustomersService");
                throw new Error(`No cart under the given ID '${shoppingCartId}' exists!`);
            }

            // Check if the cart exists in Neo4j
            let response = await session.executeRead(tx => tx.run<ShoppingCartNeo4j>(
                "MATCH (c:ShoppingCart{CartId: $cartId}) return c"
                , { cartId: shoppingCartId }));
            this.loggerService.logInfo(`Fetched ShoppingCart with ID '${shoppingCartId}'.`, "CustomersService-Neo4j");

            if (response.records.length == 0) {
                await connection.close();
                await session.close();
                this.loggerService.logError(`No cart under the given ID '${shoppingCartId}' exists.`, "CustomersService");
                throw new Error(`No cart under the given ID '${shoppingCartId}' exists!`);
            }

            // Check if vendor's product exists in MSSQL
            let vendorToProduct = await connection.models.VendorToProduct.findOne({ where: { vendorToProductId: vendorToProductId } });
            this.loggerService.logInfo(`Fetched VendorToProduct with ID '${vendorToProductId}'.`, "CustomersService-MSSQL");


            if (vendorToProduct == null) {
                await connection.close();
                await session.close();
                this.loggerService.logError(`No vendor product under the given ID '${vendorToProductId}' exists.`, "CustomersService");
                throw new Error(`No vendor product under the given ID '${vendorToProductId}' exists!`);
            }

            // Check if vendor's product exists in Neo4j
            let responseVendorProduct = await session.executeRead(tx => tx.run<VendorToProductNeo4j>(
                "MATCH (v:VendorToProduct{VendorToProductId: $vendorToProductId}) return v"
                , { vendorToProductId: vendorToProductId }));
            this.loggerService.logInfo(`Fetched VendorToProduct with ID '${vendorToProductId}'.`, "CustomersService-Neo4j");

            if (responseVendorProduct.records.length == 0) {
                await connection.close();
                await session.close();
                this.loggerService.logError(`No vendor product under the given ID '${vendorToProductId}' exists.`, "CustomersService");
                throw new Error(`No vendor product under the given ID '${vendorToProductId}' exists!`);
            }

            let vendorProductConverted = vendorToProduct.dataValues as VendorToProduct;

            // Check if the product is already present
            let productInCartQuery = "MATCH (c:ShoppingCart{CartId: $cartId})<-[r:IS_IN]-(v:VendorToProduct{VendorToProductId:$vendorToProductId}) return r";
            let productInCardResponse = await session.executeRead(tx => tx.run(
                productInCartQuery
                , { cartId: shoppingCartId, vendorToProductId: vendorToProductId }));
            this.loggerService.logInfo("Fetched data with query: " + productInCartQuery + ".", "CustomersService-Neo4j");


            if (productInCardResponse.records.length == 0) {
                if (amount > vendorProductConverted.inventoryLevel) {
                    await connection.close();
                    await session.close();
                    this.loggerService.logError(`Invalid amount ${amount} selected (surpasses inventory level of vendor's product with ID '${vendorToProductId}'.`, "CustomersService");
                    throw new Error(`Invalid amount ${amount} selected (surpasses inventory level of vendor's product with ID '${vendorToProductId}'!`);
                }

                let query = "MATCH (v:VendorToProduct{VendorToProductId: $vendorToProductId}), (s:ShoppingCart{CartId: $cartId}) CREATE (v)-[r:IS_IN{Amount: TOINTEGER($amount)}]->(s)";
                await session.executeWrite(tx => tx.run(query, { vendorToProductId: vendorToProductId, cartId: shoppingCartId, amount: amount }));
                this.loggerService.logInfo("Created data with query: " + query + ".", "CustomersService-Neo4j");
            } else {
                let cartRelationship = productInCardResponse.records[0].get("r") as IS_IN;
                let amountConverted = Number(amount) + Number(cartRelationship.properties.Amount);
                if (amountConverted > vendorProductConverted.inventoryLevel) {
                    await connection.close();
                    await session.close();
                    this.loggerService.logError(`Invalid amount ${amount} selected (surpasses inventory level of vendor's product with ID '${vendorToProductId}'.`, "CustomersService");
                    throw new Error(`Invalid amount ${amount} selected (surpasses inventory level of vendor's product with ID '${vendorToProductId}'!`);
                }

                let query = "MATCH (v:VendorToProduct{VendorToProductId: $vendorToProductId})-[r:IS_IN]-> (s:ShoppingCart{CartId: $cartId}) SET r.Amount = TOINTEGER($amount)";
                await session.executeWrite(tx => tx.run(query, { vendorToProductId: vendorToProductId, cartId: shoppingCartId, amount: amountConverted }));
                this.loggerService.logInfo("Created data with query: " + query + ".", "CustomersService-Neo4j");
            }

            await connection.close();
            await session.close();
        }
        catch (err) {
            await connection.close();
            await session.close();
            throw err;
        }
    }

    /**
     * Removes the given amount of items of the product from the customer's cart.
     * @param vendorToProductId The vendor's product ID.
     * @param shoppingCartId  The shopping cart ID.
     * @param amount The amount to remove.
     */
    public async removeProductFromCart(vendorToProductId: number, shoppingCartId: number, amount: number): Promise<void> {
        let connection: Sequelize = await this.mssqlDatabaseService.initialize();
        let driver = await this.neo4jDatabaseService.initialize();
        let session = driver.session();

        try {
            // Check if cart exists in MSSQL
            let cart = await connection.models.ShoppingCart.findOne({ where: { cartId: shoppingCartId } });
            this.loggerService.logInfo(`Fetched ShoppingCart with ID '${shoppingCartId}'.`, "CustomersService-MSSQL");

            if (cart == null) {
                await connection.close();
                await session.close();
                this.loggerService.logError(`No cart under the given ID '${shoppingCartId}' exists.`, "CustomersService");
                throw new Error(`No cart under the given ID '${shoppingCartId}' exists!`);
            }

            // Check if the cart exists in Neo4j
            let response = await session.executeRead(tx => tx.run<ShoppingCartNeo4j>(
                "MATCH (c:ShoppingCart{CartId: $cartId}) return c"
                , { cartId: shoppingCartId }));
            this.loggerService.logInfo(`Fetched ShoppingCart with ID '${shoppingCartId}'.`, "CustomersService-Neo4j");

            if (response.records.length == 0) {
                await connection.close();
                await session.close();
                this.loggerService.logError(`No cart under the given ID '${shoppingCartId}' exists.`, "CustomersService");
                throw new Error(`No cart under the given ID '${shoppingCartId}' exists!`);
            }

            let cartConverted = cart.dataValues as ShoppingCart;

            // Check if vendor's product exists in MSSQL
            let vendorToProduct = await connection.models.VendorToProduct.findOne({ where: { vendorToProductId: vendorToProductId } });
            this.loggerService.logInfo(`Fetched VendorToProduct with ID '${vendorToProductId}'.`, "CustomersService-MSSQL");

            if (vendorToProduct == null) {
                await connection.close();
                await session.close();
                this.loggerService.logError(`No vendor product under the given ID '${vendorToProductId}' exists.`, "CustomersService");
                throw new Error(`No vendor product under the given ID '${vendorToProductId}' exists!`);
            }

            // Check if vendor's product exists in Neo4j
            let responseVendorProduct = await session.executeRead(tx => tx.run<VendorToProductNeo4j>(
                "MATCH (v:VendorToProduct{VendorToProductId: $vendorToProductId}) return v"
                , { vendorToProductId: vendorToProductId }));
            this.loggerService.logInfo(`Fetched VendorToProduct with ID '${vendorToProductId}'.`, "CustomersService-Neo4j");

            if (responseVendorProduct.records.length == 0) {
                await connection.close();
                await session.close();
                this.loggerService.logError(`No vendor product under the given ID '${vendorToProductId}' exists.`, "CustomersService");
                throw new Error(`No vendor product under the given ID '${vendorToProductId}' exists!`);
            }

            // Check if the product is already present
            let productInCartQuery = "MATCH (c:ShoppingCart{CartId: $cartId})<-[r:IS_IN]-(v:VendorToProduct{VendorToProductId:$vendorToProductId}) return r";
            let productInCartResponse = await session.executeRead(tx => tx.run(
                productInCartQuery
                , { cartId: shoppingCartId, vendorToProductId: vendorToProductId }));
            this.loggerService.logInfo("Fetched data with query: " + productInCartQuery + ".", "CustomersService-Neo4j");

            if (productInCartResponse.records.length == 0) {
                await connection.close();
                await session.close();
                this.loggerService.logError(`No vendor's product with ID '${vendorToProductId}' was located in the cart with ID '${shoppingCartId}'.`, "CustomersService");
                throw new Error(`No vendor's product with ID '${vendorToProductId}' was located in the cart with ID '${shoppingCartId}'!`);
            }

            let cartRelationship = productInCartResponse.records[0].get("r") as IS_IN;
            let cartAmount = Number(cartRelationship.properties.Amount);

            if (amount > cartAmount) {
                await connection.close();
                await session.close();
                this.loggerService.logError(`Invalid amount ${amount} selected (surpasses shopping cart level of vendor's product with ID '${vendorToProductId}'.`, "CustomersService");
                throw new Error(`Invalid amount ${amount} selected (surpasses shopping cart level of vendor's product with ID '${vendorToProductId}'!`);
            }

            let amountToSet = cartAmount - Number(amount);
            let query = "MATCH (v:VendorToProduct{VendorToProductId: $vendorToProductId})-[r:IS_IN]-> (s:ShoppingCart{CartId: $cartId}) SET r.Amount = TOINTEGER($amount)";
            await session.executeWrite(tx => tx.run(query, { vendorToProductId: vendorToProductId, cartId: shoppingCartId, amount: amountToSet }));
            this.loggerService.logInfo("Created data with query: " + query + ".", "CustomersService-Neo4j");

            if (amount == cartAmount) {
                let query = "MATCH (v:VendorToProduct{VendorToProductId: $vendorToProductId})-[r:IS_IN]-> (s:ShoppingCart{CartId: $cartId}) DELETE r";
                await session.executeWrite(tx => tx.run(query, { vendorToProductId: vendorToProductId, cartId: shoppingCartId }));
                this.loggerService.logInfo("Deleted data with query: " + query + ".", "CustomersService-Neo4j");
            }

            await connection.close();
            await session.close();
        }
        catch (err) {
            await connection.close();
            await session.close();
            throw err;
        }
    }

    /**
     * Retrieves supplier information for the given supplier.
     * @param supplierId The supplier ID.
     * @returns The supplier information.
     */
    public async getSupplierInformation(supplierId: number): Promise<SupplierInformation> {
        let connection: Sequelize = await this.mssqlDatabaseService.initialize();

        try {
            let supplierData = await connection.models.Supplier.findOne({ where: { supplierId: supplierId } });
            this.loggerService.logInfo(`Fetched Supplier with ID '${supplierId}'.`, "CustomersService-MSSQL");

            if (supplierData == null) {
                await connection.close();
                this.loggerService.logError(`Supplier with ID '${supplierId}' does not exist.`, "CustomersService");
                throw new Error(`Supplier with ID '${supplierId}' does not exist!`);
            }

            let supplierDataConverted = supplierData.dataValues as Supplier;
            let addresses = await connection.query("select a.* from SupplierToAddress sa " +
                "left outer join Address a " +
                "on sa.AddressId = a.AddressId " +
                `where sa.SupplierId = ${supplierId}`);
            this.loggerService.logInfo(`Fetched Address for Supplier with ID '${supplierId}'.`, "CustomersService-MSSQL");
            let addressesConverted: Address[] = addresses[0].map(function(v) {
                return { addressId: v["AddressId"], street: v["Street"], city: v["City"], postalCode: v["PostalCode"], country: v["Country"] } as Address;
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
        catch (err) {
            await connection.close();
            throw err;
        }
    }

    /**
     * Returns a boolean indicating whether the product is available in the given amount.
     * @param vendorToProductId  The vendor's product ID. 
     * @param amount Amount to check for.
     * @returns Boolean indicating whether the product is available in the given amount.
     */
    public async isItemAvailable(vendorToProductId: number, amount: number): Promise<boolean> {
        let connection: Sequelize = await this.mssqlDatabaseService.initialize();
        let driver = await this.neo4jDatabaseService.initialize();
        let session = driver.session();

        try {
            // Check for existence in MSSQL
            let vendorToProduct = await connection.models.VendorToProduct.findOne({ where: { vendorToProductId } });
            this.loggerService.logInfo(`Fetched VendorToProduct with ID '${vendorToProductId}'.`, "CustomersService-MSSQL");

            if (vendorToProduct == null) {
                await connection.close();
                await session.close();
                return false;
            };

            // Check for existence in Neo4j
            let foundReferenceResponse = await session.executeRead(tx => tx.run<VendorToProductNeo4j>(
                "MATCH (v:VendorToProduct{VendorToProductId: $vendorToProductId}) RETURN v"
                , { vendorToProductId: vendorToProductId }));
            this.loggerService.logInfo(`Fetched VendorToProduct with ID '${vendorToProductId}'.`, "CustomersService-Neo4j");

            if (foundReferenceResponse.records.length == 0) {
                await connection.close();
                await session.close();
                return false;
            }


            let vendorToProductConverted = vendorToProduct.dataValues as VendorToProduct;

            await connection.close();
            await session.close();
            return (!(amount > vendorToProductConverted.inventoryLevel));
        }
        catch (err) {
            await connection.close();
            await session.close();
            throw err;
        }
    }

    /**
     * Places an order for the customer.
     * @param shoppingCartId The shopping cart ID.
     * @param billingAddressId The billing address ID.
     * @param supplierCompanyId The supplier company ID.
     * @returns The created order.
     */
    public async makeOrder(shoppingCartId: number, billingAddressId: number, supplierCompanyId: number): Promise<CustomerOrder> {
        let connection: Sequelize = await this.mssqlDatabaseService.initialize();
        let driver = await this.neo4jDatabaseService.initialize();
        let session = driver.session();

        try {
            // Check if the address is valid
            let address = await connection.models.Address.findOne({ where: { addressId: billingAddressId } });
            this.loggerService.logInfo(`Fetched Address with ID '${billingAddressId}'.`, "CustomersService-MSSQL");

            if (address == null) {
                await connection.close();
                await session.close();
                this.loggerService.logError(`No address under the given ID '${billingAddressId}' exists.`, "CustomersService");
                throw new Error(`No address under the given ID '${billingAddressId}' exists!`);
            }

            // Check if the supplier exists
            let supplier = await connection.models.Supplier.findOne({ where: { supplierId: supplierCompanyId } });
            this.loggerService.logInfo(`Fetched Supplier with ID '${supplierCompanyId}'.`, "CustomersService-MSSQL");

            if (supplier == null) {
                await connection.close();
                await session.close();
                this.loggerService.logError(`No supplier under the given ID '${supplierCompanyId}' exists.`, "CustomersService");
                throw new Error(`No supplier under the given ID ${supplierCompanyId} exists!`);
            }

            // Check if the shopping cart exists in MSSQL
            let cart = await connection.models.ShoppingCart.findOne({ where: { cartId: shoppingCartId } });
            this.loggerService.logInfo(`Fetched ShoppingCart with ID '${shoppingCartId}'.`, "CustomersService-MSSQL");

            if (cart == null) {
                await connection.close();
                await session.close();
                this.loggerService.logError(`No cart under the given ID '${shoppingCartId}' exists.`, "CustomersService");
                throw new Error(`No cart under the given ID '${shoppingCartId}' exists!`);
            }

            // Check if the shopping cart exists in Neo4j
            let foundReferenceResponse = await session.executeRead(tx => tx.run<ShoppingCartNeo4j>(
                "MATCH (c:ShoppingCart{CartId: $cartId}) RETURN c"
                , { cartId: shoppingCartId }));
            this.loggerService.logInfo(`Fetched ShoppingCart with ID '${shoppingCartId}'.`, "CustomersService-Neo4j");

            if (foundReferenceResponse.records.length == 0) {
                await connection.close();
                await session.close();
                this.loggerService.logError(`No cart under the given ID '${shoppingCartId}' exists.`, "CustomersService");
                throw new Error(`No cart under the given ID '${shoppingCartId}' exists!`);
            }

            let cartConverted = cart.dataValues as ShoppingCart;

            // Retrieve products in cart
            let productsInCartQuery = "MATCH (s:ShoppingCart{CartId: $cartId})<-[r:IS_IN]-(v:VendorToProduct) RETURN s,v,r";
            let productsInCart = await session.executeRead(tx => tx.run<VendorProductIsInCart>(
                productsInCartQuery
                , { cartId: shoppingCartId }));
            this.loggerService.logInfo("Fetched data with query: " + productsInCartQuery + ".", "CustomersService-Neo4j");

            if (productsInCart.records.length == 0) {
                await connection.close();
                await session.close();
                this.loggerService.logError(`No products were located in the cart with ID '${shoppingCartId}'.`, "CustomersService");
                throw new Error(`No products were located in the cart with ID '${shoppingCartId}'!`);
            }

            let productToCartsConverted: ProductToCart[] = productsInCart.records.map(function(v) {
                let r = {
                    productToCartId: -1, vendorToProductId: Number(v.get("v").properties.VendorToProductId),
                    cartId: Number(v.get("s").properties.CartId), amount: Number(v.get("r").properties.Amount)
                } as ProductToCart;
                return r;
            });

            // Check if items are available
            for (let item of productToCartsConverted) {
                let available = await this.isItemAvailable(item.vendorToProductId, item.amount);

                if (!available) {
                    await connection.close();
                    await session.close();
                    this.loggerService.logError(`Vendor's item with ID '${item.vendorToProductId}' is not availabe in amount of ${item.amount}.`, "CustomersService");
                    throw new Error(`Vendor's item with ID '${item.vendorToProductId}' is not availabe in amount of ${item.amount}!`);
                }
            }

            // Create new order
            let orderId = await this.mssqlDatabaseService.getNewId("CustomerOrder", "OrderId");
            sequelize.DATE.prototype._stringify = function _stringify(date, options) {
                return this._applyTimezone(date, options).format('YYYY-MM-DD HH:mm:ss.SSS');
            };
            let order = { orderId: orderId, orderName: null, orderDate: new Date(), customerId: cartConverted.customerId, billingAddressId: billingAddressId, isPaid: false } as CustomerOrder;
            await connection.models.CustomerOrder.create(order as any);
            this.loggerService.logInfo(`Created CustomerOrder with ID '${orderId}'.`, "CustomersService-MSSQL");

            for (let item of productToCartsConverted) {
                await this.placeItem(order, item, supplierCompanyId);
            }

            await connection.close();
            await session.close();
            return order;
        }
        catch (err) {
            await connection.close();
            await session.close();
            throw err;
        }
    }

    /**
     * Places an item to the given order.
     * @param order The order.
     * @param orderItem The order item.
     * @param supplierCompanyId The supplier company ID.
     */
    public async placeItem(order: CustomerOrder, orderItem: ProductToCart, supplierCompanyId: number): Promise<void> {
        let connection: Sequelize = await this.mssqlDatabaseService.initialize();
        await mongoose.connect(process.env.MONGODB_URI, { dbName: process.env.MONGODB_DATABASE });
        let driver = await this.neo4jDatabaseService.initialize();
        let session = driver.session();

        try {
            // Check if the order is valid
            let orderInDB = await connection.models.CustomerOrder.findOne({ where: { orderId: order.orderId } });
            this.loggerService.logInfo(`Fetched CustomerOrder with ID '${order.orderId}'.`, "CustomersService-MSSQL");

            if (orderInDB == null) {
                await connection.close();
                await session.close();
                await mongoose.disconnect();
                this.loggerService.logError(`Order with ID '${order.orderId}' does not exist.`, "CustomersService");
                throw new Error(`Order with ID '${order.orderId}' does not exist!`);
            }

            // Check if the address is valid
            let address = await connection.models.Address.findOne({ where: { addressId: order.billingAddressId } });
            this.loggerService.logInfo(`Fetched Address with ID '${order.billingAddressId}'.`, "CustomersService-MSSQL");

            if (address == null) {
                await connection.close();
                await session.close();
                await mongoose.disconnect();
                this.loggerService.logError(`No address under the given ID '${order.billingAddressId}' exists.`, "CustomersService");
                throw new Error(`No address under the given ID '${order.billingAddressId}' exists!`);
            }

            // Check if the supplier exists
            let supplier = await connection.models.Supplier.findOne({ where: { supplierId: supplierCompanyId } });
            this.loggerService.logInfo(`Fetched Supplier with ID '${supplierCompanyId}'.`, "CustomersService-MSSQL");

            if (supplier == null) {
                await connection.close();
                await session.close();
                await mongoose.disconnect();
                this.loggerService.logError(`No supplier under the given ID '${supplierCompanyId}' exists.`, "CustomersService");
                throw new Error(`No supplier under the given ID '${supplierCompanyId}' exists!`);
            }

            // Create order position object
            sequelize.DATE.prototype._stringify = function _stringify(date, options) {
                return this._applyTimezone(date, options).format('YYYY-MM-DD HH:mm:ss.SSS');
            };
            let date = new Date();
            date.setDate(date.getDate() + 14);
            let newId = await this.mssqlDatabaseService.getNewId("OrderPosition", "OrderPositionId");
            let orderPosition = {
                orderPositionId: newId, orderId: order.orderId, amount: orderItem.amount,
                vendorToProductId: orderItem.vendorToProductId, supplierCompanyId: supplierCompanyId,
                deliveryDate: date, deliveryAddressId: order.billingAddressId
            } as OrderPosition;

            // Create the order item
            await connection.models.OrderPosition.create(orderPosition as any);
            this.loggerService.logInfo(`Created OrderPosition with ID '${orderPosition.orderPositionId}'.`, "CustomersService-MSSQL");

            // Remove the order item from cart
            let query = "MATCH (v:VendorToProduct{VendorToProductId: $vendorToProductId})-[r:IS_IN]-> (s:ShoppingCart{CartId: $cartId}) DELETE r"
            await session.executeWrite(tx => tx.run(query
                , { vendorToProductId: orderItem.vendorToProductId, cartId: orderItem.cartId }));
            this.loggerService.logInfo("Deleted data with query: " + query + ".", "CustomersService-Neo4j");

            // Update the inventory level
            let vendorToProduct = await connection.models.VendorToProduct.findOne({ where: { vendorToProductId: orderItem.vendorToProductId } });
            this.loggerService.logInfo(`Fetched VendorToProduct with ID '${orderItem.vendorToProductId}'.`, "CustomersService-MSSQL");
            let productConverted = vendorToProduct.dataValues as VendorToProduct;
            let isAvailable = await this.isItemAvailable(orderItem.vendorToProductId, orderItem.amount);

            if (!isAvailable) {
                await connection.close();
                await session.close();
                await mongoose.disconnect();
                this.loggerService.logError(`The amount ${orderItem.amount} exceeeds the inventory level of vendor's product with ID '${productConverted.vendorToProductId}'.`, "CustomersService");
                throw new Error(`The amount ${orderItem.amount} exceeeds the inventory level of vendor's product with ID ${productConverted.vendorToProductId}!`);
            }

            let now = new Date();
            let newActionId = await this.mongoDBDatabaseService.getNewId("CustomerAction", "customerActionId");
            let action = {
                customerActionId: newActionId, customerId: order.customerId,
                vendorToProductId: orderItem.vendorToProductId, actionType: "purchase",
                actionDate: now
            } as CustomerAction;
            let amountToSet = Number(productConverted.inventoryLevel) - Number(orderItem.amount);
            await connection.models.VendorToProduct.update({ inventoryLevel: amountToSet }, { where: { vendorToProductId: orderItem.vendorToProductId } });
            this.loggerService.logInfo(`VendorToProduct with ID '${orderItem.vendorToProductId}' was updated.`, "CustomersService-MSSQL");
            await session.executeWrite(tx => tx.run("MATCH (v:VendorToProduct{VendorToProductId: $vendorToProductId}) SET v.InventoryLevel = TOINTEGER($amount)"
                , { vendorToProductId: orderItem.vendorToProductId, amount: amountToSet }));
            this.loggerService.logInfo(`VendorToProduct with ID '${orderItem.vendorToProductId}' was updated.`, "CustomersService-Neo4j");
            await this.customerActionService.createCustomerAction(action);
            await connection.close();
            await session.close();
            await mongoose.disconnect();
        }
        catch (err) {
            await connection.close();
            await session.close();
            await mongoose.disconnect();
            throw err;
        }
    }

    /**
     * Deletes the shopping cart reference for the given customer.
     * @param customerId The customer ID.
     */
    public async deleteShoppingCartReferences(customerId: number): Promise<void> {
        let driver = await this.neo4jDatabaseService.initialize();
        let session = driver.session();

        try {
            let query = "MATCH (v:VendorToProduct)-[r:IS_IN]->(c:ShoppingCart{CustomerId: $customerId}) DELETE r";
            await session.executeWrite(tx => tx.run(query, { customerId: customerId }));
            this.loggerService.logInfo("Deleted data with query: " + query + ".", "CustomersService-Neo4j");

            await session.close();
        }
        catch (err) {
            await session.close();
            throw err;
        }
    }

    /**
     * Deletes the shopping cart references for the given customer.
     * @param customerId The customer ID.
     */
    public async deleteShoppingCarts(customerId: number): Promise<void> {
        let connection: Sequelize = await this.mssqlDatabaseService.initialize();

        try {
            let ids = await connection.models.ShoppingCart.findAll({ attributes: ["cartId"], where: { customerId: customerId } });
            this.loggerService.logInfo(`Fetched ShoppingCart with data ${JSON.stringify({ customerId: customerId })}.`, "CustomersService-MSSQL");
            let idValues = ids.map(function(v) {
                return Number(v.dataValues["cartId"]);
            });

            for (let cartId of idValues) {
                await this.deleteShoppingCart(cartId);
            }
        }
        catch (err) {
            await connection.close();
            throw err;
        }
    }

    /**
     * Deletes the given shopping cart.
     * @param cartId The cart ID.
     */
    public async deleteShoppingCart(cartId: number): Promise<void> {
        let connection: Sequelize = await this.mssqlDatabaseService.initialize();
        let driver = await this.neo4jDatabaseService.initialize();
        let session = driver.session();

        try {
            // Check if the cart is referenced
            let foundReferenceQuery = "MATCH (v:VendorToProduct)-[r:IS_IN]->(c:ShoppingCart{CartId: $cartId}) RETURN v";
            let foundReferenceResponse = await session.executeRead(tx => tx.run<VendorToProductNeo4j>(
                foundReferenceQuery
                , { cartId: cartId }));
            this.loggerService.logInfo("Fetched data with query: " + foundReferenceQuery + ".", "CustomersService-Neo4j");

            if (foundReferenceResponse.records.length > 0) {
                await connection.close();
                await session.close();
                this.loggerService.logError(`Cart with ID '${cartId}' is referenced and cannot be deleted.`, "CustomersService");
                throw new Error(`Cart with ID '${cartId}' is referenced and cannot be deleted!`);
            }

            // Delete the cart
            await connection.models.ShoppingCart.destroy({ where: { cartId: cartId } });
            this.loggerService.logInfo(`Deleted ShoppingCart with ID '${cartId}'.`, "CustomersService-MSSQL");
            await session.executeWrite(tx => tx.run("MATCH (c:ShoppingCart{CartId: $cartId}) DELETE c", { cartId: cartId }));
            this.loggerService.logInfo(`Deleted ShoppingCart with ID '${cartId}'.`, "CustomersService-Neo4j");
            await connection.close();
            await session.close();
        }
        catch (err) {
            await connection.close();
            await session.close();
            throw err;
        }
    }

    /**
     * Deletes the given customer.
     * @param customerId The customer ID.
     */
    public async deleteCustomer(customerId: number): Promise<void> {
        let connection: Sequelize = await this.mssqlDatabaseService.initialize();
        let driver = await this.neo4jDatabaseService.initialize();
        let session = driver.session();
        await mongoose.connect(process.env.MONGODB_URI, { dbName: process.env.MONGODB_DATABASE });

        try {
            // Check if the customer is referenced in Neo4j
            // Shopping cart replicate
            let foundReferenceResponse = await session.executeRead(tx => tx.run<ShoppingCartNeo4j>(
                "MATCH (s:ShoppingCart{CustomerId: $customerId}) RETURN s"
                , { customerId: customerId }));
            this.loggerService.logInfo(`Fetched Customer with ID '${customerId}'.`, "CustomersService-MSSQL");

            if (foundReferenceResponse.records.length > 0) {
                await connection.close();
                await session.close();
                await mongoose.disconnect();
                this.loggerService.logError(`Customer with ID '${customerId}' is referenced and cannot be deleted.`, "CustomersService")
                throw new Error(`Customer with ID '${customerId}' is referenced and cannot be deleted!`);
            }

            // Check if the customer is referenced in MongoDB
            // Review
            let Review = mongoose.model<IReview>("Review", reviewSchema, "Review");
            let foundReview = await Review.findOne({ 'customerId': customerId });
            this.loggerService.logInfo(`Fetched Review with data ${JSON.stringify({ 'customerId': customerId })}.`, "CustomersService-MongoDB");

            if (foundReview != null) {
                await connection.close();
                await session.close();
                await mongoose.disconnect();
                this.loggerService.logError(`Customer with ID '${customerId}' is referenced and cannot be deleted.`, "CustomersService")
                throw new Error(`Customer with ID '${customerId}' is referenced and cannot be deleted!`);
            }

            // ProductRecommendation
            let ProductRecommendation = mongoose.model<IProductRecommendation>("ProductRecommendation", recommendationSchema, "ProductRecommendation");
            let foundRecommendation = await ProductRecommendation.findOne({ 'customerId': customerId });
            this.loggerService.logInfo(`Fetched ProductRecommendation with data ${JSON.stringify({ 'customerId': customerId })}.`, "CustomersService-MongoDB");

            if (foundRecommendation != null) {
                await connection.close();
                await session.close();
                await mongoose.disconnect();
                this.loggerService.logError(`Customer with ID '${customerId}' is referenced and cannot be deleted.`, "CustomersService")
                throw new Error(`Customer with ID '${customerId}' is referenced and cannot be deleted!`);
            }

            // CustomerAction
            let CustomerAction = mongoose.model<ICustomerAction>("CustomerAction", customerActionSchema, "CustomerAction");
            let foundAction = await CustomerAction.findOne({ 'customerId': customerId });
            this.loggerService.logInfo(`Fetched CustomerAction with data ${JSON.stringify({ 'customerId': customerId })}.`, "CustomersService-MongoDB");

            if (foundAction != null) {
                await connection.close();
                await session.close();
                await mongoose.disconnect();
                this.loggerService.logError(`Customer with ID '${customerId}' is referenced and cannot be deleted.`, "CustomersService")
                throw new Error(`Customer with ID '${customerId}' is referenced and cannot be deleted!`);
            }


            await connection.models.Customer.destroy({ where: { customerId: customerId } });
            this.loggerService.logInfo(`Deleted Customer with ID '${customerId}'.`, "CustomersService-MSSQL");
            await connection.close();
            await session.close();
            await mongoose.disconnect();
        }
        catch (err) {
            await connection.close();
            await session.close();
            await mongoose.disconnect();
            throw err;
        }
    }

    /**
     * Returns a boolean indicating whether the review belongs to the customer.
     * @param reviewId The review ID.
     * @param customerId The customer ID.
     * @returns Boolean indicating whether the review belongs to the customer.
     */
    public async belongsToCustomer(reviewId: number, customerId: number): Promise<boolean> {
        await mongoose.connect(process.env.MONGODB_URI, { dbName: process.env.MONGODB_DATABASE });
        let Review = mongoose.model<IReview>("Review", reviewSchema, "Review");

        try {
            // Check if the ID exists
            let foundReview = await Review.findOne({ 'reviewId': reviewId });
            this.loggerService.logInfo(`Fetched Review with ID '${reviewId}'.`, "CustomersService-MongoDB");

            if (foundReview == null) {
                return false;
            }

            await mongoose.disconnect();
            return foundReview.customerId == customerId;
        }
        catch (err) {
            await mongoose.disconnect();
            throw err;
        }
    }

    /**
     * Returns a boolean indicating whether the cart belongs to the customer.
     * @param cartId The cart ID.
     * @param customerId The customer ID.
     * @returns Boolean indicating whether the cart belongs to the customer.
     */
    public async doesCartBelongToCustomer(cartId: number, customerId: number): Promise<boolean> {
        let connection: Sequelize = await this.mssqlDatabaseService.initialize();
        let driver = await this.neo4jDatabaseService.initialize();
        let session = driver.session();

        try {
            // Check if exists in MSSQL
            let cartCustomerConnection = await connection.models.ShoppingCart.findOne({ where: { customerId: customerId, cartId: cartId } });
            this.loggerService.logInfo(`Fetched ShoppingCart with data ${JSON.stringify({ customerId: customerId, cartId: cartId })}.`, "CustomersService-MSSQL");

            if (cartCustomerConnection == null) {
                await connection.close();
                await session.close();
                return false;
            }

            // Check if exists in Neo4j
            let foundReferenceResponse = await session.executeRead(tx => tx.run<ShoppingCartNeo4j>(
                "MATCH (c:ShoppingCart{CartId: $cartId, CustomerId: $customerId}) RETURN c"
                , { cartId: cartId, customerId: customerId }));
            this.loggerService.logInfo(`Fetched ShoppingCart with data ${JSON.stringify({ customerId: customerId, cartId: cartId })}.`, "CustomersService-Neo4j");

            if (foundReferenceResponse.records.length == 0) {
                await connection.close();
                await session.close();
                return false;
            }

            await connection.close();
            await session.close();
            return true;
        }
        catch (err) {
            await connection.close();
            await session.close();
            throw err;
        }
    }
}