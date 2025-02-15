import { inject, injectable } from 'inversify';
import { MssqlDatabaseService } from './mssql.database.service';
import { Sequelize } from 'sequelize';
import { VendorToProduct } from '../../models/vendor.to.product.model';
import { Product } from '../../models/product.model';
import { Category } from '../../models/category.model';
import { ProductInformation } from '../../models/product.information.model';
import { LoggerService } from './logger.service';

@injectable()
/**
 * The products service.
 */
export class ProductsService {
    /**
     * Initializes the products service.
     * @param mssqlDatabaseService The MSSQL database service. 
     * @param loggerService The logger service.
     */
    constructor(
        @inject(MssqlDatabaseService.name) private mssqlDatabaseService: MssqlDatabaseService,
        @inject(LoggerService.name) private loggerService: LoggerService
    ) { }

    /**
     * Retrieves product information for the given ID.
     * @param vendorToProductId The vendor's product ID.
     * @returns The product information.
     */
    public async getVendorsProductInformation(vendorToProductId: number): Promise<ProductInformation> {
        let connection: Sequelize = await this.mssqlDatabaseService.initialize();

        try {
            let vendorToProductData = await connection.models.VendorToProduct.findOne({ where: { vendorToProductId: vendorToProductId } });
            this.loggerService.logInfo(`Fetched VendorToProduct with ID '${vendorToProductId}'.`, "ProductsService");


            if (vendorToProductData == null) {
                await connection.close();
                this.loggerService.logError(`Vendor's product with ID '${vendorToProductId}' does not exist.`, "ProductsService");
                throw new Error(`Vendor's product with ID '${vendorToProductId}' does not exist!`);
            }

            let vendorToProductDataConverted = vendorToProductData.dataValues as VendorToProduct;
            let productData = await connection.models.Product.findOne({ where: { productId: vendorToProductDataConverted.productId } });
            this.loggerService.logInfo(`Fetched Product with ID '${vendorToProductDataConverted.productId}'.`, "ProductsService");
            let productDataConverted = productData.dataValues as Product;
            let categories = await connection.query("select c.* from ProductToCategory pc " +
                "left outer join Category c " +
                "on pc.CategoryId = c.CategoryId " +
                `where pc.ProductId = ${productDataConverted.productId}`);
            this.loggerService.logInfo(`Fetched categories for Product with ID '${productDataConverted.productId}'.`, "ProductsService");
            let categoriesConverted: Category[] = categories[0].map(function(v) {
                return { categoryId: v["CategoryId"], name: v["Name"] } as Category;
            });
            let result = {
                productId: productDataConverted.productId, name: productDataConverted.name,
                description: productDataConverted.description, unitPriceEuro: vendorToProductDataConverted.unitPriceEuro,
                inventoryLevel: vendorToProductDataConverted.inventoryLevel, categories: categoriesConverted
            } as ProductInformation;
            return result;
        }
        catch (err) {
            await connection.close();
            throw err;
        }
    }

    /**
     * Retrieves products' information for the given vendor.
     * @param vendorId The vendor ID.
     * @returns Products' information for the given vendor.
     */
    public async getVendorProducts(vendorId: number): Promise<Array<ProductInformation>> {
        let connection: Sequelize = await this.mssqlDatabaseService.initialize();

        try {
            // Check if vendor references exists
            let foundVendorReference = await connection.models.VendorToProduct.findOne({ where: { vendorId: vendorId } });
            this.loggerService.logInfo(`Fetched VendorToProduct with data ${JSON.stringify({ vendorId: vendorId })}.`, "ProductsService");


            if (foundVendorReference == null) {
                await connection.close();
                return [];
            }

            let ids = await connection.models.VendorToProduct.findAll({ attributes: ["vendorToProductId"], where: { vendorId: vendorId } });
            this.loggerService.logInfo(`Fetched VendorToProduct with data ${JSON.stringify({ vendorId: vendorId })}.`, "ProductsService");
            let idValues = ids.map(function(v) {
                return Number(v.dataValues["vendorToProductId"]);
            });

            let result: ProductInformation[] = [];

            for (let vpId of idValues) {
                let r = await this.getVendorsProductInformation(vpId);
                result.push(r);
            }

            await connection.close();
            return result;
        }
        catch (err) {
            await connection.close();
            throw err;
        }
    }
}