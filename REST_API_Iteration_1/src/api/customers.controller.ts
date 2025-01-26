import { inject, injectable } from 'inversify';
import { controller, httpDelete, httpGet, httpPost, httpPut, interfaces, queryParam, request } from 'inversify-express-utils';
import { Request, Response } from 'express';
import { LoggerService } from '../core/services/logger.service';
import { CreateCustomerRequestBody } from '../models/request.bodies/customer.request.bodies/create.customer.request.body/create.customer.request.body';
import { HashingService } from '../core/services/hashing.service';
import { CustomersService } from '../core/services/customers.service';
import { Customer } from '../models/customer.model';
import { RequestBodyValidationService } from '../core/services/request.body.validation.service';
import { ShoppingCart } from '../models/shopping.cart.model';
import { Address } from '../models/address.model';
import sequelize = require('sequelize');
import { LoginCustomerRequestBody } from '../models/request.bodies/customer.request.bodies/login.customer.request.body';
import { CustomersSessionService } from '../core/services/customers.sessions.service';
import { UpdateCustomerRequestBody } from '../models/request.bodies/customer.request.bodies/update.customer.request.body';
import { Op } from 'sequelize';
import { AddCustomerAddressRequestBody } from '../models/request.bodies/customer.request.bodies/add.customer.address.request.body';
import { UpdateCustomerAddressRequestBody } from '../models/request.bodies/customer.request.bodies/update.customer.address.request.body';
import { OrderPosition } from '../models/order.position.model';
import { ProductInformation } from '../models/product.information.model';
import { VendorInformation } from '../models/vendor.information.model';
import { AddProductToCartRequestBody } from '../models/request.bodies/customer.request.bodies/add.product.to.cart.request.body';
import { RemoveProductFromCartRequestBody } from '../models/request.bodies/customer.request.bodies/remove.product.from.cart.request.body';
import { SupplierInformation } from '../models/supplier.information.model';
import { MakeOrderRequestBody } from '../models/request.bodies/customer.request.bodies/make.order.request.body';

@controller("/customer")
@injectable()
export class CustomersController implements interfaces.Controller{
    constructor(@inject(LoggerService.name) private loggerService: LoggerService,
                @inject(HashingService.name) private hashingService: HashingService,
                @inject(CustomersService.name) private customersService: CustomersService,
                @inject(CustomersSessionService.name) private customerSessionService: CustomersSessionService,
                @inject(RequestBodyValidationService.name) private requestBodyValidationService: RequestBodyValidationService
            ){}

    /**
     * Represents a controller method that creates a customer account.
     * @param request Format: 
     * {
     *    userName: string,
     *    firstName: string,
     *    lastName: string,
     *    email: string,
     *    password: string,
     *    phoneNumber: string,
     *    addresses: [
     *        {
     *           street: string,
     *           city: string,
     *           postalCode: string,
     *           country: string
     *        },
     *        ...
     *    ]       
     * }
     * @param response The response. Format
     *  {
     *    message: string
     *  }
     */
    @httpPost("/account/create")
    public async createAccount(request: Request, response: Response): Promise<void>{
        try{
            let createCustomerRequestBody: CreateCustomerRequestBody = request.body as CreateCustomerRequestBody;
            
            try{
                this.requestBodyValidationService.validateCreateCustomerRequestBody(createCustomerRequestBody);
            } catch (err){
                response.status(400).json({message: err.message})
                return;
            }

            let userExists = await this.customersService.doesUsernameExist(createCustomerRequestBody.userName);

            if (userExists){
                response.status(400).json({message: `Username ${createCustomerRequestBody.userName} already exists!`});
                return;
            }

            let passwordHashed = await this.hashingService.hash(createCustomerRequestBody.password);
            let id = await this.customersService.getNewCustomerId();
            let customer = {customerId: id, 
                firstName: createCustomerRequestBody.firstName, 
                lastName: createCustomerRequestBody.lastName,
                email: createCustomerRequestBody.email,
                userName: createCustomerRequestBody.userName,
                password: passwordHashed,
                phoneNumber: createCustomerRequestBody.phoneNumber} as Customer;
            let cartId = await this.customersService.getNewShoppingCartId();
            sequelize.DATE.prototype._stringify = function _stringify(date, options) {
                return this._applyTimezone(date, options).format('YYYY-MM-DD HH:mm:ss.SSS');
              };
            let cart = {cartId: cartId, customerId: id, dateCreated: new Date()} as ShoppingCart;
            let customerCreated = await this.customersService.createNewCustomer(customer);
            let cartCreated = await this.customersService.createNewShoppingCart(cart);  

            if (createCustomerRequestBody.addresses.length == 0){
                response.status(201).json({message: "Account was successfully created!"});
                return;
            }

            for (let addressReq of createCustomerRequestBody.addresses){
                let newId = await this.customersService.getNewAddressId();
                let address = {addressId: newId, street: addressReq.street, city: addressReq.city, postalCode: addressReq.postalCode, country: addressReq.country} as Address;
                await this.customersService.createNewCustomerAddress(address, customerCreated);
            }

            response.status(201).json({message: "Account was successfully created!"});
        }
        catch (err){
            response.status(500).json({message: err.message});
        }
    }

    /**
     * Represents a method that logs the customer in.
     * @param request Format:
     * {
     *    userName: string,
     *    password: string
     * }
     * @param response The response.Format:
     * {
     *   id: number
     * }
     */
    @httpPost("/account/login")
    public async login(request: Request, response: Response): Promise<void>{
        try{
            let loginRequestBody: LoginCustomerRequestBody = request.body as LoginCustomerRequestBody;
            
            try{
                this.requestBodyValidationService.validateLoginRequestBody(loginRequestBody);
            } catch (err){
                response.status(400).json({message: err.message})
                return;
            }

            let doesUserExist = await this.customersService.doesUsernameExist(loginRequestBody.userName);

            if (!doesUserExist){
                response.status(400).json({message: `The user ${loginRequestBody.userName} already exists!`});
                return;
            }

            // Fetch the user data
            let connection = await this.customersService.intializeMSSQL();
            let foundUser = await connection.models.Customer.findOne({where: {userName: loginRequestBody.userName}});
            let userConverted = foundUser.dataValues as Customer;
            connection.close();

            // Check the password
            if (!this.hashingService.isValid(loginRequestBody.password, userConverted.password)){
                response.status(400).json({message: "Invalid password!"});
                return;
            }

            let id = await this.customerSessionService.registerCustomerSession(userConverted.customerId);
            response.status(200).json({id: id});
        }
        catch (err){
            response.status(500).json({message: err.message});
        }
    }

    /**
     * Updates the user account.
     * @param request Format:
     * {
     *    customerId: number,
     *    userName: string,
     *    firstName: string,
     *    lastName: string,
     *    email: string,
     *    password: string,
     *    phoneNumber: string,
     * }
     * @param response The response.Format:
     * {
     *   id: number
     * }
     */
    @httpPut("/account/update/:kid")
    public async updateAccount(request: Request, response: Response): Promise<void>{
        try{
            let updateRequestBody: UpdateCustomerRequestBody = request.body as UpdateCustomerRequestBody;
            
            try{
                this.requestBodyValidationService.validateUpdateCustomerRequestBody(updateRequestBody);
            } catch (err){
                response.status(400).json({message: err.message})
                return;
            }

            let verified = await this.customerSessionService.verifyCustomer(updateRequestBody.customerId);

            if (!verified){
                response.status(403).json({message: "Unauthorized!"});
                return;
            }

            if (Number(request.params.kid) !== updateRequestBody.customerId){
                response.status(400).json({message: "The customer ID in the parameters and in the request body have to match!"});
                return;
            }

            // Find similar customer
            let connection = await this.customersService.intializeMSSQL();
            let foundUser = await connection.models.Customer.findOne({where: {userName: updateRequestBody.userName, customerId: {[Op.ne]: updateRequestBody.customerId}}});
            connection.close();

            if (foundUser !== null){
                response.status(400).json({message: `The given username ${updateRequestBody.userName} already exists!`});
                return;
            }

            let passwordHashed = await this.hashingService.hash(updateRequestBody.password);
            let customer = {customerId: updateRequestBody.customerId, 
                firstName: updateRequestBody.firstName, 
                lastName: updateRequestBody.lastName,
                email: updateRequestBody.email,
                userName: updateRequestBody.userName,
                password: passwordHashed,
                phoneNumber: updateRequestBody.phoneNumber} as Customer;

            let updated = await this.customersService.updateExistingCustomer(customer, updateRequestBody.customerId);
            response.status(201).json({message: "The customer was successfully updated!"});
        }
        catch (err){
            response.status(500).json({message: err.message});
        }
    }

    /**
     * Fetches the account information.
     * @param request The request body.
     * @param response The response. Format:
     * {
     *    customerId: number,
     *    userName: string,
     *    firstName: string,
     *    lastName: string,
     *    email: string,
     *    phoneNumber: string,
     *    addresses: [
     *        {
     *           addressId: number,
     *           street: string,
     *           city: string,
     *           postalCode: string,
     *           country: string
     *        },
     *        ...
     *    ]       
     * }
     */
    @httpGet("/account/:kid")
    public async getAccountInformation(request: Request, response: Response): Promise<void>{
        try{
            let verified = await this.customerSessionService.verifyCustomer(Number(request.params.kid));

            if (!verified){
                response.status(403).json({message: "Unauthorized!"});
                return;
            }

            // Retrieve customer information
            let connection = await this.customersService.intializeMSSQL();
            let data = await connection.query("select c.*, a.* from Customer c left outer join CustomerToAddress ca " +
                                              "on c.CustomerId = ca.CustomerId " +
                                                "left outer join Address a " +
                                                "on ca.AddressId = a.AddressId " +
                                                `where c.CustomerId = ${request.params.kid}`);
            connection.close();
            let addresses: Address[] = data[0].map(function(information){
                let a = {addressId: information["AddressId"], street: information["Street"], 
                    city: information["City"], postalCode: information["PostalCode"], 
                    country: information["Country"]} as Address;
                return a;
            });

            let userDataObject = data[0][0];
            let result = {customerId: request.params.kid, userName: userDataObject["UserName"],
                firstName: userDataObject["FirstName"], lastName: userDataObject["LastName"],
                email: userDataObject["Email"],
                phoneNumber: userDataObject["PhoneNumber"],
                addresses: addresses
            };
            response.status(200).json(result);
        }
        catch (err){
            response.status(500).json({message: err.message});
        }
    }

    /**
     * Deletes the customer account.
     * @param request The request body.
     * @param response The response. Format
     *  {
     *    message: string
     *  }
     */
    @httpDelete("/account/:kid")
    public async deleteAccount(request: Request, response: Response): Promise<void>{
        try{
            let customerId = Number(request.params.kid);
            /*
            let verified = await this.customerSessionService.verifyCustomer(customerId);

            if (!verified){
                response.status(403).json({message: "Unauthorized!"});
                return;
            }
                */

            let connection = await this.customersService.intializeMSSQL();
            let data = await connection.query("select op.* from OrderPosition op " +
                "left outer join CustomerOrder co " +
                  "on co.OrderId = op.OrderId " +
                  "left outer join Customer c " +
                  "on co.CustomerId = c.CustomerId " +
                  `where c.CustomerId= ${customerId}`);

            // Delete order positions
            let orderPositions = data[0] as OrderPosition[];
            let positionIds = orderPositions.map(function(v){
                return v["OrderPositionId"];
            });

            await connection.models.OrderPosition.destroy({where: {orderPositionId: positionIds}});

            // Delete customer orders
            await connection.models.CustomerOrder.destroy({where: {customerId: customerId}});

            // Delete the shopping cart
            await connection.models.ShoppingCart.destroy({where: {customerId: customerId}});

            // Delete the addresses
            let ids = await connection.models.CustomerToAddress.findAll({attributes: ["addressId"],where: {customerId: customerId}});
            let idValues = ids.map(function(v){
                return Number(v.dataValues["addressId"]);
            })

            await this.customersService.deleteCustomerAddresses(idValues, customerId);

            // Delete the customer
            await connection.models.Customer.destroy({where: {customerId: customerId}});
            connection.close();
            response.status(200).json({message: `The customer with ID ${customerId} was successfully deleted!`});
        }
        catch (err){
            response.status(500).json({message: err.message});
        }
    }

    /**
     * Adds a new customer address.
     * @param request The request body. Format:
     * {
     *   customerId: number,
     *   street: string,
     *   city: string,
     *   postalCode: string,
     *   country: string
     * }
     * @param response The response. Format
     *  {
     *    message: string
     *  }
     */
    @httpPost("/address/create")
    public async addCustomerAddress(request: Request, response: Response): Promise<void>{
        try{
            let addAddressRequestBody: AddCustomerAddressRequestBody = request.body as AddCustomerAddressRequestBody;
            
            try{
                this.requestBodyValidationService.validateAddCustomerAddressRequestBody(addAddressRequestBody);
            } catch (err){
                response.status(400).json({message: err.message})
                return;
            }

            let verified = await this.customerSessionService.verifyCustomer(addAddressRequestBody.customerId);

            if (!verified){
                response.status(403).json({message: "Unauthorized!"});
                return;
            }

            // Fetch customer data
            let connection = await this.customersService.intializeMSSQL();
            let foundUser = await connection.models.Customer.findOne({where: {customerId: addAddressRequestBody.customerId}});
            let userConverted = foundUser.dataValues as Customer;
            connection.close();

            // Save address data
            let addressId = await this.customersService.getNewAddressId();
            let address = {addressId: addressId, street: addAddressRequestBody.street,
                city: addAddressRequestBody.city, postalCode: addAddressRequestBody.postalCode,
                country: addAddressRequestBody.country
            } as Address;
            let addressCreated = await this.customersService.createNewCustomerAddress(address, userConverted);
            response.status(201).json({message: "Address was successfully created."});
        }
        catch (err){
            response.status(500).json({message: err.message});
        }
    }

    /**
     * Updates a customer address.
     * @param request The request body. Format:
     * {
     *   customerId: number,
     *   addressId: number,
     *   street: string,
     *   city: string,
     *   postalCode: string,
     *   country: string
     * }
     * @param response The response. Format:
     *  {
     *    message: string,
     *    newAddress: {
     *      addressId: number,
     *      street: string,
     *      city: string,
     *      postalCode: string,
     *      country: string
     *  }
     */
    @httpPut("/address/update/:aid")
    public async updateCustomerAddress(request: Request, response: Response): Promise<void>{
        try{
            let updateAddressRequestBody: UpdateCustomerAddressRequestBody = request.body as UpdateCustomerAddressRequestBody;
            
            try{
                this.requestBodyValidationService.validateUpdateCustomerAddressRequestBody(updateAddressRequestBody);
            } catch (err){
                response.status(400).json({message: err.message})
                return;
            }

            let verified = await this.customerSessionService.verifyCustomer(updateAddressRequestBody.customerId);

            if (!verified){
                response.status(403).json({message: "Unauthorized!"});
                return;
            }

            if (Number(request.params.aid) !== updateAddressRequestBody.addressId){
                response.status(400).json({message: "The address ID in the parameters and in the request body have to match!"});
                return;
            }

            // Fetch customer data
            let connection = await this.customersService.intializeMSSQL();
            let foundUser = await connection.models.Customer.findOne({where: {customerId: updateAddressRequestBody.customerId}});
            let userConverted = foundUser.dataValues as Customer;
            connection.close();
            
            let addressData = {addressId: updateAddressRequestBody.addressId, 
                street: updateAddressRequestBody.street, city: updateAddressRequestBody.city,
                country: updateAddressRequestBody.country, postalCode: updateAddressRequestBody.postalCode
            } as Address;
            let updatedAddress = await this.customersService.updateCustomerAddress(addressData, userConverted);
            response.status(201).json({message: "The address was successfully updated!", newAddress: updatedAddress});
        }
        catch (err){
            response.status(500).json({message: err.message});
        }
    }

    /**
     * Deletes an address for a customer.
     * @param request The request body.
     * @param response The response. Format
     *  {
     *    message: string
     *  }
     */
    @httpDelete("/address/:kid/:aid")
    public async deleteCustomerAddress(request: Request, response: Response): Promise<void>{
        try{
            let customerId = Number(request.params.kid);
            let addressId = Number(request.params.aid);

            let verified = await this.customerSessionService.verifyCustomer(customerId);

            if (!verified){
                response.status(403).json({message: "Unauthorized!"});
                return;
            }

            await this.customersService.deleteCustomerAddress(addressId, customerId);
            response.status(200).json({message: `The address with ID ${addressId} was successfully deleted!`});
        }
        catch (err){
            response.status(500).json({message: err.message});
        }
    }

    /**
     * 
     * @param request The request body.
     * @param response The response body. Format:
     * {
     *    addresses: [
     *      {
     *          addressId: number,
     *          street: string,
     *          city: string,
     *          postalCode: string,
     *          country: string
     *      },
     *      ...
     * ]
     * }
     */
    @httpGet("/address/:kid")
    public async getAddresses(request: Request, response: Response): Promise<void>{
        try{
            let customerId = Number(request.params.kid);
            let verified = await this.customerSessionService.verifyCustomer(customerId);

            if (!verified){
                response.status(403).json({message: "Unauthorized!"});
                return;
            }

            let connection = await this.customersService.intializeMSSQL();
            let data = await connection.query("select a.* from Customer c left outer join CustomerToAddress ca " +
                                              "on c.CustomerId = ca.CustomerId " +
                                                "left outer join Address a " +
                                                "on ca.AddressId = a.AddressId " +
                                                `where c.CustomerId = ${customerId}`);
            connection.close();
            let addresses: Address[] = data[0].map(function(information){
                let a = {addressId: information["AddressId"], street: information["Street"], 
                    city: information["City"], postalCode: information["PostalCode"], 
                    country: information["Country"]} as Address;
                return a;
            });
            response.status(200).json({"addresses": addresses});
        }
        catch (err){
            response.status(500).json({message: err.message});
        }
    }

    /**
     * Returns the product information to the customer.
     * @param request The request body. 
     * @param response The response body. Format:
     * {
     *    productInformation: {
     *       productId: number
     *       name: string,
     *       description: string,
     *       unitPriceEuro: decimal,
     *       inventoryLevel: number,
     *       categories: [
     *         {
     *           categoryId: number,
     *           name: string
     *         },
     *        ...
     *       ]
     *    },
     *    vendorInformation{
     *       vendorId: number,
     *       name: string,
     *       userName: string,
     *       email: string,
     *       phoneNumber: string
     *       vendorAddresses: [
     *         {
     *           addressId: number,
     *           street: string,
     *           city: string,
     *           postalCode: string,
     *           country: string
     *         },
     *         ...
     *       ]
     *    }
     * }
     */
    @httpGet("/product/:kid/:pid")
    public async getProductInformation(request: Request, response: Response): Promise<void>{
        try{
            let customerId = Number(request.params.kid);
            let productId = Number(request.params.pid);
            let verified = await this.customerSessionService.verifyCustomer(customerId);

            if (!verified){
                response.status(403).json({message: "Unauthorized!"});
                return;
            }

            let productInformation: ProductInformation = await this.customersService.getVendorsProductInformation(productId);
            let vendorInformation: VendorInformation = await this.customersService.getVendorInformation(productId);
            let result = {productInformation: productInformation, vendorInformation: vendorInformation};
            response.status(200).json(result);
        }
        catch (err){
            response.status(500).json({message: err.message});
        }
    }

    /**
     * Adds an item of a specific count into a shopping cart.
     * @param request The request body. Format:
     * {
     *   customerId: number,
     *   vendorToProductId: number,
     *   shoppingCartId: number,
     *   amount: number
     * }
     * @param response The response. Format:
     *  {
     *    message: string
     *  }
     */
    @httpPost("/product/addtocart")
    public async addToCart(request: Request, response: Response): Promise<void>{
        try{
            let addProductToCartRequestBody: AddProductToCartRequestBody = request.body as AddProductToCartRequestBody;
            
            try{
                this.requestBodyValidationService.validateAddProductToCartRequestBody(addProductToCartRequestBody);
            } catch (err){
                response.status(400).json({message: err.message})
                return;
            }

            let verified = await this.customerSessionService.verifyCustomer(addProductToCartRequestBody.customerId);

            if (!verified){
                response.status(403).json({message: "Unauthorized!"});
                return;
            }

            let connection = await this.customersService.intializeMSSQL();
            let cartCustomerConnection = await connection.models.ShoppingCart.findOne({where: {customerId: addProductToCartRequestBody.customerId, cartId: addProductToCartRequestBody.shoppingCartId}});
            connection.close();

            if (cartCustomerConnection == null){
                response.status(400).json({message: `Invalid shopping cart with ID ${addProductToCartRequestBody.shoppingCartId} detected!`});
                return;
            }

            await this.customersService.addProductToCart(addProductToCartRequestBody.vendorToProductId, addProductToCartRequestBody.shoppingCartId, addProductToCartRequestBody.amount);
            response.status(201).json({message: `Product with vendor' product ID ${addProductToCartRequestBody.vendorToProductId} of amount ${addProductToCartRequestBody.amount} was successfully added to cart!`});
        }
        catch (err){
            response.status(500).json({message: err.message});
        }
    }

    /**
     * Removes an item of a specific count from a shopping cart.
     * @param request The request body. Format:
     * {
     *   customerId: number,
     *   vendorToProductId: number,
     *   shoppingCartId: number,
     *   amount: number
     * }
     * @param response The response. Format:
     *  {
     *    message: string
     *  }
     */
    @httpPost("/product/removefromcart")
    public async removeFromCart(request: Request, response: Response): Promise<void>{
        try{
            let removeProductFromCartRequestBody: RemoveProductFromCartRequestBody = request.body as RemoveProductFromCartRequestBody;
            
            try{
                this.requestBodyValidationService.validateRemoveProductFromCartRequestBody(removeProductFromCartRequestBody);
            } catch (err){
                response.status(400).json({message: err.message})
                return;
            }

            let verified = await this.customerSessionService.verifyCustomer(removeProductFromCartRequestBody.customerId);

            if (!verified){
                response.status(403).json({message: "Unauthorized!"});
                return;
            }

            let connection = await this.customersService.intializeMSSQL();
            let cartCustomerConnection = await connection.models.ShoppingCart.findOne({where: {customerId: removeProductFromCartRequestBody.customerId, cartId: removeProductFromCartRequestBody.shoppingCartId}});
            connection.close();

            if (cartCustomerConnection == null){
                response.status(400).json({message: `Invalid shopping cart with ID ${removeProductFromCartRequestBody.shoppingCartId} detected!`});
                return;
            }

            await this.customersService.removeProductFromCart(removeProductFromCartRequestBody.vendorToProductId, removeProductFromCartRequestBody.shoppingCartId, removeProductFromCartRequestBody.amount);
            response.status(200).json({message: `Product with vendor' product ID ${removeProductFromCartRequestBody.vendorToProductId} of amount ${removeProductFromCartRequestBody.amount} was successfully removed from cart!`});
        }
        catch (err){
            response.status(500).json({message: err.message});
        }
    }

        /**
     * Returns the supplier information to the customer.
     * @param request The request body. 
     * @param response The response body. Format:
     * {
     *    supplierId: number,
     *    name: string,
     *    email: string,
     *    phoneNumber: string,
     *    supplierAddresses: [
     *       {
     *           addressId: number,
     *           street: string,
     *           city: string,
     *           postalCode: string,
     *           country: string
     *       },
     *      ...
     *   ]
     * }
     */
    @httpGet("/supplier/:kid/:sid")
    public async getSupplierInformation(request: Request, response: Response): Promise<void>{
        try{
            let customerId = Number(request.params.kid);
            let supplierId = Number(request.params.sid);
            let verified = await this.customerSessionService.verifyCustomer(customerId);

            if (!verified){
                response.status(403).json({message: "Unauthorized!"});
                return;
            }

            let supplierInformation: SupplierInformation = await this.customersService.getSupplierInformation(supplierId);
            response.status(200).json(supplierInformation);
        }
        catch (err){
            response.status(500).json({message: err.message});
        }
    }

    /**
     * Places an order for the customer.
     * @param request The request body. Format:
     * {
     *    customerId: number,
     *    shoppingCartId: number,
     *    billingAddressId: number,
     *    supplierCompanyId: number
     * }
     * @param response The response. Format:
     *  {
     *    message: string
     *  }
     */
    @httpPost("/cart/makeorder")
    public async  makeOrder(request: Request, response: Response): Promise<void>{
        try{
            let makeOrderRequestBody: MakeOrderRequestBody = request.body as MakeOrderRequestBody;
            
            try{
                this.requestBodyValidationService.validateMakeOrderRequestBody(makeOrderRequestBody);
            } catch (err){
                response.status(400).json({message: err.message})
                return;
            }

            let verified = await this.customerSessionService.verifyCustomer(makeOrderRequestBody.customerId);

            if (!verified){
                response.status(403).json({message: "Unauthorized!"});
                return;
            }

            let connection = await this.customersService.intializeMSSQL();
            let cartCustomerConnection = await connection.models.ShoppingCart.findOne({where: {customerId: makeOrderRequestBody.customerId, cartId: makeOrderRequestBody.shoppingCartId}});
            connection.close();

            if (cartCustomerConnection == null){
                response.status(400).json({message: `Invalid shopping cart with ID ${makeOrderRequestBody.shoppingCartId} detected!`});
                return;
            }

            let order = await this.customersService.makeOrder(makeOrderRequestBody.shoppingCartId, makeOrderRequestBody.billingAddressId, makeOrderRequestBody.supplierCompanyId);
            response.status(201).json({message: `Order from shopping cart ${makeOrderRequestBody.shoppingCartId} for the customer ${makeOrderRequestBody.customerId} was successfully placed under the ID ${order.orderId}`});
        }
        catch (err){
            response.status(500).json({message: err.message});
        }
    }
}