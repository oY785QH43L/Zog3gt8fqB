import { inject, injectable } from 'inversify';
import 'reflect-metadata';
import { Sequelize } from "sequelize";
import { Address } from '../../models/address.model';
import { Category } from '../../models/category.model';
import { Supplier } from '../../models/supplier.model';
import { SupplierToAddress } from '../../models/supplier.to.address.model';
import { Op } from 'sequelize';
import { MssqlDatabaseService } from './mssql.database.service';
import { LoggerService } from './logger.service';
import { AddressService } from './address.service';

@injectable()
/**
 * The admin service.
 */
export class AdminService {
    /**
     * Initializes the admin service.
     * @param mssqlDatabaseService The MSSQL database service. 
     * @param addressService The address service.
     * @param loggerService The logger service.
     */
    constructor(@inject(MssqlDatabaseService.name) private mssqlDatabaseService: MssqlDatabaseService,
        @inject(AddressService.name) private addressService: AddressService,
        @inject(LoggerService.name) private loggerService: LoggerService
    ) { }

    /**
     * Returns a boolean indicating whether the supplier exists by name.
     * @param name The supplier name.
     * @returns Boolean indicating whether the supplier exists by name.
     */
    public async doesNameExist(name: string): Promise<boolean> {
        let connection: Sequelize = await this.mssqlDatabaseService.initialize();

        try {
            let supplier = await connection.models.Supplier.findOne({ where: { name: name } });
            this.loggerService.logInfo(`Fetched Supplier with data ${JSON.stringify({ name: name })}.`, "AdminService");
            await connection.close();
            return supplier !== null;
        }
        catch (err) {
            await connection.close();
            throw err;
        }
    }

    /**
     * Creates a new supplier.
     * @param supplier The supplier to created.
     * @returns The created supplier.
     */
    public async createNewSupplier(supplier: Supplier): Promise<Supplier> {
        let connection: Sequelize = await this.mssqlDatabaseService.initialize();

        try {
            let foundSupplier = await connection.models.Supplier.findByPk(supplier.supplierId);
            this.loggerService.logInfo(`Fetched Supplier with ID '${supplier.supplierId}'.`, "AdminService");

            if (foundSupplier !== null) {
                await connection.close();
                this.loggerService.logError(`Supplier with ID '${supplier.supplierId}' already exists.`, "AdminService");
                throw new Error(`Supplier with ID '${supplier.supplierId}' already exists!`);
            }

            let created = await connection.models.Supplier.create(supplier as any);
            this.loggerService.logInfo(`Created Supplier with ID '${supplier.supplierId}'.`, "AdminService");
            let createdConverted = created.dataValues as Supplier;
            await connection.close();
            return createdConverted;
        }
        catch (err) {
            await connection.close();
            throw err;
        }
    }

    /**
     * Registers a new address for the given supplier.
     * @param address The address to create.
     * @param supplier The supplier.
     * @returns The registered address.
     */
    public async createNewSupplierAddress(address: Address, supplier: Supplier): Promise<Address> {
        let connection: Sequelize = await this.mssqlDatabaseService.initialize();

        try {
            let foundAddress = await connection.models.Address.findByPk(address.addressId);
            this.loggerService.logInfo(`Fetched Address with ID '${address.addressId}'.`, "AdminService");

            if (foundAddress !== null) {
                await connection.close();
                this.loggerService.logError(`Address with ID '${address.addressId}' already exists.`, "AdminService");
                throw new Error(`Address with ID '${address.addressId}' already exists!`);
            }

            let whereClause = { street: address.street, city: address.city, postalCode: address.postalCode, country: address.country };
            let existingAddress = await connection.models.Address.findOne({ where: whereClause });
            this.loggerService.logInfo(`Fetched Address with data ${JSON.stringify(whereClause)}.`, "AdminService");

            if (existingAddress !== null) {
                let createdReference = await this.createNewSupplierAddressReference(existingAddress.dataValues as Address, supplier);
                await connection.close();
                return existingAddress.dataValues as Address;
            }

            let newAddress = await this.addressService.createNewAddress(address);
            let createdReference = await this.createNewSupplierAddressReference(newAddress, supplier);
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
     * Registers a new address reference for the given supplier.
     * @param address The address reference to create.
     * @param supplier The supplier.
     * @returns The registered address reference.
     */
    public async createNewSupplierAddressReference(address: Address, supplier: Supplier): Promise<SupplierToAddress> {
        let connection: Sequelize = await this.mssqlDatabaseService.initialize();

        try {
            let whereClause = { supplierId: supplier.supplierId, addressId: address.addressId };
            let foundAddress = await connection.models.SupplierToAddress.findOne({ where: whereClause });
            this.loggerService.logInfo(`Fetched SupplierToAddress with data ${JSON.stringify(whereClause)}.`, "AdminService");

            if (foundAddress !== null) {
                await connection.close();
                this.loggerService.logError(`Supplier address reference with address ID '${address.addressId}' and supplier ID '${supplier.supplierId}' already exists.`, "AdminService");
                throw new Error(`Supplier address reference with address ID '${address.addressId}' and supplier ID '${supplier.supplierId}' already exists!`);
            }


            let newId = await this.mssqlDatabaseService.getNewId("SupplierToAddress", "SupplierToAddressId");
            let supplierToAddress = { supplierToAddressId: newId, addressId: address.addressId, supplierId: supplier.supplierId } as SupplierToAddress;
            let created = await connection.models.SupplierToAddress.create(supplierToAddress as any);
            this.loggerService.logInfo(`Created SupplierToAddress with ID '${newId}'.`, "AdminService");
            let createdConverted = created.dataValues as SupplierToAddress;
            await connection.close();
            return createdConverted;
        }
        catch (err) {
            await connection.close();
            throw err;
        }
    }

    /**
     * Updates an address for the given supplier.
     * @param address The address to create.
     * @param supplier The supplier.
     * @returns The updated address.
     */
    public async updateSupplierAddress(address: Address, supplier: Supplier): Promise<Address> {
        let connection: Sequelize = await this.mssqlDatabaseService.initialize();

        try {
            await connection.models.SupplierToAddress.destroy({ where: { addressId: address.addressId, supplierId: supplier.supplierId } });
            this.loggerService.logInfo(`Deleted SupplierToAddress with data ${JSON.stringify({ addressId: address.addressId, supplierId: supplier.supplierId })}.`, "AdminService");
            let whereClause = { street: address.street, city: address.city, postalCode: address.postalCode, country: address.country };
            let existingAddress = await connection.models.Address.findOne({ where: whereClause });
            this.loggerService.logInfo(`Fetched Address with data ${JSON.stringify(whereClause)}.`, "AdminService");
            let addressToReturn: Address = null;

            if (existingAddress !== null) {
                let createdReference = await this.createNewSupplierAddressReference(existingAddress.dataValues as Address, supplier);
                addressToReturn = existingAddress.dataValues as Address;
            } else {
                let newId = await this.mssqlDatabaseService.getNewId("Address", "AddressId");
                let addressTocreate = { addressId: newId, street: address.street, city: address.city, postalCode: address.postalCode, country: address.country } as Address;
                let newAddress = await this.addressService.createNewAddress(addressTocreate);
                let createdReference = await this.createNewSupplierAddressReference(newAddress, supplier);
                addressToReturn = newAddress;
            }

            // Delete old address if no existing references
            let foundCustomerReference = connection.models.CustomerToAddress.findOne({ where: { addressId: address.addressId } });
            this.loggerService.logInfo(`Fetched CustomerToAddress with data ${JSON.stringify({ addressId: address.addressId })}.`, "AdminService");
            let foundVendorReference = connection.models.VendorToAddress.findOne({ where: { addressId: address.addressId } });
            this.loggerService.logInfo(`Fetched VendorToAddress with data ${JSON.stringify({ addressId: address.addressId })}.`, "AdminService");
            let foundSupplierReference = connection.models.SupplierToAddress.findOne({ where: { addressId: address.addressId } });
            this.loggerService.logInfo(`Fetched SupplierToAddress with data ${JSON.stringify({ addressId: address.addressId })}.`, "AdminService");
            let foundDeliveryReference = connection.models.OrderPosition.findOne({ where: { deliveryAddressId: address.addressId } });
            this.loggerService.logInfo(`Fetched OrderPosition with data ${JSON.stringify({ deliveryAddressId: address.addressId })}.`, "AdminService");
            let foundOrderReference = connection.models.CustomerOrder.findOne({ where: { billingAddressId: address.addressId } });
            this.loggerService.logInfo(`Fetched CustomerOrder with data ${JSON.stringify({ billingAddressId: address.addressId })}.`, "AdminService");

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
            this.loggerService.logInfo(`Deleted Address with data ${JSON.stringify({ addressId: address.addressId })}.`, "AdminService");
            await connection.close();
            return addressToReturn;
        }
        catch (err) {
            await connection.close();
            throw err;
        }
    }

    /**
     * Updates the supplier under the given ID.
     * @param supplier The supplier data used to update.
     * @param supplierId The supplier ID.
     * @returns The updated supplier.
     */
    public async updateExistingSupplier(supplier: Supplier, supplierId: number): Promise<Supplier> {
        let connection: Sequelize = await this.mssqlDatabaseService.initialize();

        try {
            if (supplier.supplierId !== supplierId) {
                await connection.close();
                this.loggerService.logError(`IDs '${supplierId}' and '${supplier.supplierId}' do not match.`, "AdminService");
                throw new Error(`IDs '${supplierId}' and '${supplier.supplierId}' do not match!`)
            }

            let foundSupplier = await connection.models.Supplier.findByPk(supplier.supplierId);
            this.loggerService.logInfo(`Fetched Supplier with ID '${supplierId}'.`, "AdminService");

            if (foundSupplier == null) {
                await connection.close();
                this.loggerService.logError(`Supplier with ID '${supplier.supplierId}' does not exist.`, "AdminService");
                throw new Error(`Supplier with ID '${supplier.supplierId}' does not exist!`);
            }

            await connection.models.Supplier.update(supplier, { where: { supplierId: supplierId } });
            this.loggerService.logInfo(`Supplier with ID '${supplierId}' was updated.`, "AdminService");
            await connection.close();
            return supplier;
        }
        catch (err) {
            await connection.close();
            throw err;
        }
    }

    /**
     * Removes the addresses from the supplier.
     * @param addressIds The address IDs.
     * @param supplierId The supplier ID.
     */
    public async deleteSupplierAddresses(addressIds: Array<number>, supplierId: number): Promise<void> {
        try {
            for (let addressId of addressIds) {
                await this.deleteSupplierAddress(addressId, supplierId);
            }
        }
        catch (err) {
            throw err;
        }
    }

    /**
     * Deletes the given address from the given supplier.
     * @param addressId The address ID.
     * @param supplierId The supplier ID.
     */
    public async deleteSupplierAddress(addressId: number, supplierId: number): Promise<void> {
        let connection: Sequelize = await this.mssqlDatabaseService.initialize();

        try {
            await connection.models.SupplierToAddress.destroy({ where: { addressId: addressId, supplierId: supplierId } });
            this.loggerService.logInfo(`Deleted SupplierToAddress with data ${JSON.stringify({ addressId: addressId, supplierId: supplierId })}.`, "AdminService");


            // Delete old address if no existing references
            let foundCustomerReference = connection.models.CustomerToAddress.findOne({ where: { addressId: addressId } });
            this.loggerService.logInfo(`Fetched CustomerToAddress with data ${JSON.stringify({ addressId: addressId })}.`, "AdminService");
            let foundVendorReference = connection.models.VendorToAddress.findOne({ where: { addressId: addressId } });
            this.loggerService.logInfo(`Fetched VendorToAddress with data ${JSON.stringify({ addressId: addressId })}.`, "AdminService");
            let foundSupplierReference = connection.models.SupplierToAddress.findOne({ where: { addressId: addressId } });
            this.loggerService.logInfo(`Fetched SupplierToAddress with data ${JSON.stringify({ addressId: addressId })}.`, "AdminService");
            let foundDeliveryReference = connection.models.OrderPosition.findOne({ where: { deliveryAddressId: addressId } });
            this.loggerService.logInfo(`Fetched OrderPosition with data ${JSON.stringify({ addressId: addressId })}.`, "AdminService");
            let foundOrderReference = connection.models.CustomerOrder.findOne({ where: { billingAddressId: addressId } });
            this.loggerService.logInfo(`Fetched CustomerOrder with data ${JSON.stringify({ addressId: addressId })}.`, "AdminService");

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
            this.loggerService.logInfo(`Deleted Address with data ${JSON.stringify({ addressId: addressId })}.`, "AdminService");
            await connection.close();
        }
        catch (err) {
            await connection.close();
            throw err;
        }
    }

    /**
     * Creates a new category.
     * @param category The category to create.
     * @returns The created category.
     */
    public async createCategory(category: Category): Promise<Category> {
        let connection: Sequelize = await this.mssqlDatabaseService.initialize();

        try {
            let foundCategory = await connection.models.Category.findOne({ where: { categoryId: category.categoryId } });
            this.loggerService.logInfo(`Fetched Category with ID '${category.categoryId}'.`, "AdminService");

            if (foundCategory !== null) {
                await connection.close();
                this.loggerService.logError(`Category with ID '${category.categoryId}' already exists.`, "AdminService");
                throw new Error(`Category with ID '${category.categoryId}' already exists!`);
            }

            let foundCategoryByName = await connection.models.Category.findOne({ where: { name: category.name } });
            this.loggerService.logInfo(`Fetched Category with data ${JSON.stringify({ name: category.name })}.`, "AdminService");

            if (foundCategoryByName !== null) {
                await connection.close();
                this.loggerService.logError(`Category with name '${category.name}' already exists.`, "AdminService");
                throw new Error(`Category with name '${category.name}' already exists!`);
            }

            await connection.models.Category.create(category as any);
            this.loggerService.logInfo(`Created Category with ID '${category.categoryId}'.`, "AdminService");
            await connection.close();
            return category;
        }
        catch (err) {
            await connection.close();
            throw err;
        }
    }

    /**
     * Updates the category under the given ID.
     * @param categoryId The category ID.
     * @param categoryData The update data.
     * @returns The updated category.
     */
    public async updateCategory(categoryId: number, categoryData: Category): Promise<Category> {
        let connection: Sequelize = await this.mssqlDatabaseService.initialize();

        try {
            if (categoryId != categoryData.categoryId) {
                await connection.close();
                this.loggerService.logError("categoryId and categoryData.categoryId do not match.", "AdminService");
                throw new Error("categoryId and categoryData.categoryId do not match!");
            }

            let foundCategory = await connection.models.Category.findOne({ where: { categoryId: categoryId } });
            this.loggerService.logInfo(`Fetched Category with ID '${categoryId}'.`, "AdminService");

            if (foundCategory == null) {
                await connection.close();
                this.loggerService.logError(`Category with ID '${categoryData.categoryId}' does not exist.`, "AdminService");
                throw new Error(`Category with ID '${categoryData.categoryId}' does not exist!`);
            }

            let foundCategoryByName = await connection.models.Category.findOne({ where: { name: categoryData.name, categoryId: { [Op.ne]: categoryId } } });
            this.loggerService.logInfo(`Fetched Category with data ${JSON.stringify({ name: categoryData.name, categoryId: { [Op.ne]: categoryId } })}.`, "AdminService");

            if (foundCategoryByName !== null) {
                await connection.close();
                this.loggerService.logError(`Category with name '${categoryData.name}' already exists.`, "AdminService");
                throw new Error(`Category with name '${categoryData.name}' already exists!`);
            }

            await connection.models.Category.update({ name: categoryData.name }, { where: { categoryId: categoryId } });
            this.loggerService.logInfo(`Category with ID '${categoryId}' was updated.`, "AdminService");
            await connection.close();
            return categoryData;
        }
        catch (err) {
            await connection.close();
            throw err;
        }
    }

    /**
     * Deletes a category.
     * @param categoryId The category ID.
     */
    public async deleteCategory(categoryId: number): Promise<void> {
        let connection: Sequelize = await this.mssqlDatabaseService.initialize();

        try {
            let foundCategory = await connection.models.Category.findOne({ where: { categoryId: categoryId } });
            this.loggerService.logInfo(`Fetched Category with ID '${categoryId}'.`, "AdminService");

            if (foundCategory == null) {
                await connection.close();
                this.loggerService.logError(`Category with ID '${categoryId}' does not exist.`, "AdminService");
                throw new Error(`Category with ID '${categoryId}' does not exist!`);
            }

            let foundCategoryByReference = await connection.models.ProductToCategory.findOne({ where: { categoryId: categoryId } });
            this.loggerService.logInfo(`Fetched ProductToCategory with ID '${categoryId}'.`, "AdminService");

            if (foundCategoryByReference !== null) {
                await connection.close();
                this.loggerService.logError(`Category with name ID '${categoryId}' is referenced and cannot be deleted.`, "AdminService");
                throw new Error(`Category with name ID '${categoryId}' is referenced and cannot be deleted!`);
            }

            await connection.models.Category.destroy({ where: { categoryId: categoryId } });
            this.loggerService.logInfo(`Deleted Category with ID '${categoryId}'.`, "AdminService");
            await connection.close();
        }
        catch (err) {
            await connection.close();
            throw err;
        }
    }
}