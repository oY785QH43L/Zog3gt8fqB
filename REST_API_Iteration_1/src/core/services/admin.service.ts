import { inject, injectable } from 'inversify';
import 'reflect-metadata';
import { Sequelize } from "sequelize";
import { Address } from '../../models/address.model';
import { Category } from '../../models/category.model';
import { Courier } from '../../models/courier.model';
import { CourierToAddress } from '../../models/courier.to.address.model';
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
    constructor(
        @inject(MssqlDatabaseService.name) private mssqlDatabaseService: MssqlDatabaseService,
        @inject(AddressService.name) private addressService: AddressService,
        @inject(LoggerService.name) private loggerService: LoggerService
    ) { }

    /**
     * Returns a boolean indicating whether the courier exists by name.
     * @param name The courier name.
     * @returns Boolean indicating whether the courier exists by name.
     */
    public async doesNameExist(name: string): Promise<boolean> {
        let connection: Sequelize = await this.mssqlDatabaseService.initialize();

        try {
            let courier = await connection.models.Courier.findOne({ where: { name: name } });
            this.loggerService.logInfo(`Fetched Courier with data ${JSON.stringify({ name: name })}.`, "AdminService");
            await connection.close();
            return courier !== null;
        }
        catch (err) {
            await connection.close();
            throw err;
        }
    }

    /**
     * Creates a new courier.
     * @param courier The courier to created.
     * @returns The created courier.
     */
    public async createNewCourier(courier: Courier): Promise<Courier> {
        let connection: Sequelize = await this.mssqlDatabaseService.initialize();

        try {
            let foundCourier = await connection.models.Courier.findByPk(courier.courierId);
            this.loggerService.logInfo(`Fetched Courier with ID '${courier.courierId}'.`, "AdminService");

            if (foundCourier !== null) {
                await connection.close();
                this.loggerService.logError(`Courier with ID '${courier.courierId}' already exists.`, "AdminService");
                throw new Error(`Courier with ID '${courier.courierId}' already exists!`);
            }

            let created = await connection.models.Courier.create(courier as any);
            this.loggerService.logInfo(`Created Courier with ID '${courier.courierId}'.`, "AdminService");
            let createdConverted = created.dataValues as Courier;
            await connection.close();
            return createdConverted;
        }
        catch (err) {
            await connection.close();
            throw err;
        }
    }

    /**
     * Registers a new address for the given courier.
     * @param address The address to create.
     * @param courier The courier.
     * @returns The registered address.
     */
    public async createNewCourierAddress(address: Address, courier: Courier): Promise<Address> {
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
                let createdReference = await this.createNewCourierAddressReference(existingAddress.dataValues as Address, courier);
                await connection.close();
                return existingAddress.dataValues as Address;
            }

            let newAddress = await this.addressService.createNewAddress(address);
            let createdReference = await this.createNewCourierAddressReference(newAddress, courier);
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
     * Registers a new address reference for the given courier.
     * @param address The address reference to create.
     * @param courier The courier.
     * @returns The registered address reference.
     */
    public async createNewCourierAddressReference(address: Address, courier: Courier): Promise<CourierToAddress> {
        let connection: Sequelize = await this.mssqlDatabaseService.initialize();

        try {
            let whereClause = { courierId: courier.courierId, addressId: address.addressId };
            let foundAddress = await connection.models.CourierToAddress.findOne({ where: whereClause });
            this.loggerService.logInfo(`Fetched CourierToAddress with data ${JSON.stringify(whereClause)}.`, "AdminService");

            if (foundAddress !== null) {
                await connection.close();
                this.loggerService.logError(`Courier address reference with address ID '${address.addressId}' and courier ID '${courier.courierId}' already exists.`, "AdminService");
                throw new Error(`Courier address reference with address ID '${address.addressId}' and courier ID '${courier.courierId}' already exists!`);
            }


            let newId = await this.mssqlDatabaseService.getNewId("CourierToAddress", "CourierToAddressId");
            let courierToAddress = { courierToAddressId: newId, addressId: address.addressId, courierId: courier.courierId } as CourierToAddress;
            let created = await connection.models.CourierToAddress.create(courierToAddress as any);
            this.loggerService.logInfo(`Created CourierToAddress with ID '${newId}'.`, "AdminService");
            let createdConverted = created.dataValues as CourierToAddress;
            await connection.close();
            return createdConverted;
        }
        catch (err) {
            await connection.close();
            throw err;
        }
    }

    /**
     * Updates an address for the given courier.
     * @param address The address to create.
     * @param courier The courier.
     * @returns The updated address.
     */
    public async updateCourierAddress(address: Address, courier: Courier): Promise<Address> {
        let connection: Sequelize = await this.mssqlDatabaseService.initialize();

        try {
            await connection.models.CourierToAddress.destroy({ where: { addressId: address.addressId, courierId: courier.courierId } });
            this.loggerService.logInfo(`Deleted CourierToAddress with data ${JSON.stringify({ addressId: address.addressId, courierId: courier.courierId })}.`, "AdminService");
            let whereClause = { street: address.street, city: address.city, postalCode: address.postalCode, country: address.country };
            let existingAddress = await connection.models.Address.findOne({ where: whereClause });
            this.loggerService.logInfo(`Fetched Address with data ${JSON.stringify(whereClause)}.`, "AdminService");
            let addressToReturn: Address = null;

            if (existingAddress !== null) {
                let createdReference = await this.createNewCourierAddressReference(existingAddress.dataValues as Address, courier);
                addressToReturn = existingAddress.dataValues as Address;
            } else {
                let newId = await this.mssqlDatabaseService.getNewId("Address", "AddressId");
                let addressTocreate = { addressId: newId, street: address.street, city: address.city, postalCode: address.postalCode, country: address.country } as Address;
                let newAddress = await this.addressService.createNewAddress(addressTocreate);
                let createdReference = await this.createNewCourierAddressReference(newAddress, courier);
                addressToReturn = newAddress;
            }

            // Delete old address if no existing references
            let foundCustomerReference = connection.models.CustomerToAddress.findOne({ where: { addressId: address.addressId } });
            this.loggerService.logInfo(`Fetched CustomerToAddress with data ${JSON.stringify({ addressId: address.addressId })}.`, "AdminService");
            let foundVendorReference = connection.models.VendorToAddress.findOne({ where: { addressId: address.addressId } });
            this.loggerService.logInfo(`Fetched VendorToAddress with data ${JSON.stringify({ addressId: address.addressId })}.`, "AdminService");
            let foundCourierReference = connection.models.CourierToAddress.findOne({ where: { addressId: address.addressId } });
            this.loggerService.logInfo(`Fetched CourierToAddress with data ${JSON.stringify({ addressId: address.addressId })}.`, "AdminService");
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

            let foundCourierResult = await foundCourierReference;

            if (foundCourierResult !== null) {
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
     * Updates the courier under the given ID.
     * @param courier The courier data used to update.
     * @param courierId The courier ID.
     * @returns The updated courier.
     */
    public async updateExistingCourier(courier: Courier, courierId: number): Promise<Courier> {
        let connection: Sequelize = await this.mssqlDatabaseService.initialize();

        try {
            if (courier.courierId !== courierId) {
                await connection.close();
                this.loggerService.logError(`IDs '${courierId}' and '${courier.courierId}' do not match.`, "AdminService");
                throw new Error(`IDs '${courierId}' and '${courier.courierId}' do not match!`)
            }

            let foundCourier = await connection.models.Courier.findByPk(courier.courierId);
            this.loggerService.logInfo(`Fetched Courier with ID '${courierId}'.`, "AdminService");

            if (foundCourier == null) {
                await connection.close();
                this.loggerService.logError(`Courier with ID '${courier.courierId}' does not exist.`, "AdminService");
                throw new Error(`Courier with ID '${courier.courierId}' does not exist!`);
            }

            await connection.models.Courier.update(courier, { where: { courierId: courierId } });
            this.loggerService.logInfo(`Courier with ID '${courierId}' was updated.`, "AdminService");
            await connection.close();
            return courier;
        }
        catch (err) {
            await connection.close();
            throw err;
        }
    }

    /**
     * Removes the addresses from the courier.
     * @param addressIds The address IDs.
     * @param courierId The courier ID.
     */
    public async deleteCourierAddresses(addressIds: Array<number>, courierId: number): Promise<void> {
        try {
            for (let addressId of addressIds) {
                await this.deleteCourierAddress(addressId, courierId);
            }
        }
        catch (err) {
            throw err;
        }
    }

    /**
     * Deletes the given address from the given courier.
     * @param addressId The address ID.
     * @param courierId The courier ID.
     */
    public async deleteCourierAddress(addressId: number, courierId: number): Promise<void> {
        let connection: Sequelize = await this.mssqlDatabaseService.initialize();

        try {
            await connection.models.CourierToAddress.destroy({ where: { addressId: addressId, courierId: courierId } });
            this.loggerService.logInfo(`Deleted CourierToAddress with data ${JSON.stringify({ addressId: addressId, courierId: courierId })}.`, "AdminService");


            // Delete old address if no existing references
            let foundCustomerReference = connection.models.CustomerToAddress.findOne({ where: { addressId: addressId } });
            this.loggerService.logInfo(`Fetched CustomerToAddress with data ${JSON.stringify({ addressId: addressId })}.`, "AdminService");
            let foundVendorReference = connection.models.VendorToAddress.findOne({ where: { addressId: addressId } });
            this.loggerService.logInfo(`Fetched VendorToAddress with data ${JSON.stringify({ addressId: addressId })}.`, "AdminService");
            let foundCourierReference = connection.models.CourierToAddress.findOne({ where: { addressId: addressId } });
            this.loggerService.logInfo(`Fetched CourierToAddress with data ${JSON.stringify({ addressId: addressId })}.`, "AdminService");
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

            let foundCourierResult = await foundCourierReference;

            if (foundCourierResult !== null) {
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