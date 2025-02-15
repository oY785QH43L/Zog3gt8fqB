import { inject, injectable } from 'inversify';
import 'reflect-metadata';
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
import { MssqlDatabaseService } from './mssql.database.service';
import { LoggerService } from './logger.service';
import { AddressService } from './address.service';


@injectable()
/**
 * The customers service.
 */
export class CustomersService {
    /**
     * Initializes the customers service.
     * @param mssqlDatabaseService The MSSQL database service. 
     * @param addressService The address service.
     * @param loggerService The logger service.
     */
    constructor(
        @inject(MssqlDatabaseService.name) private mssqlDatabaseService: MssqlDatabaseService,
        @inject(AddressService.name) private addressService: AddressService,
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
            this.loggerService.logInfo(`Fetched Customer with data ${JSON.stringify({ userName: userName })}.`, "CustomersService");
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
            this.loggerService.logInfo(`Fetched Customer with ID '${customer.customerId}'.`, "CustomersService");

            if (foundCustomer !== null) {
                await connection.close();
                this.loggerService.logError(`Customer with ID '${customer.customerId}' already exists.`, "CustomersService");
                throw new Error(`Customer with ID '${customer.customerId}' already exists!`);
            }

            let created = await connection.models.Customer.create(customer as any);
            this.loggerService.logInfo(`Created Customer with ID '${customer.customerId}'.`, "CustomersService");
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
            this.loggerService.logInfo(`Fetched Customer with ID '${customer.customerId}'.`, "CustomersService");

            if (foundCustomer == null) {
                await connection.close();
                this.loggerService.logError(`Customer with ID '${customer.customerId}' does not exist.`, "CustomersService");
                throw new Error(`Customer with ID '${customer.customerId}' does not exist!`);
            }

            await connection.models.Customer.update(customer, { where: { customerId: customerId } });
            this.loggerService.logInfo(`Customer with ID '${customerId}' was updated.`, "CustomersService");
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

        try {
            let foundCart = await connection.models.ShoppingCart.findByPk(cart.cartId);
            this.loggerService.logInfo(`Fetched ShoppingCart with ID '${cart.cartId}'.`, "CustomersService");

            if (foundCart !== null) {
                await connection.close();
                this.loggerService.logError(`Cart with ID '${cart.cartId}' already exists.`, "CustomersService");
                throw new Error(`Cart with ID '${cart.cartId}' already exists!`);
            }

            let foundCustomer = await connection.models.Customer.findByPk(cart.customerId);
            this.loggerService.logInfo(`Fetched Customer with ID '${cart.customerId}'.`, "CustomersService");

            if (foundCustomer == null) {
                await connection.close();
                this.loggerService.logError(`Customer with ID '${cart.customerId}' already exists.`, "CustomersService");
                throw new Error(`Customer with ID '${cart.customerId}' does not exist!`);
            }

            let created = await connection.models.ShoppingCart.create(cart as any);
            this.loggerService.logInfo(`Created ShoppingCart with ID '${cart.cartId}'.`, "CustomersService");
            let createdConverted = created.dataValues as ShoppingCart;
            await connection.close();
            return createdConverted;
        }
        catch (err) {
            await connection.close();
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
            this.loggerService.logInfo(`Fetched Address with ID '${address.addressId}'.`, "CustomersService");

            if (foundAddress !== null) {
                await connection.close();
                this.loggerService.logError(`Address with ID '${address.addressId}' already exists.`, "CustomersService");
                throw new Error(`Address with ID '${address.addressId}' already exists!`);
            }

            let whereClause = { street: address.street, city: address.city, postalCode: address.postalCode, country: address.country };
            let existingAddress = await connection.models.Address.findOne({ where: whereClause });
            this.loggerService.logInfo(`Fetched Address with data ${JSON.stringify(whereClause)}.`, "CustomersService");

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
            this.loggerService.logInfo(`Fetched CustomerToAddress with data ${JSON.stringify(whereClause)}.`, "CustomersService");

            if (foundAddress !== null) {
                await connection.close();
                this.loggerService.logError(`Customer address reference with address ID '${address.addressId}' and customer ID '${customer.customerId}' already exists.`, "CustomersService");
                throw new Error(`Customer address reference with address ID '${address.addressId}' and customer ID '${customer.customerId}' already exists!`);
            }


            let newId = await this.mssqlDatabaseService.getNewId("CustomerToAddress", "CustomerToAddressId");
            let customerToAddress = { customerToAddressId: newId, addressId: address.addressId, customerId: customer.customerId } as CustomerToAddress;
            let created = await connection.models.CustomerToAddress.create(customerToAddress as any);
            this.loggerService.logInfo(`Created CustomerToAddress with ID '${newId}'.`, "CustomersService");
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
            this.loggerService.logInfo(`Deleted CustomerToAddress with data ${JSON.stringify({ addressId: address.addressId, customerId: customer.customerId })}.`, "CustomersService");
            let whereClause = { street: address.street, city: address.city, postalCode: address.postalCode, country: address.country };
            let existingAddress = await connection.models.Address.findOne({ where: whereClause });
            this.loggerService.logInfo(`Fetched Address with data ${JSON.stringify(whereClause)}.`, "CustomersService");
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
            this.loggerService.logInfo(`Fetched CustomerToAddress with data ${JSON.stringify({ addressId: address.addressId })}.`, "CustomersService");
            let foundVendorReference = connection.models.VendorToAddress.findOne({ where: { addressId: address.addressId } });
            this.loggerService.logInfo(`Fetched VendorToAddress with data ${JSON.stringify({ addressId: address.addressId })}.`, "CustomersService");
            let foundSupplierReference = connection.models.SupplierToAddress.findOne({ where: { addressId: address.addressId } });
            this.loggerService.logInfo(`Fetched SupplierToAddress with data ${JSON.stringify({ addressId: address.addressId })}.`, "CustomersService");
            let foundDeliveryReference = connection.models.OrderPosition.findOne({ where: { deliveryAddressId: address.addressId } });
            this.loggerService.logInfo(`Fetched OrderPosition with data ${JSON.stringify({ deliveryAddressId: address.addressId })}.`, "CustomersService");
            let foundOrderReference = connection.models.CustomerOrder.findOne({ where: { billingAddressId: address.addressId } });
            this.loggerService.logInfo(`Fetched CustomerOrder with data ${JSON.stringify({ billingAddressId: address.addressId })}.`, "CustomersService");

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
            this.loggerService.logInfo(`Deleted Address with data ${JSON.stringify({ addressId: address.addressId })}.`, "CustomersService");
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
            this.loggerService.logInfo(`Deleted CustomerToAddress with data ${JSON.stringify({ addressId: addressId, customerId: customerId })}.`, "CustomersService");


            // Delete old address if no existing references
            let foundCustomerReference = connection.models.CustomerToAddress.findOne({ where: { addressId: addressId } });
            this.loggerService.logInfo(`Fetched CustomerToAddress with data ${JSON.stringify({ addressId: addressId })}.`, "CustomersService");
            let foundVendorReference = connection.models.VendorToAddress.findOne({ where: { addressId: addressId } });
            this.loggerService.logInfo(`Fetched VendorToAddress with data ${JSON.stringify({ addressId: addressId })}.`, "CustomersService");
            let foundSupplierReference = connection.models.SupplierToAddress.findOne({ where: { addressId: addressId } });
            this.loggerService.logInfo(`Fetched SupplierToAddress with data ${JSON.stringify({ addressId: addressId })}.`, "CustomersService");
            let foundDeliveryReference = connection.models.OrderPosition.findOne({ where: { deliveryAddressId: addressId } });
            this.loggerService.logInfo(`Fetched OrderPosition with data ${JSON.stringify({ deliveryAddressId: addressId })}.`, "CustomersService");
            let foundOrderReference = connection.models.CustomerOrder.findOne({ where: { billingAddressId: addressId } });
            this.loggerService.logInfo(`Fetched CustomerOrder with data ${JSON.stringify({ billingAddressId: addressId })}.`, "CustomersService");

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
            this.loggerService.logInfo(`Deleted Address with data ${JSON.stringify({ addressId: addressId })}.`, "CustomersService");
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
            this.loggerService.logInfo(`Fetched VendorToProduct with data ${JSON.stringify({ vendorToProductId: vendorToProductId })}.`, "CustomersService");


            if (vendorToProductData == null) {
                await connection.close();
                this.loggerService.logError(`Vendor's product with ID '${vendorToProductId}' does not exist.`, "CustomersService");
                throw new Error(`Vendor's product with ID '${vendorToProductId}' does not exist!`);
            }

            let vendorToProductDataConverted = vendorToProductData.dataValues as VendorToProduct;
            let vendorData = await connection.models.Vendor.findOne({ where: { vendorId: vendorToProductDataConverted.vendorId } });
            this.loggerService.logInfo(`Fetched Vendor with ID '${vendorToProductDataConverted.vendorId}'.`, "CustomersService");
            let vendorDataConverted = vendorData.dataValues as Vendor;
            let addresses = await connection.query("select a.* from VendorToAddress va " +
                "left outer join Address a " +
                "on va.AddressId = a.AddressId " +
                `where va.VendorId = ${vendorToProductDataConverted.vendorId}`);
            this.loggerService.logInfo(`Fetched Address for Vendor with ID '${vendorToProductDataConverted.vendorId}'.`, "CustomersService");
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

        try {
            let cart = await connection.models.ShoppingCart.findOne({ where: { cartId: shoppingCartId } });
            this.loggerService.logInfo(`Fetched ShoppingCart with ID '${shoppingCartId}'.`, "CustomersService");


            if (cart == null) {
                await connection.close();
                this.loggerService.logError(`No cart under the given ID '${shoppingCartId}' exists.`, "CustomersService");
                throw new Error(`No cart under the given ID ${shoppingCartId} exists!`);
            }

            let cartConverted = cart.dataValues as ShoppingCart;
            let vendorToProduct = await connection.models.VendorToProduct.findOne({ where: { vendorToProductId: vendorToProductId } });
            this.loggerService.logInfo(`Fetched VendorToProduct with ID '${vendorToProductId}'.`, "CustomersService");

            if (vendorToProduct == null) {
                await connection.close();
                this.loggerService.logError(`No vendor product under the given ID '${vendorToProductId}' exists.`, "CustomersService");
                throw new Error(`No vendor product under the given ID '${vendorToProductId}' exists!`);
            }

            let vendorProductConverted = vendorToProduct.dataValues as VendorToProduct;
            let productToCart = await connection.models.ProductToCart.findOne({ where: { vendorToProductId: vendorToProductId, cartId: shoppingCartId } });
            this.loggerService.logInfo(`Fetched ProductToCart with data ${JSON.stringify({ vendorToProductId: vendorToProductId, cartId: shoppingCartId })}.`, "CustomersService");

            if (productToCart == null) {
                if (amount > vendorProductConverted.inventoryLevel) {
                    await connection.close();
                    this.loggerService.logError(`Invalid amount ${amount} selected (surpasses inventory level of vendor's product with ID '${vendorToProductId}'.`, "CustomersService");
                    throw new Error(`Invalid amount ${amount} selected (surpasses inventory level of vendor's product with ID '${vendorToProductId}'!`);
                }

                let productToCartId = await this.mssqlDatabaseService.getNewId("ProductToCart", "ProductToCartId");
                let productToCart = { productToCartId: productToCartId, vendorToProductId: vendorToProductId, cartId: shoppingCartId, amount: amount } as ProductToCart;
                await connection.models.ProductToCart.create(productToCart as any);
                this.loggerService.logInfo(`Created ProductToCart with ID '${productToCartId}'.`, "CustomersService");
            } else {
                let productToCartConverted = productToCart.dataValues as ProductToCart;

                if ((amount + productToCartConverted.amount) > vendorProductConverted.inventoryLevel) {
                    await connection.close();
                    this.loggerService.logError(`Invalid amount ${amount} selected (surpasses inventory level of vendor's product with ID '${vendorToProductId}'.`, "CustomersService");
                    throw new Error(`Invalid amount ${amount} selected (surpasses inventory level of vendor's product with ID '${vendorToProductId}'!`);
                }

                await connection.models.ProductToCart.update({ amount: amount + productToCartConverted.amount }, { where: { vendorToProductId: vendorToProductId, cartId: shoppingCartId } });
                this.loggerService.logInfo(`Cart under data ${JSON.stringify({ vendorToProductId: vendorToProductId, cartId: shoppingCartId })} was updated.`, "CustomersService");
            }

            await connection.close();
        }
        catch (err) {
            await connection.close();
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

        try {
            let cart = await connection.models.ShoppingCart.findOne({ where: { cartId: shoppingCartId } });
            this.loggerService.logInfo(`Fetched ShoppingCart with ID '${shoppingCartId}'.`, "CustomersService");

            if (cart == null) {
                await connection.close();
                this.loggerService.logError(`No cart under the given ID '${shoppingCartId}' exists.`, "CustomersService");
                throw new Error(`No cart under the given ID '${shoppingCartId}' exists!`);
            }

            let cartConverted = cart.dataValues as ShoppingCart;
            let vendorToProduct = await connection.models.VendorToProduct.findOne({ where: { vendorToProductId: vendorToProductId } });
            this.loggerService.logInfo(`Fetched VendorToProduct with ID '${vendorToProductId}'.`, "CustomersService");

            if (vendorToProduct == null) {
                await connection.close();
                this.loggerService.logError(`No vendor product under the given ID '${vendorToProductId}' exists.`, "CustomersService");
                throw new Error(`No vendor product under the given ID '${vendorToProductId}' exists!`);
            }

            let vendorProductConverted = vendorToProduct.dataValues as VendorToProduct;
            let productToCart = await connection.models.ProductToCart.findOne({ where: { vendorToProductId: vendorToProductId, cartId: shoppingCartId } });
            this.loggerService.logInfo(`Fetched ProductToCart with data ${JSON.stringify({ vendorToProductId: vendorToProductId, cartId: shoppingCartId })}.`, "CustomersService");

            if (productToCart == null) {
                await connection.close();
                this.loggerService.logError(`No vendor's product with ID '${vendorToProductId}' was located in the cart with ID '${shoppingCartId}'.`, "CustomersService");
                throw new Error(`No vendor's product with ID '${vendorToProductId}' was located in the cart with ID '${shoppingCartId}'!`);
            }

            let productToCartConverted = productToCart.dataValues as ProductToCart;

            if (amount > productToCartConverted.amount) {
                await connection.close();
                this.loggerService.logError(`Invalid amount ${amount} selected (surpasses shopping cart level of vendor's product with ID '${vendorToProductId}'.`, "CustomersService");
                throw new Error(`Invalid amount ${amount} selected (surpasses shopping cart level of vendor's product with ID '${vendorToProductId}'!`);
            }

            await connection.models.ProductToCart.update({ amount: productToCartConverted.amount - amount }, { where: { vendorToProductId: vendorToProductId, cartId: shoppingCartId } });
            this.loggerService.logInfo(`Cart under data ${JSON.stringify({ vendorToProductId: vendorToProductId, cartId: shoppingCartId })} was updated.`, "CustomersService");

            if (amount == productToCartConverted.amount) {
                await connection.models.ProductToCart.destroy({ where: { vendorToProductId: vendorToProductId, cartId: shoppingCartId } })
                this.loggerService.logInfo(`Deleted ShoppingCart under data ${JSON.stringify({ vendorToProductId: vendorToProductId, cartId: shoppingCartId })}.`, "CustomersService");
            }

            await connection.close();
        }
        catch (err) {
            await connection.close();
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
            this.loggerService.logInfo(`Fetched Supplier with ID '${supplierId}'.`, "CustomersService");

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
            this.loggerService.logInfo(`Fetched Address for Supplier with ID '${supplierId}'.`, "CustomersService");
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

        try {
            let vendorToProduct = await connection.models.VendorToProduct.findOne({ where: { vendorToProductId } });
            this.loggerService.logInfo(`Fetched VendorToProduct with ID '${vendorToProductId}'.`, "CustomersService");

            if (vendorToProduct == null) {
                await connection.close();
                return false;
            }

            let vendorToProductConverted = vendorToProduct.dataValues as VendorToProduct;

            await connection.close();
            return (!(amount > vendorToProductConverted.inventoryLevel));
        }
        catch (err) {
            await connection.close();
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

        try {
            // Check if the address is valid
            let address = await connection.models.Address.findOne({ where: { addressId: billingAddressId } });
            this.loggerService.logInfo(`Fetched Address with ID '${billingAddressId}'.`, "CustomersService");

            if (address == null) {
                await connection.close();
                this.loggerService.logError(`No address under the given ID '${billingAddressId}' exists.`, "CustomersService");
                throw new Error(`No address under the given ID '${billingAddressId}' exists!`);
            }

            // Check if the supplier exists
            let supplier = await connection.models.Supplier.findOne({ where: { supplierId: supplierCompanyId } });
            this.loggerService.logInfo(`Fetched Supplier with ID '${supplierCompanyId}'.`, "CustomersService");

            if (supplier == null) {
                await connection.close();
                this.loggerService.logError(`No supplier under the given ID '${supplierCompanyId}' exists.`, "CustomersService");
                throw new Error(`No supplier under the given ID '${supplierCompanyId}' exists!`);
            }

            // Check if the shopping cart exists
            let cart = await connection.models.ShoppingCart.findOne({ where: { cartId: shoppingCartId } });
            this.loggerService.logInfo(`Fetched ShoppingCart with ID '${shoppingCartId}'.`, "CustomersService");

            if (cart == null) {
                await connection.close();
                this.loggerService.logError(`No cart under the given ID '${shoppingCartId}' exists.`, "CustomersService");
                throw new Error(`No cart under the given ID '${shoppingCartId}' exists!`);
            }

            let cartConverted = cart.dataValues as ShoppingCart;

            // Retrieve products in cart
            let productToCarts = await connection.models.ProductToCart.findAll({ where: { cartId: shoppingCartId } });
            this.loggerService.logInfo(`Fetched ProductToCart with data ${JSON.stringify({ cartId: shoppingCartId })}.`, "CustomersService");

            if (productToCarts.length == 0) {
                await connection.close();
                this.loggerService.logError(`No products were located in the cart with ID '${shoppingCartId}'.`, "CustomersService");
                throw new Error(`No products were located in the cart with ID '${shoppingCartId}'!`);
            }

            let productToCartsConverted: ProductToCart[] = productToCarts.map(function(v) {
                let r = {
                    productToCartId: v.dataValues["productToCartId"], vendorToProductId: v.dataValues["vendorToProductId"],
                    cartId: v.dataValues["cartId"], amount: v.dataValues["amount"],
                } as ProductToCart;
                return r;
            });

            // Check if items are available
            for (let item of productToCartsConverted) {
                let available = await this.isItemAvailable(item.vendorToProductId, item.amount);

                if (!available) {
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
            this.loggerService.logInfo(`Created CustomerOrder with ID '${orderId}'.`, "CustomersService");

            for (let item of productToCartsConverted) {
                await this.placeItem(order, item, supplierCompanyId);
            }

            await connection.close();
            return order;
        }
        catch (err) {
            await connection.close();
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

        try {
            // Check if the order is valid
            let orderInDB = await connection.models.CustomerOrder.findOne({ where: { orderId: order.orderId } });
            this.loggerService.logInfo(`Fetched CustomerOrder with ID '${order.orderId}'.`, "CustomersService");


            if (orderInDB == null) {
                await connection.close();
                this.loggerService.logError(`Order with ID '${order.orderId}' does not exist.`, "CustomersService");
                throw new Error(`Order with ID '${order.orderId}' does not exist!`);
            }

            // Check if the address is valid
            let address = await connection.models.Address.findOne({ where: { addressId: order.billingAddressId } });
            this.loggerService.logInfo(`Fetched Address with ID '${order.billingAddressId}'.`, "CustomersService");

            if (address == null) {
                await connection.close();
                this.loggerService.logError(`No address under the given ID '${order.billingAddressId}' exists.`, "CustomersService");
                throw new Error(`No address under the given ID '${order.billingAddressId}' exists!`);
            }

            // Check if the supplier exists
            let supplier = await connection.models.Supplier.findOne({ where: { supplierId: supplierCompanyId } });
            this.loggerService.logInfo(`Fetched Supplier with ID '${supplierCompanyId}'.`, "CustomersService");

            if (supplier == null) {
                await connection.close();
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
            this.loggerService.logInfo(`Created OrderPosition with ID '${orderPosition.orderPositionId}'.`, "CustomersService");

            // Remove the order item from cart
            await connection.models.ProductToCart.destroy({ where: { vendorToProductId: orderItem.vendorToProductId, cartId: orderItem.cartId } });
            this.loggerService.logInfo(`Deleted ProductToCart with data ${JSON.stringify({ vendorToProductId: orderItem.vendorToProductId, cartId: orderItem.cartId })}.`, "CustomersService");


            // Update the inventory level
            let vendorToProduct = await connection.models.VendorToProduct.findOne({ where: { vendorToProductId: orderItem.vendorToProductId } });
            this.loggerService.logInfo(`Fetched VendorToProduct with ID '${orderItem.vendorToProductId}'.`, "CustomersService");
            let productConverted = vendorToProduct.dataValues as VendorToProduct;
            let isAvailable = await this.isItemAvailable(orderItem.vendorToProductId, orderItem.amount);

            if (!isAvailable) {
                await connection.close();
                this.loggerService.logError(`The amount ${orderItem.amount} exceeeds the inventory level of vendor's product with ID '${productConverted.vendorToProductId}'.`, "CustomersService");
                throw new Error(`The amount ${orderItem.amount} exceeeds the inventory level of vendor's product with ID ${productConverted.vendorToProductId}!`);
            }

            await connection.models.VendorToProduct.update({ inventoryLevel: productConverted.inventoryLevel - orderItem.amount }, { where: { vendorToProductId: orderItem.vendorToProductId } });
            this.loggerService.logInfo(`VendorToProduct with ID '${orderItem.vendorToProductId}' was updated.`, "CustomersService");
            await connection.close();
        }
        catch (err) {
            await connection.close();
            throw err;
        }
    }
}