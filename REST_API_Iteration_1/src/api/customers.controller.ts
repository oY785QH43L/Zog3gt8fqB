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

@controller("/customer")
@injectable()
export class CustomersController implements interfaces.Controller{
    constructor(@inject(LoggerService.name) private loggerService: LoggerService,
                @inject(HashingService.name) private hashingService: HashingService,
                @inject(CustomersService.name) private customersService: CustomersService,
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
     * @param response The response.
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
            response.status(201).json({message: "Account was successfully created!"});
        }
        catch (err){
            response.status(500).json({message: err.message});
        }
    }

    public async login(request: Request, response: Response): Promise<void>{

    }
}