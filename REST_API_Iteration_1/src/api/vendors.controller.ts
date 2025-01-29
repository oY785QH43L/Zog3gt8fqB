import { inject, injectable } from 'inversify';
import { controller, httpDelete, httpGet, httpPost, httpPut, interfaces, queryParam, request } from 'inversify-express-utils';
import { Request, Response } from 'express';
import { VendorsService } from '../core/services/vendors.service';
import { HashingService } from '../core/services/hashing.service';
import { LoggerService } from '../core/services/logger.service';
import { VendorsSessionService } from '../core/services/vendors.session.service';
import { RequestBodyValidationService } from '../core/services/request.body.validation.service';
import { CreateVendorRequestBody } from '../models/request.bodies/vendor.request.bodies/create.vendor.request.body/create.vendor.request.body';
import { Vendor } from '../models/vendor.model';
import { Address } from '../models/address.model';
import { LoginVendorRequestBody } from '../models/request.bodies/vendor.request.bodies/login.vendor.request.body';
import { UpdateVendorRequestBody } from '../models/request.bodies/vendor.request.bodies/update.vendor.request.body';
import { Op } from 'sequelize';
import { AddVendorAddressRequestBody } from '../models/request.bodies/vendor.request.bodies/add.vendor.address.request.body';
import { UpdateVendorAddressRequestBody } from '../models/request.bodies/vendor.request.bodies/update.vendor.address.request.body';
import { CreateVendorProductRequestBody } from '../models/request.bodies/vendor.request.bodies/create.vendor.product.request.body/create.vendor.product.request.body';


@controller("/vendor")
@injectable()
export class VendorsController implements interfaces.Controller{
    constructor(@inject(LoggerService.name) private loggerService: LoggerService,
                @inject(HashingService.name) private hashingService: HashingService,
                @inject(VendorsService.name) private vendorsService: VendorsService,
                @inject(VendorsSessionService.name) private vendorSessionService: VendorsSessionService,
                @inject(RequestBodyValidationService.name) private requestBodyValidationService: RequestBodyValidationService
            ){}

    /**
     * Represents a controller method that creates a customer account.
     * @param request Format: 
     * {
     *    userName: string,
     *    name: string,
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
            let createVendorRequestBody: CreateVendorRequestBody = request.body as CreateVendorRequestBody;
            
            try{
                this.requestBodyValidationService.validateCreateVendorRequestBody(createVendorRequestBody);
            } catch (err){
                response.status(400).json({message: err.message})
                return;
            }

            let userExists = await this.vendorsService.doesUsernameExist(createVendorRequestBody.userName);

            if (userExists){
                response.status(400).json({message: `Vendor ${createVendorRequestBody.userName} already exists!`});
                return;
            }

            let passwordHashed = await this.hashingService.hash(createVendorRequestBody.password);
            let id = await this.vendorsService.getNewId("Vendor", "VendorId");
            let vendor = {vendorId: id, 
                name: createVendorRequestBody.name, 
                email: createVendorRequestBody.email,
                userName: createVendorRequestBody.userName,
                password: passwordHashed,
                phoneNumber: createVendorRequestBody.phoneNumber} as Vendor;
            let customerCreated = await this.vendorsService.createNewVendor(vendor);

            if (createVendorRequestBody.addresses.length == 0){
                response.status(201).json({message: "Account was successfully created!"});
                return;
            }

            for (let addressReq of createVendorRequestBody.addresses){
                let newId = await this.vendorsService.getNewId("Address", "AddressId");
                let address = {addressId: newId, street: addressReq.street, city: addressReq.city, postalCode: addressReq.postalCode, country: addressReq.country} as Address;
                await this.vendorsService.createNewVendorAddress(address, customerCreated);
            }

            response.status(201).json({message: "Account was successfully created!"});
        }
        catch (err){
            response.status(500).json({message: err.message});
        }
    }

    /**
     * Represents a method that logs the vendor in.
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
            let loginRequestBody: LoginVendorRequestBody = request.body as LoginVendorRequestBody;
            
            try{
                this.requestBodyValidationService.validateVendorLoginRequestBody(loginRequestBody);
            } catch (err){
                response.status(400).json({message: err.message})
                return;
            }

            let doesUserExist = await this.vendorsService.doesUsernameExist(loginRequestBody.userName);

            if (!doesUserExist){
                response.status(400).json({message: `The vendor ${loginRequestBody.userName} already exists!`});
                return;
            }

            // Fetch the vendor data
            let connection = await this.vendorsService.intializeMSSQL();
            let foundUser = await connection.models.Vendor.findOne({where: {userName: loginRequestBody.userName}});
            let userConverted = foundUser.dataValues as Vendor;
            connection.close();

            // Check the password
            if (!this.hashingService.isValid(loginRequestBody.password, userConverted.password)){
                response.status(400).json({message: "Invalid password!"});
                return;
            }

            let id = await this.vendorSessionService.registerVendorSession(userConverted.vendorId);
            response.status(200).json({id: id});
        }
        catch (err){
            response.status(500).json({message: err.message});
        }
    }

    /**
     * Updates the vendor account.
     * @param request Format:
     * {
     *    vendorId: number,
     *    userName: string,
     *    name: string,
     *    email: string,
     *    password: string,
     *    phoneNumber: string,
     * }
     * @param response The response.Format:
     * {
     *   id: number
     * }
     */
    @httpPut("/account/update/:vid")
    public async updateAccount(request: Request, response: Response): Promise<void>{
        try{
            let updateRequestBody: UpdateVendorRequestBody = request.body as UpdateVendorRequestBody;
            
            try{
                this.requestBodyValidationService.validateUpdateVendorRequestBody(updateRequestBody);
            } catch (err){
                response.status(400).json({message: err.message})
                return;
            }

            let verified = await this.vendorSessionService.verifyVendor(updateRequestBody.vendorId);

            if (!verified){
                response.status(403).json({message: "Unauthorized!"});
                return;
            }

            if (Number(request.params.vid) !== updateRequestBody.vendorId){
                response.status(400).json({message: "The vendor ID in the parameters and in the request body have to match!"});
                return;
            }

            // Find similar vendor
            let connection = await this.vendorsService.intializeMSSQL();
            let foundUser = await connection.models.Vendor.findOne({where: {userName: updateRequestBody.userName, vendorId: {[Op.ne]: updateRequestBody.vendorId}}});
            connection.close();

            if (foundUser !== null){
                response.status(400).json({message: `The given username ${updateRequestBody.userName} already exists!`});
                return;
            }

            let passwordHashed = await this.hashingService.hash(updateRequestBody.password);
            let customer = {vendorId: updateRequestBody.vendorId, 
                name: updateRequestBody.name, 
                email: updateRequestBody.email,
                userName: updateRequestBody.userName,
                password: passwordHashed,
                phoneNumber: updateRequestBody.phoneNumber} as Vendor;

            let updated = await this.vendorsService.updateExistingVendor(customer, updateRequestBody.vendorId);
            response.status(201).json({message: "The vendor was successfully updated!"});
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
     *    vendorId: number,
     *    userName: string,
     *    name: string,
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
    @httpGet("/account/:vid")
    public async getAccountInformation(request: Request, response: Response): Promise<void>{
        try{
            let verified = await this.vendorSessionService.verifyVendor(Number(request.params.vid));

            if (!verified){
                response.status(403).json({message: "Unauthorized!"});
                return;
            }

            // Retrieve vendor information
            let connection = await this.vendorsService.intializeMSSQL();
            let data = await connection.query("select v.*, a.* from Vendor v left outer join VendorToAddress va " +
                                                "on v.VendorId = va.VendorId " +
                                                "left outer join Address a " +
                                                "on va.AddressId = a.AddressId " +
                                                `where v.VendorId = ${request.params.vid}`);
            connection.close();
            let addresses: Address[] = data[0].map(function(information){
                let a = {addressId: information["AddressId"], street: information["Street"], 
                    city: information["City"], postalCode: information["PostalCode"], 
                    country: information["Country"]} as Address;
                return a;
            });

            let vendorDataObject = data[0][0];
            let result = {vendorId: request.params.vid, userName: vendorDataObject["UserName"],
                name: vendorDataObject["Name"], email: vendorDataObject["Email"],
                phoneNumber: vendorDataObject["PhoneNumber"],
                addresses: addresses
            };
            response.status(200).json(result);
        }
        catch (err){
            response.status(500).json({message: err.message});
        }
    }

    /**
     * Adds a new vendor address.
     * @param request The request body. Format:
     * {
     *   vendorId: number,
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
    public async addVendorAddress(request: Request, response: Response): Promise<void>{
        try{
            let addAddressRequestBody: AddVendorAddressRequestBody = request.body as AddVendorAddressRequestBody;
            
            try{
                this.requestBodyValidationService.validateAddVendorAddressRequestBody(addAddressRequestBody);
            } catch (err){
                response.status(400).json({message: err.message})
                return;
            }

            let verified = await this.vendorSessionService.verifyVendor(addAddressRequestBody.vendorId);

            if (!verified){
                response.status(403).json({message: "Unauthorized!"});
                return;
            }

            // Fetch vendor data
            let connection = await this.vendorsService.intializeMSSQL();
            let foundUser = await connection.models.Vendor.findOne({where: {vendorId: addAddressRequestBody.vendorId}});
            let userConverted = foundUser.dataValues as Vendor;
            connection.close();

            // Save address data
            let addressId = await this.vendorsService.getNewId("Address", "AddressId");
            let address = {addressId: addressId, street: addAddressRequestBody.street,
                city: addAddressRequestBody.city, postalCode: addAddressRequestBody.postalCode,
                country: addAddressRequestBody.country
            } as Address;
            let addressCreated = await this.vendorsService.createNewVendorAddress(address, userConverted);
            response.status(201).json({message: "Address was successfully created."});
        }
        catch (err){
            response.status(500).json({message: err.message});
        }
    }

    /**
     * Updates a vendor address.
     * @param request The request body. Format:
     * {
     *   vendorId: number,
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
    public async updateVendorAddress(request: Request, response: Response): Promise<void>{
        try{
            let updateAddressRequestBody: UpdateVendorAddressRequestBody = request.body as UpdateVendorAddressRequestBody;
            
            try{
                this.requestBodyValidationService.validateUpdateVendorAddressRequestBody(updateAddressRequestBody);
            } catch (err){
                response.status(400).json({message: err.message})
                return;
            }

            let verified = await this.vendorSessionService.verifyVendor(updateAddressRequestBody.vendorId);

            if (!verified){
                response.status(403).json({message: "Unauthorized!"});
                return;
            }

            if (Number(request.params.aid) !== updateAddressRequestBody.addressId){
                response.status(400).json({message: "The address ID in the parameters and in the request body have to match!"});
                return;
            }

            // Fetch customer data
            let connection = await this.vendorsService.intializeMSSQL();
            let foundUser = await connection.models.Vendor.findOne({where: {vendorId: updateAddressRequestBody.vendorId}});
            let userConverted = foundUser.dataValues as Vendor;
            connection.close();
            
            let addressData = {addressId: updateAddressRequestBody.addressId, 
                street: updateAddressRequestBody.street, city: updateAddressRequestBody.city,
                country: updateAddressRequestBody.country, postalCode: updateAddressRequestBody.postalCode
            } as Address;
            let updatedAddress = await this.vendorsService.updateVendorAddress(addressData, userConverted);
            response.status(201).json({message: "The address was successfully updated!", newAddress: updatedAddress});
        }
        catch (err){
            response.status(500).json({message: err.message});
        }
    }

    /**
     * Deletes an address for a vendor.
     * @param request The request body.
     * @param response The response. Format
     *  {
     *    message: string
     *  }
     */
    @httpDelete("/address/:vid/:aid")
    public async deleteCustomerAddress(request: Request, response: Response): Promise<void>{
        try{
            let vendorId = Number(request.params.vid);
            let addressId = Number(request.params.aid);

            let verified = await this.vendorSessionService.verifyVendor(vendorId);

            if (!verified){
                response.status(403).json({message: "Unauthorized!"});
                return;
            }

            await this.vendorsService.deleteVendorAddress(addressId, vendorId);
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
    @httpGet("/address/:vid")
    public async getAddresses(request: Request, response: Response): Promise<void>{
        try{
            let vendorId = Number(request.params.vid);
            let verified = await this.vendorSessionService.verifyVendor(vendorId);

            if (!verified){
                response.status(403).json({message: "Unauthorized!"});
                return;
            }

            let connection = await this.vendorsService.intializeMSSQL();
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
            response.status(200).json({"addresses": addresses});
        }
        catch (err){
            response.status(500).json({message: err.message});
        }
    }

    /**
     * Adds a new vendor product.
     * @param request The request body. Format:
     * {
     *   vendorId: number,
     *   unitPriceEuro: number,
     *   inventoryLevel: number,
     *   name: string,
     *   description: string,
     *   categories: [
     *     {
     *        categoryId: number
     *     },
     *    ...
     *  ]
     * }
     * @param response The response. Format
     *  {
     *    message: string
     *  }
     */
    @httpPost("/product/create")
    public async addVendorProduct(request: Request, response: Response): Promise<void>{
        try{
            let createVendorProductRequestBody: CreateVendorProductRequestBody = request.body as CreateVendorProductRequestBody;
            
         
        }
        catch (err){
            response.status(500).json({message: err.message});
        }
    }
}