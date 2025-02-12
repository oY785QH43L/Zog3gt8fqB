import { inject, injectable } from 'inversify';
import { controller, httpDelete, httpPost, httpPut, interfaces } from 'inversify-express-utils';
import { Request, Response } from 'express';
import { RequestBodyValidationService } from '../core/services/request.body.validation.service';
import { AdminService } from '../core/services/admin.service';
import { CreateSupplierRequestBody } from '../models/request.bodies/admin.request.bodies/create.supplier.request.body/create.supplier.request.body';
import { Supplier } from '../models/supplier.model';
import { Address } from '../models/address.model';
import { UpdateSupplierRequestBody } from '../models/request.bodies/admin.request.bodies/update.supplier.request.body';
import { Op } from 'sequelize';
import { AddSupplierAddressRequestBody } from '../models/request.bodies/admin.request.bodies/add,supplier.address.request.body';
import { UpdateSupplierAddressRequestBody } from '../models/request.bodies/admin.request.bodies/update.supplier.address.request.body';
import { RemoveSupplierAddressRequestBody } from '../models/request.bodies/admin.request.bodies/remove.supplier.address.request.body';
import { CreateCategoryRequestBody } from '../models/request.bodies/admin.request.bodies/create.category.request.body';
import { Category } from '../models/category.model';
import { UpdateCategoryRequestBody } from '../models/request.bodies/admin.request.bodies/update.category.request.body';
import { MssqlDatabaseService } from '../core/services/mssql.database.service';

@controller("/admin")
@injectable()
/**
 * The admin controller.
 */
export class AdminController implements interfaces.Controller {
    /**
     * Initializes the admin controller.
     * @param mssqlDatabaseService The MSSQL database service.
     * @param adminService The admin service.
     * @param requestBodyValidationService The request body validation service.
     */
    constructor(
        @inject(MssqlDatabaseService.name) private mssqlDatabaseService: MssqlDatabaseService,
        @inject(AdminService.name) private adminService: AdminService,
        @inject(RequestBodyValidationService.name) private requestBodyValidationService: RequestBodyValidationService
    ) { }

    /**
     * Represents a controller method that creates a supplier.
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
     * @param response The response. Format
     *  {
     *    message: string
     *  }
     */
    @httpPost("/supplier/create")
    public async createSupplier(request: Request, response: Response): Promise<void> {
        try {
            let createSupplierRequestBody: CreateSupplierRequestBody = request.body as CreateSupplierRequestBody;

            try {
                this.requestBodyValidationService.validateCreateSupplierRequestBody(createSupplierRequestBody);
            } catch (err) {
                response.status(400).json({ message: err.message })
                return;
            }

            if (createSupplierRequestBody.adminId !== Number(process.env.ADMIN_ID)) {
                response.status(403).json({ message: "Unauthorized!" });
                return;
            }

            let supplierExists = await this.adminService.doesNameExist(createSupplierRequestBody.name);

            if (supplierExists) {
                response.status(400).json({ message: `Supplier ${createSupplierRequestBody.name} already exists!` });
                return;
            }

            let id = await this.mssqlDatabaseService.getNewId("Supplier", "SupplierId");
            let supplier = {
                supplierId: id,
                name: createSupplierRequestBody.name,
                email: createSupplierRequestBody.email,
                phoneNumber: createSupplierRequestBody.phoneNumber
            } as Supplier;

            let supplierCreated = await this.adminService.createNewSupplier(supplier);

            if (createSupplierRequestBody.addresses.length == 0) {
                response.status(201).json({ message: "Account was successfully created!" });
                return;
            }

            for (let addressReq of createSupplierRequestBody.addresses) {
                let newId = await this.mssqlDatabaseService.getNewId("Address", "AddressId");
                let address = { addressId: newId, street: addressReq.street, city: addressReq.city, postalCode: addressReq.postalCode, country: addressReq.country } as Address;
                await this.adminService.createNewSupplierAddress(address, supplierCreated);
            }

            response.status(201).json({ message: "Supplier was successfully created!" });
        }
        catch (err) {
            response.status(500).json({ message: err.message });
        }
    }

    /**
     * Updates the supplier account.
     * @param request Format:
     * {
     *    adminId: number,
     *    supplierId: number,
     *    name: string,
     *    email: string,
     *    phoneNumber: string,
     * }
     * @param response The response.Format:
     * {
     *   message: string
     * }
     */
    @httpPut("/supplier/update/:sid")
    public async updateSupplier(request: Request, response: Response): Promise<void> {
        try {
            let updateRequestBody: UpdateSupplierRequestBody = request.body as UpdateSupplierRequestBody;

            try {
                this.requestBodyValidationService.validateUpdateSupplierRequestBody(updateRequestBody);
            } catch (err) {
                response.status(400).json({ message: err.message })
                return;
            }

            if (updateRequestBody.adminId !== Number(process.env.ADMIN_ID)) {
                response.status(403).json({ message: "Unauthorized!" });
                return;
            }

            if (Number(request.params.sid) !== updateRequestBody.supplierId) {
                response.status(400).json({ message: "The supplier ID in the parameters and in the request body have to match!" });
                return;
            }

            // Find similar supplier
            let connection = await this.mssqlDatabaseService.initialize();
            let foundSupplier = await connection.models.Supplier.findOne({ where: { name: updateRequestBody.name, supplierId: { [Op.ne]: updateRequestBody.supplierId } } });
            await connection.close();

            if (foundSupplier !== null) {
                response.status(400).json({ message: `The given name ${updateRequestBody.name} already exists!` });
                return;
            }

            let supplier = {
                supplierId: updateRequestBody.supplierId,
                name: updateRequestBody.name,
                email: updateRequestBody.email,
                phoneNumber: updateRequestBody.phoneNumber
            } as Supplier;

            let updated = await this.adminService.updateExistingSupplier(supplier, updateRequestBody.supplierId);
            response.status(201).json({ message: "The supplier was successfully updated!" });
        }
        catch (err) {
            response.status(500).json({ message: err.message });
        }
    }

    /**
     * Removes the supplier.
     * @param response The response.Format:
     * {
     *   message: string
     * }
     */
    @httpDelete("/supplier/:adminId/:sid")
    public async removeSupplier(request: Request, response: Response): Promise<void> {
        try {
            let adminId = Number(request.params.adminId);
            let supplierId = Number(request.params.sid);


            if (adminId !== Number(process.env.ADMIN_ID)) {
                response.status(403).json({ message: "Unauthorized!" });
                return;
            }

            let connection = await this.mssqlDatabaseService.initialize();
            let existingOrderPosition = await connection.models.OrderPosition.findOne({ where: { supplierCompanyId: supplierId } });

            if (existingOrderPosition !== null) {
                response.status(400).json({ message: `Supplier cannot be removed as it is referenced by an order position!` });
                await connection.close();
                return;
            }

            // Delete the addresses
            let ids = await connection.models.SupplierToAddress.findAll({ attributes: ["addressId"], where: { supplierId: supplierId } });
            let idValues = ids.map(function(v) {
                return Number(v.dataValues["addressId"]);
            })

            await this.adminService.deleteSupplierAddresses(idValues, supplierId);

            // Delete the supplier
            await connection.models.Supplier.destroy({ where: { supplierId: supplierId } });
            await connection.close();
            response.status(200).json({ message: `The supplier with ID ${supplierId} was successfully deleted!` });
        }
        catch (err) {
            response.status(500).json({ message: err.message });
        }
    }

    /**
     * Adds a new supplier address.
     * @param request The request body. Format:
     * {
     *   adminId: number,
     *   supplierId: number,
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
    @httpPost("/supplier/address/create")
    public async addSupplierAddress(request: Request, response: Response): Promise<void> {
        try {
            let addAddressRequestBody: AddSupplierAddressRequestBody = request.body as AddSupplierAddressRequestBody;

            try {
                this.requestBodyValidationService.validateAddSupplierAddressRequestBody(addAddressRequestBody);
            } catch (err) {
                response.status(400).json({ message: err.message })
                return;
            }

            if (addAddressRequestBody.adminId !== Number(process.env.ADMIN_ID)) {
                response.status(403).json({ message: "Unauthorized!" });
                return;
            }

            // Fetch supplier data
            let connection = await this.mssqlDatabaseService.initialize();
            let foundSupplier = await connection.models.Supplier.findOne({ where: { supplierId: addAddressRequestBody.supplierId } });
            let supplierConverted = foundSupplier.dataValues as Supplier;
            await connection.close();

            // Save address data
            let addressId = await this.mssqlDatabaseService.getNewId("Address", "AddressId");
            let address = {
                addressId: addressId, street: addAddressRequestBody.street,
                city: addAddressRequestBody.city, postalCode: addAddressRequestBody.postalCode,
                country: addAddressRequestBody.country
            } as Address;
            let addressCreated = await this.adminService.createNewSupplierAddress(address, supplierConverted);
            response.status(201).json({ message: "Address was successfully created." });
        }
        catch (err) {
            response.status(500).json({ message: err.message });
        }
    }

    /**
     * Updates a supplier address.
     * @param request The request body. Format:
     * {
     *   adminId: number,
     *   supplierId: number,
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
    @httpPut("/supplier/address/update/:aid")
    public async updateSupplierAddress(request: Request, response: Response): Promise<void> {
        try {
            let updateAddressRequestBody: UpdateSupplierAddressRequestBody = request.body as UpdateSupplierAddressRequestBody;

            try {
                this.requestBodyValidationService.validateUpdateSupplierAddressRequestBody(updateAddressRequestBody);
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

            // Fetch supplier data
            let connection = await this.mssqlDatabaseService.initialize();
            let foundSupplier = await connection.models.Supplier.findOne({ where: { supplierId: updateAddressRequestBody.supplierId } });
            let supplierConverted = foundSupplier.dataValues as Supplier;
            await connection.close();

            let addressData = {
                addressId: updateAddressRequestBody.addressId,
                street: updateAddressRequestBody.street, city: updateAddressRequestBody.city,
                country: updateAddressRequestBody.country, postalCode: updateAddressRequestBody.postalCode
            } as Address;
            let updatedAddress = await this.adminService.updateSupplierAddress(addressData, supplierConverted);
            response.status(201).json({ message: "The address was successfully updated!", newAddress: updatedAddress });
        }
        catch (err) {
            response.status(500).json({ message: err.message });
        }
    }

    /**
     * Removes a new supplier address.
     * @param request The request body. Format:
     * {
     *   adminId: number,
     *   supplierId: number,
     *   addressId: number
     * }
     * @param response The response. Format
     *  {
     *    message: string
     *  }
     */
    @httpPost("/supplier/address/remove")
    public async removeSupplierAddress(request: Request, response: Response): Promise<void> {
        try {
            let removeSupplierAddressRequestBody: RemoveSupplierAddressRequestBody = request.body as RemoveSupplierAddressRequestBody;

            try {
                this.requestBodyValidationService.validateRemoveSupplierAddressRequestBody(removeSupplierAddressRequestBody);
            } catch (err) {
                response.status(400).json({ message: err.message })
                return;
            }

            if (removeSupplierAddressRequestBody.adminId !== Number(process.env.ADMIN_ID)) {
                response.status(403).json({ message: "Unauthorized!" });
                return;
            }


            await this.adminService.deleteSupplierAddress(removeSupplierAddressRequestBody.addressId, removeSupplierAddressRequestBody.supplierId);
            response.status(200).json({ message: `The address with ID ${removeSupplierAddressRequestBody.addressId} was successfully deleted!` });
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
     * @param response The response. Format
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
            await this.adminService.createCategory(category);
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
     * @param response The response. Format
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
            await this.adminService.updateCategory(categoryId, category);
            response.status(201).json({ message: `The category with ID ${categoryId} was successfully updated!` });
        }
        catch (err) {
            response.status(500).json({ message: err.message });
        }
    }

    /**
     * Deletes a category.
     * @param request The request body.
     * @param response The response. Format
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

            await this.adminService.deleteCategory(categoryId);
            response.status(201).json({ message: `The category with ID ${categoryId} was successfully deleted!` });
        }
        catch (err) {
            response.status(500).json({ message: err.message });
        }
    }
}