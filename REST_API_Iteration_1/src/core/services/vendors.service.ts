import { inject, injectable } from 'inversify';
import 'reflect-metadata';
import { Op, Sequelize } from 'sequelize';
import { Vendor } from '../../models/vendor.model';
import { Address } from '../../models/address.model';
import { VendorToAddress } from '../../models/vendor.to.address.model';
import { ProductInformation } from '../../models/product.information.model';
import { Product } from '../../models/product.model';
import { VendorToProduct } from '../../models/vendor.to.product.model';
import { ProductToCategory } from '../../models/product.to.category.model';
import { MssqlDatabaseService } from './mssql.database.service';
import { ProductsService } from './products.service';
import { AddressService } from './address.service';
import { LoggerService } from './logger.service';


@injectable()
/**
 * The vendors service.
 */
export class VendorsService {
    /**
     * Initializes the vendors service.
     * @param mssqlDatabaseService The MSSQL database service. 
     * @param addressService The address service.
     * @param productsService The products service.
     * @param loggerService The logger service.
     */
    constructor(@inject(MssqlDatabaseService.name) private mssqlDatabaseService: MssqlDatabaseService,
        @inject(AddressService.name) private addressService: AddressService,
        @inject(ProductsService.name) private productsService: ProductsService,
        @inject(LoggerService.name) private loggerService: LoggerService
    ) { }

    /**
     * Returns a boolean indicating whether the vendor exists by username.
     * @param userName The username.
     * @returns Boolean indicating whether the vendor exists by username.
     */
    public async doesUsernameExist(userName: string): Promise<boolean> {
        let connection: Sequelize = await this.mssqlDatabaseService.initialize();

        try {
            let user = await connection.models.Vendor.findOne({ where: { userName: userName } });
            this.loggerService.logInfo(`Fetched Vendor with data ${JSON.stringify({ userName: userName })}.`, "VendorsService");
            await connection.close();
            return user !== null;
        }
        catch (err) {
            await connection.close();
            throw err;
        }
    }

    /**
     * Creates a new vendor.
     * @param vendor The vendor to create.
     * @returns The created vendor.
     */
    public async createNewVendor(vendor: Vendor): Promise<Vendor> {
        let connection: Sequelize = await this.mssqlDatabaseService.initialize();

        try {
            let foundVendor = await connection.models.Vendor.findByPk(vendor.vendorId);
            this.loggerService.logInfo(`Fetched Vendor with ID '${vendor.vendorId}'.`, "VendorsService");

            if (foundVendor !== null) {
                await connection.close();
                this.loggerService.logError(`Vendor with ID '${vendor.vendorId}' already exists.`, "VendorsService");
                throw new Error(`Vendor with ID '${vendor.vendorId}' already exists!`);
            }

            let created = await connection.models.Vendor.create(vendor as any);
            this.loggerService.logInfo(`Created Vendor with ID '${vendor.vendorId}'.`, "VendorsService");
            let createdConverted = created.dataValues as Vendor;
            await connection.close();
            return createdConverted;
        }
        catch (err) {
            await connection.close();
            throw err;
        }
    }

    /**
     * Registers a new address for the given vendor.
     * @param address The address to register.
     * @param vendor The vendor.
     * @returns The registered address.
     */
    public async createNewVendorAddress(address: Address, vendor: Vendor): Promise<Address> {
        let connection: Sequelize = await this.mssqlDatabaseService.initialize();

        try {
            let foundAddress = await connection.models.Address.findByPk(address.addressId);
            this.loggerService.logInfo(`Fetched Address with ID '${address.addressId}'.`, "VendorsService");


            if (foundAddress !== null) {
                await connection.close();
                this.loggerService.logError(`Address with ID '${address.addressId}' already exists.`, "VendorsService");
                throw new Error(`Address with ID ${address.addressId} already exists!`);
            }

            let whereClause = { street: address.street, city: address.city, postalCode: address.postalCode, country: address.country };
            let existingAddress = await connection.models.Address.findOne({ where: whereClause });
            this.loggerService.logInfo(`Fetched Address with data ${JSON.stringify(whereClause)}.`, "VendorsService");


            if (existingAddress !== null) {
                await connection.close();
                let createdReference = await this.createNewVendorAddressReference(existingAddress.dataValues as Address, vendor);
                return existingAddress.dataValues as Address;
            }

            let newAddress = await this.addressService.createNewAddress(address);
            let createdReference = await this.createNewVendorAddressReference(newAddress, vendor);
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
     * Creates an address reference to the given vendor.
     * @param address The address to reference.
     * @param vendor The vendor.
     * @returns The created address reference.
     */
    public async createNewVendorAddressReference(address: Address, vendor: Vendor): Promise<VendorToAddress> {
        let connection: Sequelize = await this.mssqlDatabaseService.initialize();

        try {
            let whereClause = { vendorId: vendor.vendorId, addressId: address.addressId };
            let foundAddress = await connection.models.VendorToAddress.findOne({ where: whereClause });
            this.loggerService.logInfo(`Fetched VendorToAddress with data ${JSON.stringify(whereClause)}.`, "VendorsService");


            if (foundAddress !== null) {
                await connection.close();
                this.loggerService.logError(`Vendor address reference with address ID '${address.addressId}' and customer ID '${vendor.vendorId}' already exists.`, "VendorsService");
                throw new Error(`Vendor address reference with address ID '${address.addressId}' and vendor ID '${vendor.vendorId}' already exists!`);
            }


            let newId = await this.mssqlDatabaseService.getNewId("VendorToAddress", "VendorToAddressId");
            let vendorToAddress = { vendorToAddressId: newId, addressId: address.addressId, vendorId: vendor.vendorId } as VendorToAddress;
            let created = await connection.models.VendorToAddress.create(vendorToAddress as any);
            this.loggerService.logInfo(`Created VendorToAddress with ID '${newId}'.`, "VendorsService");
            let createdConverted = created.dataValues as VendorToAddress;
            await connection.close();
            return createdConverted;
        }
        catch (err) {
            await connection.close();
            throw err;
        }
    }

    /**
     * Updates an existing vendor.
     * @param vendor The vendor update data.
     * @param vendorId The vendor ID.
     * @returns The updated vendor.
     */
    public async updateExistingVendor(vendor: Vendor, vendorId: number): Promise<Vendor> {
        let connection: Sequelize = await this.mssqlDatabaseService.initialize();

        try {
            if (vendor.vendorId !== vendorId) {
                await connection.close();
                this.loggerService.logError(`IDs '${vendorId}' and '${vendor.vendorId}' do not match.`, "VendorsService");

                throw new Error(`IDs '${vendorId}' and '${vendor.vendorId}' do not match!`)
            }

            let foundVendor = await connection.models.Vendor.findByPk(vendor.vendorId);
            this.loggerService.logInfo(`Fetched Vendor with ID '${vendor.vendorId}'.`, "VendorsService");

            if (foundVendor == null) {
                await connection.close();
                this.loggerService.logError(`Vendor with ID '${vendor.vendorId}' does not exist.`, "VendorsService");

                throw new Error(`Vendor with ID '${vendor.vendorId}' does not exist!`);
            }

            await connection.models.Vendor.update(vendor, { where: { vendorId: vendorId } });
            this.loggerService.logInfo(`Vendor with ID '${vendorId}' was updated.`, "VendorsService");
            await connection.close();
            return vendor;
        }
        catch (err) {
            await connection.close();
            throw err;
        }
    }

    /**
     * Deletes the addresses for the given vendor.
     * @param addressIds The address IDs.
     * @param vendorId The vendor ID.
     */
    public async deleteVendorAddresses(addressIds: Array<number>, vendorId: number): Promise<void> {
        try {
            for (let addressId of addressIds) {
                await this.deleteVendorAddress(addressId, vendorId);
            }
        }
        catch (err) {
            throw err;
        }
    }

    /**
     * Retrieves the addresses for the given vendor.
     * @param vendorId The vendor ID.
     * @returns The vendor addresses.
     */
    public async getVendorAddresses(vendorId: number): Promise<Address[]> {
        let connection = await this.mssqlDatabaseService.initialize();
        let data = await connection.query("select a.* from Vendor v left outer join VendorToAddress va " +
            "on v.VendorId = va.VendorId " +
            "left outer join Address a " +
            "on va.AddressId = a.AddressId " +
            `where v.VendorId = ${vendorId}`);
        this.loggerService.logInfo(`Fetched address for vendor with ID '${vendorId}'.`, "VendorsService");
        await connection.close();
        let addresses: Address[] = data[0].map(function(information) {
            let a = {
                addressId: information["AddressId"], street: information["Street"],
                city: information["City"], postalCode: information["PostalCode"],
                country: information["Country"]
            } as Address;
            return a;
        });
        return addresses;
    }

    /**
     * Deletes the given address for the given vendor.
     * @param addressId The address ID.
     * @param vendorId The vendor ID.
     */
    public async deleteVendorAddress(addressId: number, vendorId: number): Promise<void> {
        let connection: Sequelize = await this.mssqlDatabaseService.initialize();

        try {
            await connection.models.VendorToAddress.destroy({ where: { addressId: addressId, vendorId: vendorId } });
            this.loggerService.logInfo(`Deleted VendorToAddress with data ${JSON.stringify({ addressId: addressId, vendorId: vendorId })}.`, "VendorsService");


            // Delete old address if no existing references
            let foundCustomerReference = connection.models.CustomerToAddress.findOne({ where: { addressId: addressId } });
            this.loggerService.logInfo(`Fetched CustomerToAddress with data ${JSON.stringify({ addressId: addressId })}.`, "VendorsService");
            let foundVendorReference = connection.models.VendorToAddress.findOne({ where: { addressId: addressId } });
            this.loggerService.logInfo(`Fetched VendorToAddress with data ${JSON.stringify({ addressId: addressId })}.`, "VendorsService");
            let foundSupplierReference = connection.models.SupplierToAddress.findOne({ where: { addressId: addressId } });
            this.loggerService.logInfo(`Fetched SupplierToAddress with data ${JSON.stringify({ addressId: addressId })}.`, "VendorsService");
            let foundDeliveryReference = connection.models.OrderPosition.findOne({ where: { deliveryAddressId: addressId } });
            this.loggerService.logInfo(`Fetched OrderPosition with data ${JSON.stringify({ deliveryAddressId: addressId })}.`, "VendorsService");
            let foundOrderReference = connection.models.CustomerOrder.findOne({ where: { billingAddressId: addressId } });
            this.loggerService.logInfo(`Fetched CustomerOrder with data ${JSON.stringify({ billingAddressId: addressId })}.`, "VendorsService");

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
            this.loggerService.logInfo(`Deleted Address with data ${JSON.stringify({ addressId: addressId })}.`, "VendorsService");
            await connection.close();
            return;
        }
        catch (err) {
            await connection.close();
            throw err;
        }
    }

    /**
     * Updates an address for the given vendor.
     * @param address The address.
     * @param vendor The vendor.
     * @returns The updated address.
     */
    public async updateVendorAddress(address: Address, vendor: Vendor): Promise<Address> {
        let connection: Sequelize = await this.mssqlDatabaseService.initialize();

        try {
            await connection.models.VendorToAddress.destroy({ where: { addressId: address.addressId, vendorId: vendor.vendorId } });
            this.loggerService.logInfo(`Deleted VendorToAddress with data ${JSON.stringify({ addressId: address.addressId, vendorId: vendor.vendorId })}.`, "VendorsService");

            let whereClause = { street: address.street, city: address.city, postalCode: address.postalCode, country: address.country };
            let existingAddress = await connection.models.Address.findOne({ where: whereClause });
            this.loggerService.logInfo(`Fetched Address with data ${JSON.stringify(whereClause)}.`, "VendorsService");

            let addressToReturn: Address = null;

            if (existingAddress !== null) {
                let createdReference = await this.createNewVendorAddressReference(existingAddress.dataValues as Address, vendor);
                addressToReturn = existingAddress.dataValues as Address;
            } else {
                let newId = await this.mssqlDatabaseService.getNewId("Address", "AddressId");
                let addressTocreate = { addressId: newId, street: address.street, city: address.city, postalCode: address.postalCode, country: address.country } as Address;
                let newAddress = await this.addressService.createNewAddress(addressTocreate);
                let createdReference = await this.createNewVendorAddressReference(newAddress, vendor);
                addressToReturn = newAddress;
            }

            // Delete old address if no existing references
            let foundCustomerReference = connection.models.CustomerToAddress.findOne({ where: { addressId: address.addressId } });
            this.loggerService.logInfo(`Fetched CustomerToAddress with data ${JSON.stringify({ addressId: address.addressId })}.`, "VendorsService");
            let foundVendorReference = connection.models.VendorToAddress.findOne({ where: { addressId: address.addressId } });
            this.loggerService.logInfo(`Fetched VendorToAddress with data ${JSON.stringify({ addressId: address.addressId })}.`, "VendorsService");
            let foundSupplierReference = connection.models.SupplierToAddress.findOne({ where: { addressId: address.addressId } });
            this.loggerService.logInfo(`Fetched SupplierToAddress with data ${JSON.stringify({ addressId: address.addressId })}.`, "VendorsService");
            let foundDeliveryReference = connection.models.OrderPosition.findOne({ where: { deliveryAddressId: address.addressId } });
            this.loggerService.logInfo(`Fetched OrderPosition with data ${JSON.stringify({ deliveryAddressId: address.addressId })}.`, "VendorsService");
            let foundOrderReference = connection.models.CustomerOrder.findOne({ where: { billingAddressId: address.addressId } });
            this.loggerService.logInfo(`Fetched CustomerOrder with data ${JSON.stringify({ billingAddressId: address.addressId })}.`, "VendorsService");

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
            this.loggerService.logInfo(`Deleted Address with data ${JSON.stringify({ addressId: address.addressId })}.`, "VendorsService");
            await connection.close();
            return addressToReturn;
        }
        catch (err) {
            await connection.close();
            throw err;
        }
    }

    /**
     * Creates a global category references to the given product if they do not already exist.
     * @param productId The product ID.
     * @param categoryIds The category IDs.
     */
    public async createProductCategoryReferencesIfNotExist(productId: number, categoryIds: number[]): Promise<void> {
        for (let id of categoryIds) {
            await this.createProductCategoryReferenceIfNotExist(productId, id);
        }
    }

    /**
     * Creates a global category reference to the given product if it does not already exist.
     * @param productId The product ID.
     * @param categoryId The category ID.
     */
    public async createProductCategoryReferenceIfNotExist(productId: number, categoryId: number): Promise<void> {
        let connection: Sequelize = await this.mssqlDatabaseService.initialize();

        try {
            // Check if the category exists
            let category = await connection.models.Category.findByPk(categoryId);
            this.loggerService.logInfo(`Fetched Category with ID '${categoryId}'.`, "VendorsService");


            if (category == null) {
                await connection.close();
                this.loggerService.logError(`Category under ID '${categoryId}' does not exist.`, "VendorsService");
                throw new Error(`Category under ID '${categoryId}' does not exist!`);
            }

            // Check if the product exists
            let product = await connection.models.Product.findByPk(productId);
            this.loggerService.logInfo(`Fetched Product with ID '${productId}'.`, "VendorsService");

            if (product == null) {
                await connection.close();
                this.loggerService.logError(`Product under ID '${productId}' does not exist.`, "VendorsService");
                throw new Error(`Product under ID '${productId}' does not exist!`);
            }

            // Check if reference exists
            let productToCategory = await connection.models.ProductToCategory.findOne({ where: { productId: productId, categoryId: categoryId } });
            this.loggerService.logInfo(`Fetched ProductToCategory with data ${JSON.stringify({ productId: productId, categoryId: categoryId })}.`, "VendorsService");


            if (productToCategory == null) {
                let newId = await this.mssqlDatabaseService.getNewId("ProductToCategory", "ProductToCategoryId");
                let pcRef = { productToCategoryId: newId, productId: productId, categoryId: categoryId } as ProductToCategory;
                this.loggerService.logInfo(`Created ProductToCategory with ID '${newId}'.`, "VendorsService");
                await connection.models.ProductToCategory.create(pcRef as any);
            }

            await connection.close();
        }
        catch (err) {
            await connection.close();
            throw err;
        }
    }

    /**
     * Creates a new vendor product.
     * @param vendorId The vendor ID.
     * @param productInformation The product information.
     * @returns The created vendor product.
     */
    public async createNewVendorProduct(vendorId: number, productInformation: ProductInformation): Promise<ProductInformation> {
        let connection: Sequelize = await this.mssqlDatabaseService.initialize();

        try {
            // Check if vendor exists
            let foundVendor = await connection.models.Vendor.findByPk(vendorId);
            this.loggerService.logInfo(`Fetched Vendor with ID '${vendorId}'.`, "VendorsService");

            if (foundVendor == null) {
                await connection.close();
                this.loggerService.logError(`Vendor with ID '${vendorId}' does not exist.`, "VendorsService");
                throw new Error(`Vendor with ID '${vendorId}' does not exist!`);
            }

            // Check for already own existing product
            let vendorProducts = await this.productsService.getVendorProducts(vendorId);
            let existingProduct = vendorProducts.find((p) => p.name == productInformation.name);

            if (existingProduct !== undefined) {
                this.loggerService.logError(`Vendor with ID '${vendorId}' already owns the product with name '${productInformation.name}'.`, "VendorsService");
                throw new Error(`Vendor with ID '${vendorId}' already owns the product with name '${productInformation.name}'!`);
            }

            // Check if other vendor owns the product with the same name
            let otherVendorsProducts = await connection.query("select p.* from VendorToProduct vp " +
                "left outer join Product p " +
                "on vp.ProductId = p.ProductId " +
                `where vp.VendorId != ${vendorId} and p.Name = '${productInformation.name}'`);
            this.loggerService.logInfo(`Fetched products for VendorId != '${vendorId}' and Name == '${productInformation.name}'`, "VendorsService");
            let otherVendorsProductsConverted: Product[] = otherVendorsProducts[0].map(function(v) {
                return { productId: v["ProductId"], name: v["Name"], description: v["Description"] } as Product;
            });

            let productId = 0;

            if (otherVendorsProductsConverted.length == 0) {
                let newProduct = { productId: productInformation.productId, name: productInformation.name, description: productInformation.description } as Product;
                await connection.models.Product.create(newProduct as any);
                this.loggerService.logInfo(`Created Product widh ID '${productInformation.productId}'.`, "VendorsService");
                let newVendorToProductId = await this.mssqlDatabaseService.getNewId("VendorToProduct", "VendorToProductId");
                let productReference = { vendorToProductId: newVendorToProductId, vendorId: vendorId, productId: productInformation.productId, unitPriceEuro: productInformation.unitPriceEuro, inventoryLevel: productInformation.inventoryLevel } as VendorToProduct;
                await connection.models.VendorToProduct.create(productReference as any);
                this.loggerService.logInfo(`Created VendorToProduct widh ID '${newVendorToProductId}'.`, "VendorsService");
                productId = newProduct.productId;
            } else {
                let newVendorToProductId = await this.mssqlDatabaseService.getNewId("VendorToProduct", "VendorToProductId");
                let productReference = { vendorToProductId: newVendorToProductId, vendorId: vendorId, productId: otherVendorsProductsConverted[0].productId, unitPriceEuro: productInformation.unitPriceEuro, inventoryLevel: productInformation.inventoryLevel } as VendorToProduct;
                await connection.models.VendorToProduct.create(productReference as any);
                this.loggerService.logInfo(`Created VendorToProduct widh ID '${newVendorToProductId}'.`, "VendorsService");
                productId = otherVendorsProductsConverted[0].productId;
            }

            if (productInformation.categories.length == 0) {
                await connection.close();
                return productInformation;
            }

            let catIds = productInformation.categories.map(function(c) {
                return c.categoryId;
            });

            await connection.close();
            await this.createProductCategoryReferencesIfNotExist(productId, catIds);
            return productInformation;
        }
        catch (err) {
            await connection.close();
            throw err;
        }
    }

    /**
     * Updates the product for the given vendor.
     * @param vendorId The vendor ID.
     * @param vendorToProductId The vendor's product ID.
     * @param informationToUpdate The update information.
     * @returns The updated product information.
     */
    public async updateVendorProduct(vendorId: number, vendorToProductId: number, informationToUpdate: ProductInformation): Promise<ProductInformation> {
        let connection: Sequelize = await this.mssqlDatabaseService.initialize();

        try {
            // Check if vendor exists
            let foundVendor = await connection.models.Vendor.findByPk(vendorId);
            this.loggerService.logInfo(`Fetched Vendor with ID '${vendorId}'.`, "VendorsService");


            if (foundVendor == null) {
                await connection.close();
                this.loggerService.logError(`Vendor with ID '${vendorId}' does not exist.`, "VendorsService");
                throw new Error(`Vendor with ID '${vendorId}' does not exist!`);
            }

            // Check if product belongs to vendor
            let foundVendorReference = await connection.models.VendorToProduct.findOne({ where: { vendorId: vendorId, vendorToProductId: vendorToProductId } });
            this.loggerService.logInfo(`Fetched VendorToProduct with data ${JSON.stringify({ vendorId: vendorId, vendorToProductId: vendorToProductId })}.`, "VendorsService");


            if (foundVendorReference == null) {
                await connection.close();
                this.loggerService.logError(`Vendor with ID '${vendorId}' does not have a product with vendor's product ID '${vendorToProductId}'.`, "VendorsService");
                throw new Error(`Vendor with ID '${vendorId}' does not have a product with vendor's product ID '${vendorToProductId}'!`);
            }

            let referenceConverted = foundVendorReference.dataValues as VendorToProduct;

            // Check if the product is already referenced by some customers
            let orderPositionReference = await connection.models.OrderPosition.findOne({ where: { vendorToProductId: vendorToProductId } });
            this.loggerService.logInfo(`Fetched OrderPosition with data ${JSON.stringify({ vendorToProductId: vendorToProductId })}.`, "VendorsService");
            let shoppingCartReference = await connection.models.ProductToCart.findOne({ where: { vendorToProductId: vendorToProductId } });
            this.loggerService.logInfo(`Fetched ProductToCart with data ${JSON.stringify({ vendorToProductId: vendorToProductId })}.`, "VendorsService");


            if (orderPositionReference !== null) {
                await connection.close();
                this.loggerService.logError(`The product information about inventory and unit price for vendor's product ID '${vendorToProductId}' cannot be updated because it is referenced by another order position.`, "VendorsService");
                throw new Error(`The product information about inventory and unit price for vendor's product ID '${vendorToProductId}' cannot be updated because it is referenced by another order position!`);
            }

            if (shoppingCartReference !== null) {
                await connection.close();
                this.loggerService.logError(`The product information about inventory and unit price for vendor's product ID '${vendorToProductId}' cannot be updated because it is referenced by an item in a shopping cart.`, "VendorsService");
                throw new Error(`The product information about inventory and unit price for vendor's product ID '${vendorToProductId}' cannot be updated because it is referenced by an item in a shopping cart!`);
            }

            // Check if the product already exists
            let otherExistingProduct = await connection.models.Product.findOne({
                where: {
                    name: informationToUpdate.name, description: {
                        [Op.like]: informationToUpdate.description
                    }
                }
            });
            this.loggerService.logInfo(`Fetched Product with data ${JSON.stringify({
                name: informationToUpdate.name, description: {
                    [Op.like]: informationToUpdate.description
                }
            })}.`, "VendorsService");

            if (otherExistingProduct !== null) {
                let otherProductConverted = otherExistingProduct.dataValues as Product;
                let updateData = { productId: otherProductConverted.productId, unitPriceEuro: informationToUpdate.unitPriceEuro, inventoryLevel: informationToUpdate.inventoryLevel };
                await connection.models.VendorToProduct.update(updateData, { where: { vendorToProductId: vendorToProductId } })
                this.loggerService.logInfo(`VendorToProduct with ID '${vendorToProductId}' was updated.`, "VendorsService");
            } else {
                let newProductId = await this.mssqlDatabaseService.getNewId("Product", "ProductId");
                let productData = { productId: newProductId, name: informationToUpdate.name, description: informationToUpdate.description } as Product;
                await connection.models.Product.create(productData as any);
                this.loggerService.logInfo(`Created Product with ID '${newProductId}'.`, "VendorsService");
                let updateData = { productId: newProductId, unitPriceEuro: informationToUpdate.unitPriceEuro, inventoryLevel: informationToUpdate.inventoryLevel };
                await connection.models.VendorToProduct.update(updateData, { where: { vendorToProductId: vendorToProductId } })
                this.loggerService.logInfo(`VendorToProduct with ID '${vendorToProductId}' was updated.`, "VendorsService");
            }

            // Remove the old product if it is no longer referenced
            let otherProductReference = await connection.models.VendorToProduct.findOne({ where: { productId: referenceConverted.productId } });
            this.loggerService.logInfo(`Fetched VendorToProduct with data ${JSON.stringify({ productId: referenceConverted.productId })}`, "VendorsService");


            if (otherProductReference == null) {
                await connection.models.ProductToCategory.destroy({ where: { productId: referenceConverted.productId } });
                this.loggerService.logInfo(`Deleted ProductToCategory with data ${JSON.stringify({ productId: referenceConverted.productId })}.`, "VendorsService");
                await connection.models.Product.destroy({ where: { productId: referenceConverted.productId } });
                this.loggerService.logInfo(`Deleted Product with data ${JSON.stringify({ productId: referenceConverted.productId })}.`, "VendorsService");
            }

            await connection.close();
            return informationToUpdate;
        }
        catch (err) {
            await connection.close();
            throw err;
        }
    }

    /**
     * Removes the vendor's products.
     * @param vendorToProductIds The vendor's product IDs.
     */
    public async removeVedorToProducts(vendorToProductIds: Array<number>): Promise<void> {
        for (let vpId of vendorToProductIds) {
            await this.removeVendorProduct(vpId);
        }
    }

    /**
     * Removes the vendor's product.
     * @param vendorToProductId The vendor's product ID.
     */
    public async removeVendorProduct(vendorToProductId: number): Promise<void> {
        let connection: Sequelize = await this.mssqlDatabaseService.initialize();

        try {
            let productReference = await connection.models.VendorToProduct.findOne({ where: { vendorToProductId: vendorToProductId } });
            this.loggerService.logInfo(`Fetched VendorToProduct with ID '${vendorToProductId}'.`, "VendorsService");


            // Remove product if it is not referenced
            if (productReference == null) {
                await connection.close();
                this.loggerService.logError(`Product with vendor's product ID '${vendorToProductId}' does not exist.`, "VendorsService");
                throw new Error(`Product with vendor's product ID ${vendorToProductId} does not exist!`);
            }

            let referenceConverted = productReference.dataValues as VendorToProduct;

            // Remove items from product to cart
            await connection.models.ProductToCart.destroy({ where: { vendorToProductId: vendorToProductId } });
            this.loggerService.logInfo(`Deleted ProductToCart with data ${JSON.stringify({ vendorToProductId: vendorToProductId })}.`, "VendorsService");

            // Remove items from order position
            await connection.models.OrderPosition.destroy({ where: { vendorToProductId: vendorToProductId } });
            this.loggerService.logInfo(`Deleted OrderPosition with data ${JSON.stringify({ vendorToProductId: vendorToProductId })}.`, "VendorsService");

            // Remove the product reference
            await connection.models.VendorToProduct.destroy({ where: { vendorToProductId: vendorToProductId } });
            this.loggerService.logInfo(`Deleted VendorToProduct with data ${JSON.stringify({ vendorToProductId: vendorToProductId })}.`, "VendorsService");
            let otherReference = await connection.models.VendorToProduct.findOne({ where: { productId: referenceConverted.productId } });
            this.loggerService.logInfo(`Fetched VendorToProduct with data ${JSON.stringify({ productId: referenceConverted.productId })}.`, "VendorsService");


            if (otherReference == null) {
                await connection.models.ProductToCategory.destroy({ where: { productId: referenceConverted.productId } });
                this.loggerService.logInfo(`Deleted ProductToCategory with data ${JSON.stringify({ productId: referenceConverted.productId })}.`, "VendorsService");
                await connection.models.Product.destroy({ where: { productId: referenceConverted.productId } });
                this.loggerService.logInfo(`Deleted Product with data ${JSON.stringify({ productId: referenceConverted.productId })}.`, "VendorsService");
            }
        }
        catch (err) {
            await connection.close();
            throw err;
        }
    }
}