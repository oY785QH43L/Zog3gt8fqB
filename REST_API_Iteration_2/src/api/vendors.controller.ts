import 'reflect-metadata';
import { inject, injectable } from 'inversify';
import { controller, httpDelete, httpGet, httpPost, httpPut, interfaces } from 'inversify-express-utils';
import { Request, Response } from 'express';
import { VendorsService } from '../core/services/vendors.service';
import { HashingService } from '../core/services/hashing.service';
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
import { ProductInformation } from '../models/product.information.model';
import { Category } from '../models/category.model';
import { AddCategoryRequestBody } from '../models/request.bodies/vendor.request.bodies/add.category.request.body';
import { VendorToProduct } from '../models/vendor.to.product.model';
import { RemoveCategoryRequestBody } from '../models/request.bodies/vendor.request.bodies/remove.category.request.body';
import * as multer from "multer";
import { FormDataConversionService } from '../core/services/form.data.conversion.service';
import { ProductImage } from '../models/product.image.model';
import { ProductVideo } from '../models/product.video.model';
import { MssqlDatabaseService } from '../core/services/mssql.database.service';
import { MongoDbDatabaseService } from '../core/services/mongodb.database.service';
import { ProductsService } from '../core/services/products.service';
import { CategoriesService } from '../core/services/categories.service';
const storage = multer.memoryStorage();
const upload = multer({ storage });

@controller("/vendor")
@injectable()
/**
 * The vendors controller.
 */
export class VendorsController implements interfaces.Controller {
    /**
     * Initializes the vendors controller.
     * @param mssqlDatabaseService The MSSQL database service.
     * @param mongoDBService The MongoDB service.
     * @param productsService The products service.
     * @param categoriesService The categories service.
     * @param hashingService The hashing service.
     * @param vendorsService The vendors service.
     * @param vendorSessionService The vendor session service.
     * @param requestBodyValidationService The request body validation service.
     * @param formDataConversionService The form data conversion service.
     */
    constructor(
        @inject(MssqlDatabaseService.name) private mssqlDatabaseService: MssqlDatabaseService,
        @inject(MongoDbDatabaseService.name) private mongoDBService: MongoDbDatabaseService,
        @inject(ProductsService.name) private productsService: ProductsService,
        @inject(CategoriesService.name) private categoriesService: CategoriesService,
        @inject(HashingService.name) private hashingService: HashingService,
        @inject(VendorsService.name) private vendorsService: VendorsService,
        @inject(VendorsSessionService.name) private vendorSessionService: VendorsSessionService,
        @inject(RequestBodyValidationService.name) private requestBodyValidationService: RequestBodyValidationService,
        @inject(FormDataConversionService.name) private formDataConversionService: FormDataConversionService
    ) { }

    /**
     * Represents a controller method that creates a vendor account.
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
     * @param response The response. Format:
     *  {
     *    message: string
     *  }
     */
    @httpPost("/account/create")
    public async createAccount(request: Request, response: Response): Promise<void> {
        try {
            let createVendorRequestBody: CreateVendorRequestBody = request.body as CreateVendorRequestBody;

            try {
                this.requestBodyValidationService.validateCreateVendorRequestBody(createVendorRequestBody);
            } catch (err) {
                response.status(400).json({ message: err.message })
                return;
            }

            let userExists = await this.vendorsService.doesUsernameExist(createVendorRequestBody.userName);

            if (userExists) {
                response.status(400).json({ message: `Vendor ${createVendorRequestBody.userName} already exists!` });
                return;
            }

            let passwordHashed = await this.hashingService.hash(createVendorRequestBody.password);
            let id = await this.mssqlDatabaseService.getNewId("Vendor", "VendorId");
            let vendor = {
                vendorId: id,
                name: createVendorRequestBody.name,
                email: createVendorRequestBody.email,
                userName: createVendorRequestBody.userName,
                password: passwordHashed,
                phoneNumber: createVendorRequestBody.phoneNumber
            } as Vendor;
            let customerCreated = await this.vendorsService.createNewVendor(vendor);

            if (createVendorRequestBody.addresses.length == 0) {
                response.status(201).json({ message: "Account was successfully created!" });
                return;
            }

            for (let addressReq of createVendorRequestBody.addresses) {
                let newId = await this.mssqlDatabaseService.getNewId("Address", "AddressId");
                let address = { addressId: newId, street: addressReq.street, city: addressReq.city, postalCode: addressReq.postalCode, country: addressReq.country } as Address;
                await this.vendorsService.createNewVendorAddress(address, customerCreated);
            }

            response.status(201).json({ message: "Account was successfully created!" });
        }
        catch (err) {
            response.status(500).json({ message: err.message });
        }
    }

    /**
     * Represents a method that logs the vendor in.
     * @param request Format:
     * {
     *    userName: string,
     *    password: string
     * }
     * @param response The response. Format:
     * {
     *   id: number
     * }
     */
    @httpPost("/account/login")
    public async login(request: Request, response: Response): Promise<void> {
        try {
            let loginRequestBody: LoginVendorRequestBody = request.body as LoginVendorRequestBody;

            try {
                this.requestBodyValidationService.validateVendorLoginRequestBody(loginRequestBody);
            } catch (err) {
                response.status(400).json({ message: err.message })
                return;
            }

            let doesUserExist = await this.vendorsService.doesUsernameExist(loginRequestBody.userName);

            if (!doesUserExist) {
                response.status(400).json({ message: `The vendor ${loginRequestBody.userName} already exists!` });
                return;
            }

            // Fetch the vendor data
            let connection = await this.mssqlDatabaseService.initialize();
            let foundUser = await connection.models.Vendor.findOne({ where: { userName: loginRequestBody.userName } });
            let userConverted = foundUser.dataValues as Vendor;
            await connection.close();

            // Check the password
            if (!this.hashingService.isValid(loginRequestBody.password, userConverted.password)) {
                response.status(400).json({ message: "Invalid password!" });
                return;
            }

            let id = await this.vendorSessionService.registerVendorSession(userConverted.vendorId);
            response.status(200).json({ id: id });
        }
        catch (err) {
            response.status(500).json({ message: err.message });
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
     *    phoneNumber: string
     * }
     * @param response The response. Format:
     * {
     *   message: string
     * }
     */
    @httpPut("/account/update/:vid")
    public async updateAccount(request: Request, response: Response): Promise<void> {
        try {
            let updateRequestBody: UpdateVendorRequestBody = request.body as UpdateVendorRequestBody;

            try {
                this.requestBodyValidationService.validateUpdateVendorRequestBody(updateRequestBody);
            } catch (err) {
                response.status(400).json({ message: err.message })
                return;
            }

            let verified = await this.vendorSessionService.verifyVendor(updateRequestBody.vendorId);

            if (!verified) {
                response.status(403).json({ message: "Unauthorized!" });
                return;
            }

            if (Number(request.params.vid) !== updateRequestBody.vendorId) {
                response.status(400).json({ message: "The vendor ID in the parameters and in the request body have to match!" });
                return;
            }

            // Find similar vendor
            let connection = await this.mssqlDatabaseService.initialize();
            let foundUser = await connection.models.Vendor.findOne({ where: { userName: updateRequestBody.userName, vendorId: { [Op.ne]: updateRequestBody.vendorId } } });
            await connection.close();

            if (foundUser !== null) {
                response.status(400).json({ message: `The given username ${updateRequestBody.userName} already exists!` });
                return;
            }

            let passwordHashed = await this.hashingService.hash(updateRequestBody.password);
            let customer = {
                vendorId: updateRequestBody.vendorId,
                name: updateRequestBody.name,
                email: updateRequestBody.email,
                userName: updateRequestBody.userName,
                password: passwordHashed,
                phoneNumber: updateRequestBody.phoneNumber
            } as Vendor;

            let updated = await this.vendorsService.updateExistingVendor(customer, updateRequestBody.vendorId);
            response.status(201).json({ message: "The vendor was successfully updated!" });
        }
        catch (err) {
            response.status(500).json({ message: err.message });
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
    public async getAccountInformation(request: Request, response: Response): Promise<void> {
        try {
            let verified = await this.vendorSessionService.verifyVendor(Number(request.params.vid));

            if (!verified) {
                response.status(403).json({ message: "Unauthorized!" });
                return;
            }

            // Retrieve vendor information
            let connection = await this.mssqlDatabaseService.initialize();
            let data = await connection.query("select v.*, a.* from Vendor v left outer join VendorToAddress va " +
                "on v.VendorId = va.VendorId " +
                "left outer join Address a " +
                "on va.AddressId = a.AddressId " +
                `where v.VendorId = ${request.params.vid}`);
            await connection.close();
            let addresses: Address[] = data[0].map(function (information) {
                let a = {
                    addressId: information["AddressId"], street: information["Street"],
                    city: information["City"], postalCode: information["PostalCode"],
                    country: information["Country"]
                } as Address;
                return a;
            });

            let vendorDataObject = data[0][0];
            let result = {
                vendorId: request.params.vid, userName: vendorDataObject["UserName"],
                name: vendorDataObject["Name"], email: vendorDataObject["Email"],
                phoneNumber: vendorDataObject["PhoneNumber"],
                addresses: addresses
            };
            response.status(200).json(result);
        }
        catch (err) {
            response.status(500).json({ message: err.message });
        }
    }

    /**
     * Deletes the account.
     * @param request The request body.
     * @param response The response. Format:
     * {
     *   message: string
     * }
     */
    @httpDelete("/account/:vid")
    public async deleteAccount(request: Request, response: Response): Promise<void> {
        try {
            let vendorId = Number(request.params.vid);
            let verified = await this.vendorSessionService.verifyVendor(vendorId);

            if (!verified) {
                response.status(403).json({ message: "Unauthorized!" });
                return;
            }

            // Delete all products
            let connection = await this.mssqlDatabaseService.initialize();
            let ids = await connection.models.VendorToProduct.findAll({ attributes: ["vendorToProductId"], where: { vendorId: vendorId } });
            let idValues = ids.map(function (v) {
                return Number(v.dataValues["vendorToProductId"]);
            });
            await connection.close();
            await this.vendorsService.removeVendorToProducts(idValues);

            // Delete all addresses 
            let addresses = await this.vendorsService.getVendorAddresses(vendorId);
            await this.vendorsService.deleteVendorAddresses(addresses.map(add => add.addressId), vendorId);

            // Delete the final account
            connection = await this.mssqlDatabaseService.initialize();
            await connection.models.Vendor.destroy({ where: { vendorId: vendorId } });
            await connection.close();
            response.status(200).json({ message: `Vendor with ID ${vendorId} was successfully deleted!` });
        }
        catch (err) {
            response.status(500).json({ message: err.message });
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
     * @param response The response. Format:
     *  {
     *    message: string
     *  }
     */
    @httpPost("/address/create")
    public async addVendorAddress(request: Request, response: Response): Promise<void> {
        try {
            let addAddressRequestBody: AddVendorAddressRequestBody = request.body as AddVendorAddressRequestBody;

            try {
                this.requestBodyValidationService.validateAddVendorAddressRequestBody(addAddressRequestBody);
            } catch (err) {
                response.status(400).json({ message: err.message })
                return;
            }

            let verified = await this.vendorSessionService.verifyVendor(addAddressRequestBody.vendorId);

            if (!verified) {
                response.status(403).json({ message: "Unauthorized!" });
                return;
            }

            // Fetch vendor data
            let connection = await this.mssqlDatabaseService.initialize();
            let foundUser = await connection.models.Vendor.findOne({ where: { vendorId: addAddressRequestBody.vendorId } });
            let userConverted = foundUser.dataValues as Vendor;
            await connection.close();

            // Save address data
            let addressId = await this.mssqlDatabaseService.getNewId("Address", "AddressId");
            let address = {
                addressId: addressId, street: addAddressRequestBody.street,
                city: addAddressRequestBody.city, postalCode: addAddressRequestBody.postalCode,
                country: addAddressRequestBody.country
            } as Address;
            let addressCreated = await this.vendorsService.createNewVendorAddress(address, userConverted);
            response.status(201).json({ message: "Address was successfully created." });
        }
        catch (err) {
            response.status(500).json({ message: err.message });
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
     *    }
     *  }
     */
    @httpPut("/address/update/:aid")
    public async updateVendorAddress(request: Request, response: Response): Promise<void> {
        try {
            let updateAddressRequestBody: UpdateVendorAddressRequestBody = request.body as UpdateVendorAddressRequestBody;

            try {
                this.requestBodyValidationService.validateUpdateVendorAddressRequestBody(updateAddressRequestBody);
            } catch (err) {
                response.status(400).json({ message: err.message })
                return;
            }

            let verified = await this.vendorSessionService.verifyVendor(updateAddressRequestBody.vendorId);

            if (!verified) {
                response.status(403).json({ message: "Unauthorized!" });
                return;
            }

            if (Number(request.params.aid) !== updateAddressRequestBody.addressId) {
                response.status(400).json({ message: "The address ID in the parameters and in the request body have to match!" });
                return;
            }

            // Fetch customer data
            let connection = await this.mssqlDatabaseService.initialize();
            let foundUser = await connection.models.Vendor.findOne({ where: { vendorId: updateAddressRequestBody.vendorId } });
            let userConverted = foundUser.dataValues as Vendor;
            await connection.close();

            let addressData = {
                addressId: updateAddressRequestBody.addressId,
                street: updateAddressRequestBody.street, city: updateAddressRequestBody.city,
                country: updateAddressRequestBody.country, postalCode: updateAddressRequestBody.postalCode
            } as Address;
            let updatedAddress = await this.vendorsService.updateVendorAddress(addressData, userConverted);
            response.status(201).json({ message: "The address was successfully updated!", newAddress: updatedAddress });
        }
        catch (err) {
            response.status(500).json({ message: err.message });
        }
    }

    /**
     * Deletes an address for a vendor.
     * @param request The request body.
     * @param response The response. Format:
     *  {
     *    message: string
     *  }
     */
    @httpDelete("/address/:vid/:aid")
    public async deleteVendorAddress(request: Request, response: Response): Promise<void> {
        try {
            let vendorId = Number(request.params.vid);
            let addressId = Number(request.params.aid);

            let verified = await this.vendorSessionService.verifyVendor(vendorId);

            if (!verified) {
                response.status(403).json({ message: "Unauthorized!" });
                return;
            }

            await this.vendorsService.deleteVendorAddress(addressId, vendorId);
            response.status(200).json({ message: `The address with ID ${addressId} was successfully deleted!` });
        }
        catch (err) {
            response.status(500).json({ message: err.message });
        }
    }

    /**
     * Fetches addresses for a vendor.
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
    public async getAddresses(request: Request, response: Response): Promise<void> {
        try {
            let vendorId = Number(request.params.vid);
            let verified = await this.vendorSessionService.verifyVendor(vendorId);

            if (!verified) {
                response.status(403).json({ message: "Unauthorized!" });
                return;
            }

            let addresses = this.vendorsService.getVendorAddresses(vendorId);
            response.status(200).json({ "addresses": addresses });
        }
        catch (err) {
            response.status(500).json({ message: err.message });
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
     *    ],
     *    // multer
     *    imageContent: <file>,
     *    videoContent: <file>
     * }
     * @param response The response. Format:
     *  {
     *    message: string
     *  }
     */
    @httpPost("/product/create", upload.fields([{ name: "imageContent", maxCount: 1 }, { name: "videoContent", maxCount: 1 }]))
    public async addVendorProduct(request: Request, response: Response): Promise<void> {
        try {
            let bodyConverted = this.formDataConversionService.convertToCreateVendorProductRequestBody(request.body);

            try {
                this.requestBodyValidationService.validateCreateVendorProductRequestBody(bodyConverted);
            } catch (err) {
                response.status(400).json({ message: err.message })
                return;
            }

            let verified = await this.vendorSessionService.verifyVendor(bodyConverted.vendorId);

            if (!verified) {
                response.status(403).json({ message: "Unauthorized!" });
                return;
            }

            let categories: Category[] = [];

            // Check if categories exist
            if (bodyConverted.categories.length !== 0) {
                let ids = bodyConverted.categories.map((c) => c.categoryId);
                let connection = await this.mssqlDatabaseService.initialize();
                let data = await connection.models.Category.findAll({ where: { categoryId: { [Op.in]: ids } } });

                if (data.length != bodyConverted.categories.length) {
                    response.status(400).json({ message: "Non existing categories detected!" });
                    await connection.close();
                    return;
                }

                categories = data.map(function (c) {
                    return { categoryId: c.dataValues["categoryId"], name: c.dataValues["name"] } as Category;
                });

                await connection.close();
            }

            // Generate new product ID
            let newId = await this.mssqlDatabaseService.getNewId("Product", "ProductId");
            let productInformation = {
                productId: newId, name: bodyConverted.name, description: bodyConverted.description,
                unitPriceEuro: bodyConverted.unitPriceEuro, inventoryLevel: bodyConverted.inventoryLevel,
                categories: categories
            } as ProductInformation;
            let vendorToProductId = await this.vendorsService.createNewVendorProduct(bodyConverted.vendorId, productInformation);

            // Create new image
            if (request.files["imageContent"] != undefined) {
                let newImageId = await this.mongoDBService.getNewId("ProductImage", "pictureId");
                let fileName = request.files["imageContent"][0].originalname;
                let contentType = request.files["imageContent"][0].mimetype;
                let buffer = request.files["imageContent"][0].buffer;
                let image = { pictureId: newImageId, vendorToProductId: vendorToProductId, imageContent: "" } as ProductImage;
                await this.productsService.createProductImage(image, fileName, contentType, buffer);
            }

            // Create new video
            if (request.files["videoContent"] != undefined) {
                let newVideoId = await this.mongoDBService.getNewId("ProductVideo", "videoId");
                let fileName = request.files["videoContent"][0].originalname;
                let contentType = request.files["videoContent"][0].mimetype;
                let buffer = request.files["videoContent"][0].buffer;
                let video = { videoId: newVideoId, vendorToProductId: vendorToProductId, videoContent: "" } as ProductVideo;
                await this.productsService.createProductVideo(video, fileName, contentType, buffer);
            }

            response.status(201).json({ message: "The product was successfully created!" });
        }
        catch (err) {
            response.status(500).json({ message: err.message });
        }
    }

    /**
     * Updates a vendor product.
     * @param request The request body. Format:
     * {
     *   vendorId: number,
     *   vendorToProductId: number,
     *   unitPriceEuro: number,
     *   inventoryLevel: number,
     *   name: string,
     *   description: string,
     *   imageContent: <file>,
     *   videoContent: <file>
     * }
     * @param response The response. Format:
     *  {
     *    message: string,
     *    updatedData: {
     *       unitPriceEuro: number,
     *       inventoryLevel: number,
     *       name: string,
     *       description: string,
     *       productImage: string,
     *       productVideo: string
     *    }
     *  }
     */
    @httpPut("/product/update/:pid", upload.fields([{ name: "imageContent", maxCount: 1 }, { name: "videoContent", maxCount: 1 }]))
    public async updateVendorProduct(request: Request, response: Response): Promise<void> {
        try {
            let bodyConverted = this.formDataConversionService.convertToUpdateVendorProductRequestBody(request.body);

            try {
                this.requestBodyValidationService.validateUpdateVendorProductRequestBody(bodyConverted);
            } catch (err) {
                response.status(400).json({ message: err.message })
                return;
            }

            let verified = await this.vendorSessionService.verifyVendor(bodyConverted.vendorId);

            if (!verified) {
                response.status(403).json({ message: "Unauthorized!" });
                return;
            }

            let vendorToProductId = Number(request.params.pid);

            if (vendorToProductId !== bodyConverted.vendorToProductId) {
                response.status(400).json({ message: "Vendor's product ID in the request parameters and in the request body do not match!" });
                return;
            }

            let updateInformation = {
                productId: -1, name: bodyConverted.name, description: bodyConverted.description,
                unitPriceEuro: bodyConverted.unitPriceEuro, inventoryLevel: bodyConverted.inventoryLevel,
                categories: []
            } as ProductInformation;
            let updateInfo = await this.vendorsService.updateVendorProduct(bodyConverted.vendorId, vendorToProductId, updateInformation);
            let productImage = null;
            let productVideo = null;

            // Reupload the product image
            if (request.files["imageContent"] != undefined) {
                let newImageId = await this.mongoDBService.getNewId("ProductImage", "pictureId");
                let fileName = request.files["imageContent"][0].originalname;
                let contentType = request.files["imageContent"][0].mimetype;
                let buffer = request.files["imageContent"][0].buffer;
                let image = { pictureId: newImageId, vendorToProductId: vendorToProductId, imageContent: "" } as ProductImage;
                await this.productsService.updateImage(image, fileName, contentType, buffer);
            }

            // Reupload the product video
            if (request.files["videoContent"] != undefined) {
                let newVideoId = await this.mongoDBService.getNewId("ProductVideo", "videoId");
                let fileName = request.files["videoContent"][0].originalname;
                let contentType = request.files["videoContent"][0].mimetype;
                let buffer = request.files["videoContent"][0].buffer;
                let video = { videoId: newVideoId, vendorToProductId: vendorToProductId, videoContent: "" } as ProductVideo;
                await this.productsService.updateVideo(video, fileName, contentType, buffer);
            }

            let fetchedImages = await this.productsService.getProductImages(vendorToProductId);

            if (fetchedImages.length > 0) {
                productImage = fetchedImages[0].imageContent;
            }

            let fetchedVideos = await this.productsService.getProductVideos(vendorToProductId);

            if (fetchedImages.length > 0) {
                productVideo = fetchedVideos[0].videoContent;
            }

            let resultObject = {
                message: "The product was successfully updated!",
                updatedData: {
                    unitPriceEuro: updateInformation.unitPriceEuro,
                    inventoryLevel: updateInformation.inventoryLevel,
                    name: updateInformation.name,
                    description: updateInformation.description,
                    productImage: productImage,
                    productVideo: productVideo
                }
            };

            response.status(201).json(resultObject);
        }
        catch (err) {
            response.status(500).json({ message: err.message });
        }
    }

    /**
     * Retrieves products offered by the vendor (his own products).
     * @param request The request body.
     * @param response The reponse body. Format:
     * {
     *   "result": [
     *   {
     *       productId: number,
     *       name: string,
     *       description: string,
     *       unitPriceEuro: decimal,
     *       inventoryLevel: number,
     *       productVideo: content,
     *       productImage: content,
     *       categories: [
     *         {
     *           categoryId: number,
     *           name: string
     *         },
     *        ...
     *       ]
     *    },
     *   ... 
     *    ]
     * }
     */
    @httpGet("/product/:vid")
    public async getVendorProducts(request: Request, response: Response): Promise<void> {
        try {
            let vendorId = Number(request.params.vid);
            let verified = await this.vendorSessionService.verifyVendor(vendorId);

            if (!verified) {
                response.status(403).json({ message: "Unauthorized!" });
                return;
            }

            let productInformation: ProductInformation[] = await this.productsService.getVendorProducts(vendorId);
            let resultObject = { result: productInformation };
            response.status(200).json(resultObject);
        }
        catch (err) {
            response.status(500).json({ message: err.message });
        }
    }

    /**
     * Removes a vendor product.
     * @param request The request body.
     * @param response The response. Format:
     *  {
     *    message: string
     *  }
     */
    @httpDelete("/product/:vid/:pid")
    public async removeVendorProduct(request: Request, response: Response): Promise<void> {
        try {
            let vendorId = Number(request.params.vid);
            let vendorToProductId = Number(request.params.pid);
            let verified = await this.vendorSessionService.verifyVendor(vendorId);

            if (!verified) {
                response.status(403).json({ message: "Unauthorized!" });
                return;
            }

            // Check if the product belongs to the vendor
            let connection = await this.mssqlDatabaseService.initialize();
            let vendorReference = await connection.models.VendorToProduct.findOne({ where: { vendorToProductId: vendorToProductId, vendorId: vendorId } });

            if (vendorReference == null) {
                response.status(400).json({ message: `Vendor's product with ID ${vendorToProductId} does not belong to vendor ${vendorId}!` });
                return;
            }

            await connection.close();
            await this.vendorsService.removeVendorProduct(vendorToProductId);
            response.status(200).json({ message: `The vendor's product with ID ${vendorToProductId} was successfully deleted!` });
        }
        catch (err) {
            response.status(500).json({ message: err.message });
        }
    }

    /**
     * Adds a category to the global product definition.
     * @param request The request body. Format:
     * {
     *   vendorId: number,
     *   vendorToProductId: number,
     *   categoryId: number
     * }
     * @param response The response body. Format:
     * {
     *   message: string
     * }
     */
    @httpPost("/product/addcategory")
    public async addCategory(request: Request, response: Response): Promise<void> {
        try {
            let addCategoryRequestBody: AddCategoryRequestBody = request.body as AddCategoryRequestBody;

            try {
                this.requestBodyValidationService.validateAddCategoryRequestBody(addCategoryRequestBody);
            } catch (err) {
                response.status(400).json({ message: err.message })
                return;
            }

            let verified = await this.vendorSessionService.verifyVendor(addCategoryRequestBody.vendorId);

            if (!verified) {
                response.status(403).json({ message: "Unauthorized!" });
                return;
            }

            // Check if the product belongs to the vendor
            let connection = await this.mssqlDatabaseService.initialize();
            let vendorReference = await connection.models.VendorToProduct.findOne({ where: { vendorToProductId: addCategoryRequestBody.vendorToProductId, vendorId: addCategoryRequestBody.vendorId } });

            if (vendorReference == null) {
                response.status(400).json({ message: `Vendor's product with ID ${addCategoryRequestBody.vendorToProductId} does not belong to vendor ${addCategoryRequestBody.vendorId}!` });
                return;
            }

            // Check if the category exists
            let categoryFound = await connection.models.Category.findOne({ where: { categoryId: addCategoryRequestBody.categoryId } });
            await connection.close();

            if (categoryFound == null) {
                response.status(400).json({ message: `Category with ID ${addCategoryRequestBody.categoryId} does not exist!` });
                return;
            }

            let referenceConverted = vendorReference.dataValues as VendorToProduct;
            await this.vendorsService.createProductCategoryReferenceIfNotExist(referenceConverted.productId, addCategoryRequestBody.categoryId);
            response.status(201).json({ message: `Category with ID ${addCategoryRequestBody.categoryId} was successfully added to product with ID ${referenceConverted.productId}!` });
        }
        catch (err) {
            response.status(500).json({ message: err.message });
        }
    }

    /**
     * Removes a category from the global product definition.
     * @param request The request body. Format:
     * {
     *   vendorId: number,
     *   vendorToProductId: number,
     *   categoryId: number
     * }
     * @param response The response body. Format:
     * {
     *   message: string
     * }
     */
    @httpPut("/product/removecategory")
    public async removeCategory(request: Request, response: Response): Promise<void> {
        try {
            let removeCategoryRequestBody: RemoveCategoryRequestBody = request.body as RemoveCategoryRequestBody;

            try {
                this.requestBodyValidationService.validateRemoveCategoryRequestBody(removeCategoryRequestBody);
            } catch (err) {
                response.status(400).json({ message: err.message })
                return;
            }

            let verified = await this.vendorSessionService.verifyVendor(removeCategoryRequestBody.vendorId);

            if (!verified) {
                response.status(403).json({ message: "Unauthorized!" });
                return;
            }

            // Check if the product belongs to the customer
            let connection = await this.mssqlDatabaseService.initialize();
            let vendorReference = await connection.models.VendorToProduct.findOne({ where: { vendorToProductId: removeCategoryRequestBody.vendorToProductId, vendorId: removeCategoryRequestBody.vendorId } });

            if (vendorReference == null) {
                response.status(400).json({ message: `Vendor's product with ID ${removeCategoryRequestBody.vendorToProductId} does not belong to vendor ${removeCategoryRequestBody.vendorId}!` });
                return;
            }

            // Check if the category exists
            let categoryFound = await connection.models.Category.findOne({ where: { categoryId: removeCategoryRequestBody.categoryId } });

            if (categoryFound == null) {
                response.status(400).json({ message: `Category with ID ${removeCategoryRequestBody.categoryId} does not exist!` });
                return;
            }

            // Check if the product has the category
            let referenceConverted = vendorReference.dataValues as VendorToProduct;

            let doesCategoryExist = await this.categoriesService.doesCategoryExist(referenceConverted.productId, removeCategoryRequestBody.categoryId);
            if (!doesCategoryExist) {
                response.status(400).json({ message: `Category with ID ${removeCategoryRequestBody.categoryId} does not exist for product with ID ${referenceConverted.productId}!` });
                return;
            }

            await this.vendorsService.removeProductCategoryReference(referenceConverted.productId, removeCategoryRequestBody.categoryId);
            await connection.close();
            response.status(200).json({ message: `Category with ID ${removeCategoryRequestBody.categoryId} was successfully removed from product with ID ${referenceConverted.productId}!` });
        }
        catch (err) {
            response.status(500).json({ message: err.message });
        }
    }
}