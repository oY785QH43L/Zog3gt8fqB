import 'reflect-metadata';
import { inject, injectable } from 'inversify';
import { controller, httpDelete, httpPost, httpPut, interfaces } from 'inversify-express-utils';
import { Request, Response } from 'express';
import { RequestBodyValidationService } from '../core/services/request.body.validation.service';
import { AdminService } from '../core/services/admin.service';
import { CreateCourierRequestBody } from '../models/request.bodies/admin.request.bodies/create.courier.request.body/create.courier.request.body';
import { Courier } from '../models/courier.model';
import { Address } from '../models/address.model';
import { UpdateCourierRequestBody } from '../models/request.bodies/admin.request.bodies/update.courier.request.body';
import { Op } from 'sequelize';
import { AddCourierAddressRequestBody } from '../models/request.bodies/admin.request.bodies/add.courier.address.request.body';
import { UpdateCourierAddressRequestBody } from '../models/request.bodies/admin.request.bodies/update.courier.address.request.body';
import { RemoveCourierAddressRequestBody } from '../models/request.bodies/admin.request.bodies/remove.courier.address.request.body';
import { CreateCategoryRequestBody } from '../models/request.bodies/admin.request.bodies/create.category.request.body';
import { Category } from '../models/category.model';
import { UpdateCategoryRequestBody } from '../models/request.bodies/admin.request.bodies/update.category.request.body';
import { AddRecommendationRequestBody } from '../models/request.bodies/admin.request.bodies/add.recommendation.request.body';
import { ProductRecommendation } from '../models/product.recommendation.model';
import { UpdateRecommendationRequestBody } from '../models/request.bodies/admin.request.bodies/update.recommendation.request.body';
import * as mongoose from "mongoose";
import { IProductRecommendation } from '../models/mongodb.models/mongodb.interfaces/product.recommendation.mongodb.interface';
import recommendationSchema from '../models/mongodb.models/mongodb.schemas/product.recommendation.mongodb.schema';
import { MssqlDatabaseService } from '../core/services/mssql.database.service';
import { MongoDbDatabaseService } from '../core/services/mongodb.database.service';
import { CategoriesService } from '../core/services/categories.service';
import { ProductRecommendationService } from '../core/services/product.recommendation.service';


@controller("/admin")
@injectable()
/**
 * The admin controller.
 */
export class AdminController implements interfaces.Controller {
    /**
     * Initializes the admin controller.
     * @param categoriesService The categories service.
     * @param productRecommendationService The product recommendation service.
     * @param mssqlDatabaseService The MSSQL database service.
     * @param mongoDBService The MongoDB service.
     * @param adminService The admin service.
     * @param requestBodyValidationService The request body validation service.
     */
    constructor(
        @inject(CategoriesService.name) private categoriesService: CategoriesService,
        @inject(ProductRecommendationService.name) private productRecommendationService: ProductRecommendationService,
        @inject(MssqlDatabaseService.name) private mssqlDatabaseService: MssqlDatabaseService,
        @inject(MongoDbDatabaseService.name) private mongoDBService: MongoDbDatabaseService,
        @inject(AdminService.name) private adminService: AdminService,
        @inject(RequestBodyValidationService.name) private requestBodyValidationService: RequestBodyValidationService
    ) { }

    /**
     * Represents a controller method that creates a courier.
     * @param request Format: 
     * {
     *    adminId: number,
     *    name: string,
     *    email: string,
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
    @httpPost("/courier/create")
    public async createCourier(request: Request, response: Response): Promise<void> {
        try {
            let createCourierRequestBody: CreateCourierRequestBody = request.body as CreateCourierRequestBody;

            try {
                this.requestBodyValidationService.validateCreateCourierRequestBody(createCourierRequestBody);
            } catch (err) {
                response.status(400).json({ message: err.message })
                return;
            }

            if (createCourierRequestBody.adminId !== Number(process.env.ADMIN_ID)) {
                response.status(403).json({ message: "Unauthorized!" });
                return;
            }

            let courierExists = await this.adminService.doesNameExist(createCourierRequestBody.name);

            if (courierExists) {
                response.status(400).json({ message: `Courier ${createCourierRequestBody.name} already exists!` });
                return;
            }

            let id = await this.mssqlDatabaseService.getNewId("Courier", "CourierId");
            let courier = {
                courierId: id,
                name: createCourierRequestBody.name,
                email: createCourierRequestBody.email,
                phoneNumber: createCourierRequestBody.phoneNumber
            } as Courier;

            let courierCreated = await this.adminService.createNewCourier(courier);

            if (createCourierRequestBody.addresses.length == 0) {
                response.status(201).json({ message: "Account was successfully created!" });
                return;
            }

            for (let addressReq of createCourierRequestBody.addresses) {
                let newId = await this.mssqlDatabaseService.getNewId("Address", "AddressId");
                let address = { addressId: newId, street: addressReq.street, city: addressReq.city, postalCode: addressReq.postalCode, country: addressReq.country } as Address;
                await this.adminService.createNewCourierAddress(address, courierCreated);
            }

            response.status(201).json({ message: "Courier was successfully created!" });
        }
        catch (err) {
            response.status(500).json({ message: err.message });
        }
    }

    /**
     * Updates a courier account.
     * @param request Format:
     * {
     *    adminId: number,
     *    courierId: number,
     *    name: string,
     *    email: string,
     *    phoneNumber: string
     * }
     * @param response The response. Format:
     * {
     *   message: string
     * }
     */
    @httpPut("/courier/update/:cid")
    public async updateCourier(request: Request, response: Response): Promise<void> {
        try {
            let updateRequestBody: UpdateCourierRequestBody = request.body as UpdateCourierRequestBody;

            try {
                this.requestBodyValidationService.validateUpdateCourierRequestBody(updateRequestBody);
            } catch (err) {
                response.status(400).json({ message: err.message })
                return;
            }

            if (updateRequestBody.adminId !== Number(process.env.ADMIN_ID)) {
                response.status(403).json({ message: "Unauthorized!" });
                return;
            }

            if (Number(request.params.cid) !== updateRequestBody.courierId) {
                response.status(400).json({ message: "The courier ID in the parameters and in the request body have to match!" });
                return;
            }

            // Find similar courier
            let connection = await this.mssqlDatabaseService.initialize();
            let foundCourier = await connection.models.Courier.findOne({ where: { name: updateRequestBody.name, courierId: { [Op.ne]: updateRequestBody.courierId } } });
            await connection.close();

            if (foundCourier !== null) {
                response.status(400).json({ message: `The given name ${updateRequestBody.name} already exists!` });
                return;
            }

            let courier = {
                courierId: updateRequestBody.courierId,
                name: updateRequestBody.name,
                email: updateRequestBody.email,
                phoneNumber: updateRequestBody.phoneNumber
            } as Courier;

            let updated = await this.adminService.updateExistingCourier(courier, updateRequestBody.courierId);
            response.status(201).json({ message: "The courier was successfully updated!" });
        }
        catch (err) {
            response.status(500).json({ message: err.message });
        }
    }

    /**
     * Removes a courier.
     * @param response The response. Format:
     * {
     *   message: string
     * }
     */
    @httpDelete("/courier/:adminId/:cid")
    public async removeCourier(request: Request, response: Response): Promise<void> {
        try {
            let adminId = Number(request.params.adminId);
            let courierId = Number(request.params.cid);


            if (adminId !== Number(process.env.ADMIN_ID)) {
                response.status(403).json({ message: "Unauthorized!" });
                return;
            }

            let connection = await this.mssqlDatabaseService.initialize();
            let existingOrderPosition = await connection.models.OrderPosition.findOne({ where: { courierCompanyId: courierId } });

            if (existingOrderPosition !== null) {
                response.status(400).json({ message: `Courier cannot be removed as it is referenced by an order position!` });
                await connection.close();
                return;
            }

            // Delete the addresses
            let ids = await connection.models.CourierToAddress.findAll({ attributes: ["addressId"], where: { courierId: courierId } });
            let idValues = ids.map(function(v) {
                return Number(v.dataValues["addressId"]);
            })

            await this.adminService.deleteCourierAddresses(idValues, courierId);

            // Delete the courier
            await connection.models.Courier.destroy({ where: { courierId: courierId } });
            await connection.close();
            response.status(200).json({ message: `The courier with ID ${courierId} was successfully deleted!` });
        }
        catch (err) {
            response.status(500).json({ message: err.message });
        }
    }

    /**
     * Adds a new courier address.
     * @param request The request body. Format:
     * {
     *   adminId: number,
     *   courierId: number,
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
    @httpPost("/courier/address/create")
    public async addCourierAddress(request: Request, response: Response): Promise<void> {
        try {
            let addAddressRequestBody: AddCourierAddressRequestBody = request.body as AddCourierAddressRequestBody;

            try {
                this.requestBodyValidationService.validateAddCourierAddressRequestBody(addAddressRequestBody);
            } catch (err) {
                response.status(400).json({ message: err.message })
                return;
            }

            if (addAddressRequestBody.adminId !== Number(process.env.ADMIN_ID)) {
                response.status(403).json({ message: "Unauthorized!" });
                return;
            }

            // Fetch courier data
            let connection = await this.mssqlDatabaseService.initialize();
            let foundCourier = await connection.models.Courier.findOne({ where: { courierId: addAddressRequestBody.courierId } });
            let courierConverted = foundCourier.dataValues as Courier;
            await connection.close();

            // Save address data
            let addressId = await this.mssqlDatabaseService.getNewId("Address", "AddressId");
            let address = {
                addressId: addressId, street: addAddressRequestBody.street,
                city: addAddressRequestBody.city, postalCode: addAddressRequestBody.postalCode,
                country: addAddressRequestBody.country
            } as Address;
            let addressCreated = await this.adminService.createNewCourierAddress(address, courierConverted);
            response.status(201).json({ message: "Address was successfully created." });
        }
        catch (err) {
            response.status(500).json({ message: err.message });
        }
    }

    /**
     * Updates a courier address.
     * @param request The request body. Format:
     * {
     *   adminId: number,
     *   courierId: number,
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
    @httpPut("/courier/address/update/:aid")
    public async updateCourierAddress(request: Request, response: Response): Promise<void> {
        try {
            let updateAddressRequestBody: UpdateCourierAddressRequestBody = request.body as UpdateCourierAddressRequestBody;

            try {
                this.requestBodyValidationService.validateUpdateCourierAddressRequestBody(updateAddressRequestBody);
            } catch (err) {
                response.status(400).json({ message: err.message })
                return;
            }

            if (updateAddressRequestBody.adminId !== Number(process.env.ADMIN_ID)) {
                response.status(403).json({ message: "Unauthorized!" });
                return;
            }

            if (Number(request.params.aid) !== updateAddressRequestBody.addressId) {
                response.status(400).json({ message: "The address ID in the parameters and in the request body have to match!" });
                return;
            }

            // Fetch courier data
            let connection = await this.mssqlDatabaseService.initialize();
            let foundCourier = await connection.models.Courier.findOne({ where: { courierId: updateAddressRequestBody.courierId } });
            let courierConverted = foundCourier.dataValues as Courier;
            await connection.close();

            let addressData = {
                addressId: updateAddressRequestBody.addressId,
                street: updateAddressRequestBody.street, city: updateAddressRequestBody.city,
                country: updateAddressRequestBody.country, postalCode: updateAddressRequestBody.postalCode
            } as Address;
            let updatedAddress = await this.adminService.updateCourierAddress(addressData, courierConverted);
            response.status(201).json({ message: "The address was successfully updated!", newAddress: updatedAddress });
        }
        catch (err) {
            response.status(500).json({ message: err.message });
        }
    }

    /**
     * Removes a courier address.
     * @param request The request body. Format:
     * {
     *   adminId: number,
     *   courierId: number,
     *   addressId: number
     * }
     * @param response The response. Format:
     *  {
     *    message: string
     *  }
     */
    @httpPost("/courier/address/remove")
    public async removeCourierAddress(request: Request, response: Response): Promise<void> {
        try {
            let removeCourierAddressRequestBody: RemoveCourierAddressRequestBody = request.body as RemoveCourierAddressRequestBody;

            try {
                this.requestBodyValidationService.validateRemoveCourierAddressRequestBody(removeCourierAddressRequestBody);
            } catch (err) {
                response.status(400).json({ message: err.message })
                return;
            }

            if (removeCourierAddressRequestBody.adminId !== Number(process.env.ADMIN_ID)) {
                response.status(403).json({ message: "Unauthorized!" });
                return;
            }


            await this.adminService.deleteCourierAddress(removeCourierAddressRequestBody.addressId, removeCourierAddressRequestBody.courierId);
            response.status(200).json({ message: `The address with ID ${removeCourierAddressRequestBody.addressId} was successfully deleted!` });
        }
        catch (err) {
            response.status(500).json({ message: err.message });
        }
    }

    /**
     * Creates a new category.
     * @param request The request body. Format:
     * {
     *   adminId: number,
     *   name: string
     * }
     * @param response The response. Format:
     *  {
     *    message: string
     *  }
     */
    @httpPost("/category/create")
    public async createCategory(request: Request, response: Response): Promise<void> {
        try {
            let createCategoryRequestBody: CreateCategoryRequestBody = request.body as CreateCategoryRequestBody;

            try {
                this.requestBodyValidationService.validateCreateCategoryRequestBody(createCategoryRequestBody);
            } catch (err) {
                response.status(400).json({ message: err.message })
                return;
            }

            if (createCategoryRequestBody.adminId !== Number(process.env.ADMIN_ID)) {
                response.status(403).json({ message: "Unauthorized!" });
                return;
            }


            let newId = await this.mssqlDatabaseService.getNewId("Category", "CategoryId");
            let category = { categoryId: newId, name: createCategoryRequestBody.name } as Category;
            await this.categoriesService.createCategory(category);
            response.status(201).json({ message: `The category was successfully created!` });
        }
        catch (err) {
            response.status(500).json({ message: err.message });
        }
    }

    /**
     * Updates a category.
     * @param request The request body. Format:
     * {
     *   adminId: number,
     *   categoryId: number,
     *   name: string
     * }
     * @param response The response. Format:
     *  {
     *    message: string
     *  }
     */
    @httpPut("/category/update/:cid")
    public async updateCategory(request: Request, response: Response): Promise<void> {
        try {
            let categoryId = Number(request.params.cid);
            let updateCategoryRequestBody: UpdateCategoryRequestBody = request.body as UpdateCategoryRequestBody;

            try {
                this.requestBodyValidationService.validateUpdateCategoryRequestBody(updateCategoryRequestBody);
            } catch (err) {
                response.status(400).json({ message: err.message })
                return;
            }

            if (updateCategoryRequestBody.adminId !== Number(process.env.ADMIN_ID)) {
                response.status(403).json({ message: "Unauthorized!" });
                return;
            }

            if (updateCategoryRequestBody.categoryId !== categoryId) {
                response.status(400).json({ message: "Category IDs in request parameters and body have to match!" });
                return;
            }

            let category = { categoryId: updateCategoryRequestBody.categoryId, name: updateCategoryRequestBody.name } as Category;
            await this.categoriesService.updateCategory(categoryId, category);
            response.status(201).json({ message: `The category with ID ${categoryId} was successfully updated!` });
        }
        catch (err) {
            response.status(500).json({ message: err.message });
        }
    }

    /**
     * Deletes a category.
     * @param request The request body.
     * @param response The response. Format:
     *  {
     *    message: string
     *  }
     */
    @httpDelete("/category/:adminId/:cid")
    public async deleteCategory(request: Request, response: Response): Promise<void> {
        try {
            let categoryId = Number(request.params.cid);
            let adminId = Number(request.params.adminId);

            if (adminId !== Number(process.env.ADMIN_ID)) {
                response.status(403).json({ message: "Unauthorized!" });
                return;
            }

            await this.categoriesService.deleteCategory(categoryId);
            response.status(200).json({ message: `The category with ID ${categoryId} was successfully deleted!` });
        }
        catch (err) {
            response.status(500).json({ message: err.message });
        }
    }

    /**
     * Creates a new recommendation.
     * @param request The request body. Format:
     * {
     *    adminId: number,
     *    customerId: number,
     *    vendorToProductId: number,
     *    purchaseProbability: float
     * }
     * @param response The response. Format:
     *  {
     *    message: string
     *  }
     */
    @httpPost("/recommendation/addrecommendation")
    public async addRecommendation(request: Request, response: Response): Promise<void> {
        try {
            let createRecommendationRequestBody: AddRecommendationRequestBody = request.body as AddRecommendationRequestBody;

            try {
                this.requestBodyValidationService.validateAddRecommendationRequestBody(createRecommendationRequestBody);
            } catch (err) {
                response.status(400).json({ message: err.message })
                return;
            }

            if (createRecommendationRequestBody.adminId !== Number(process.env.ADMIN_ID)) {
                response.status(403).json({ message: "Unauthorized!" });
                return;
            }

            let id = await this.mongoDBService.getNewId("ProductRecommendation", "recommendationId");
            let recommendation = {
                recommendationId: id, customerId: createRecommendationRequestBody.customerId,
                vendorToProductId: createRecommendationRequestBody.vendorToProductId,
                purchaseProbability: createRecommendationRequestBody.purchaseProbability,
                recommendationDate: new Date()
            } as ProductRecommendation;
            let recommendationResult = await this.productRecommendationService.createProductRecommendation(recommendation);
            response.status(201).json({ message: `The recommendation with ID ${id} was successfully created!` });
        }
        catch (err) {
            response.status(500).json({ message: err.message });
        }
    }

    /**
     * Updates an existing recommendation.
     * @param request The request body. Format:
     * {
     *    adminId: number,
     *    recommendationId: number,
     *    customerId: number,
     *    vendorToProductId: number,
     *    purchaseProbability: float
     * }
     * @param response The response. Format:
     *  {
     *    message: string
     *  }
     */
    @httpPut("/recommendation/update/:rid")
    public async updateRecommendation(request: Request, response: Response): Promise<void> {
        try {
            let updateRecommendationRequestBody: UpdateRecommendationRequestBody = request.body as UpdateRecommendationRequestBody;
            let rid = Number(request.params.rid);

            try {
                this.requestBodyValidationService.validateUpdateRecommendationRequestBody(updateRecommendationRequestBody);
            } catch (err) {
                response.status(400).json({ message: err.message })
                return;
            }

            if (updateRecommendationRequestBody.adminId !== Number(process.env.ADMIN_ID)) {
                response.status(403).json({ message: "Unauthorized!" });
                return;
            }

            if (rid !== updateRecommendationRequestBody.recommendationId) {
                response.status(400).json({ message: "Recommendation IDs in request parameters and body have to match!" });
                return;
            }

            let recommendation = {
                recommendationId: updateRecommendationRequestBody.recommendationId,
                customerId: updateRecommendationRequestBody.customerId,
                vendorToProductId: updateRecommendationRequestBody.vendorToProductId,
                purchaseProbability: updateRecommendationRequestBody.purchaseProbability,
                recommendationDate: new Date()
            } as ProductRecommendation;
            let recommendationResult = await this.productRecommendationService.updateProductRecommendation(rid, recommendation);
            response.status(201).json({ message: `The recommendation with ID ${rid} was successfully updated!` });
        }
        catch (err) {
            response.status(500).json({ message: err.message });
        }
    }

    /**
     * Deletes an existing recommendation.
     * @param request The request body. 
     * @param response The response. Format:
     *  {
     *    message: string
     *  }
     */
    @httpDelete("/recommendation/:adminId/:rid")
    public async deleteRecommendation(request: Request, response: Response): Promise<void> {
        try {
            let rid = Number(request.params.rid);
            let adminId = Number(request.params.adminId);

            if (adminId !== Number(process.env.ADMIN_ID)) {
                response.status(403).json({ message: "Unauthorized!" });
                return;
            }

            let ProductRecommendation = mongoose.model<IProductRecommendation>("ProductRecommendation", recommendationSchema, "ProductRecommendation");
            await this.mongoDBService.deleteMongoDBEntryByAttribute(ProductRecommendation, "recommendationId", rid);
            response.status(200).json({ message: `The recommendation with ID ${rid} was successfully deleted!` });
        }
        catch (err) {
            response.status(500).json({ message: err.message });
        }
    }
}