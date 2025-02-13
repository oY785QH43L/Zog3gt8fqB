import 'reflect-metadata';
import { inject, injectable } from 'inversify';
import { LoggerService } from "./logger.service";
import { MssqlDatabaseService } from "./mssql.database.service";
import { Neo4jDatabaseService } from "./neo4j.database.service";
import { Op, Sequelize } from 'sequelize';
import { Category } from '../../models/category.model';
import { Product as ProductNeo4j } from '../../models/neo4j.models/product.neo4j.model';
import { Category as CategoryNeo4j } from '../../models/neo4j.models/category.neo4j.model';

@injectable()
/**
 * The categories service.
 */
export class CategoriesService {
    /**
     * Initializes the categories service.
     * @param mssqlDatabaseService The MSSQL database service.  
     * @param neo4jDatabaseService The Neo4j database service. 
     * @param loggerService The logger service.
     */
    constructor(
        @inject(MssqlDatabaseService.name) private mssqlDatabaseService: MssqlDatabaseService,
        @inject(Neo4jDatabaseService.name) private neo4jDatabaseService: Neo4jDatabaseService,
        @inject(LoggerService.name) private loggerService: LoggerService
    ) { }

    /**
     * Creates a new category.
     * @param category The category to create.
     * @returns The created category.
     */
    public async createCategory(category: Category): Promise<Category> {
        let connection: Sequelize = await this.mssqlDatabaseService.initialize();
        let driver = await this.neo4jDatabaseService.initialize();
        let session = driver.session();

        try {
            // Check if the category exists in MSSQL
            let foundCategory = await connection.models.Category.findOne({ where: { categoryId: category.categoryId } });
            this.loggerService.logInfo(`Fetched Category with ID '${category.categoryId}'.`, "CategoriesService-MSSQL");

            if (foundCategory !== null) {
                await connection.close();
                await session.close();
                this.loggerService.logError(`Category with ID '${category.categoryId}' already exists.`, "CategoriesService");
                throw new Error(`Category with ID ${category.categoryId} already exists!`);
            }

            // Check if the category exists in Neo4j
            let response = await session.executeRead(tx => tx.run<CategoryNeo4j>(
                "MATCH (c:Category{CategoryId: $categoryId}) return c"
                , { categoryId: category.categoryId }));
            this.loggerService.logInfo(`Fetched Category with ID '${category.categoryId}'.`, "CategoriesService-Neo4j");

            if (response.records.length > 0) {
                await connection.close();
                await session.close();
                this.loggerService.logError(`Category with ID '${category.categoryId}' already exists.`, "CategoriesService");
                throw new Error(`Category with ID ${category.categoryId} already exist!`);
            }

            // Check if the category exists by name in MSSQL
            let foundCategoryByName = await connection.models.Category.findOne({ where: { name: category.name } });
            this.loggerService.logInfo(`Fetched Category with data ${JSON.stringify({ name: category.name })}.`, "CategoriesService-MSSQL");

            if (foundCategoryByName !== null) {
                await connection.close();
                await session.close();
                this.loggerService.logError(`Category with name '${category.name}' already exists.`, "CategoriesService");
                throw new Error(`Category with name '${category.name}' already exists!`);
            }

            // Check if the category exists by name in Neo4j
            let responseByName = await session.executeRead(tx => tx.run<CategoryNeo4j>(
                "MATCH (c:Category{Name: $name}) return c"
                , { name: category.name }));
            this.loggerService.logInfo(`Fetched Category with data ${JSON.stringify({ name: category.name })}.`, "CategoriesService-Neo4j");


            if (responseByName.records.length > 0) {
                await connection.close();
                await session.close();
                this.loggerService.logError(`Category with name '${category.name}' already exists.`, "CategoriesService");
                throw new Error(`Category with name '${category.name}' already exists!`);
            }

            // Create the category in MSSQL and Neo4j
            await connection.models.Category.create(category as any);
            await session.executeWrite(tx => tx.run("CREATE (c:Category{CategoryId: TOINTEGER($categoryId), Name: $name})", { categoryId: category.categoryId, name: category.name }));
            this.loggerService.logInfo(`Created Category with ID '${category.categoryId}'.`, "CategoriesService-Neo4j");
            await connection.close();
            await session.close();
            return category;
        }
        catch (err) {
            await connection.close();
            await session.close();
            throw err;
        }
    }

    /**
     * Updates a category.
     * @param categoryId The category ID.
     * @param categoryData The update category data.
     * @returns Updated category.
     */
    public async updateCategory(categoryId: number, categoryData: Category): Promise<Category> {
        let connection: Sequelize = await this.mssqlDatabaseService.initialize();
        let driver = await this.neo4jDatabaseService.initialize();
        let session = driver.session();

        try {
            if (categoryId != categoryData.categoryId) {
                await connection.close();
                await session.close();
                this.loggerService.logError("categoryId and categoryData.categoryId do not match.", "CategoriesService");
                throw new Error("categoryId and categoryData.categoryId do not match!");
            }

            // Check if the category exists in MSSQL
            let foundCategory = await connection.models.Category.findOne({ where: { categoryId: categoryId } });
            this.loggerService.logInfo(`Fetched Category with ID '${categoryId}'.`, "CategoriesService-MSSQL");

            if (foundCategory == null) {
                await connection.close();
                await session.close();
                this.loggerService.logError(`Category with ID '${categoryData.categoryId}' does not exist.`, "CategoriesService");
                throw new Error(`Category with ID ${categoryData.categoryId} does not exist!`);
            }

            // Check if the category exists in Neo4j
            let response = await session.executeRead(tx => tx.run<CategoryNeo4j>(
                "MATCH (c:Category{CategoryId: $categoryId}) return c"
                , { categoryId: categoryData.categoryId }));
            this.loggerService.logInfo(`Fetched Category with ID '${categoryId}'.`, "CategoriesService-Neo4j");

            if (response.records.length === 0) {
                await connection.close();
                await session.close();
                this.loggerService.logError(`Category with ID '${categoryData.categoryId}' does not exist.`, "CategoriesService");
                throw new Error(`Category with ID ${categoryData.categoryId} does not exist!`);
            }

            // Check if other category exists by name in MSSQL
            let foundCategoryByName = await connection.models.Category.findOne({ where: { name: categoryData.name, categoryId: { [Op.ne]: categoryId } } });
            this.loggerService.logInfo(`Fetched Category with data ${JSON.stringify({ name: categoryData.name, categoryId: { [Op.ne]: categoryId } })}.`, "CategoriesService-MSSQL");

            if (foundCategoryByName !== null) {
                await connection.close();
                await session.close();
                this.loggerService.logError(`Category with name '${categoryData.name}' already exists.`, "CategoriesService");
                throw new Error(`Category with name '${categoryData.name}' already exists!`);
            }

            // Check if other category exists by name in Neo4j
            let responseByName = await session.executeRead(tx => tx.run<CategoryNeo4j>(
                "MATCH (c:Category) WHERE c.Name = $name AND c.CategoryId <> $categoryId RETURN c"
                , { name: categoryData.name, categoryId: categoryId }));
            this.loggerService.logInfo(`Fetched Category with data ${JSON.stringify({ name: categoryData.name, categoryId: { [Op.ne]: categoryId } })}.`, "CategoriesService-Neo4j");

            if (responseByName.records.length > 0) {
                await connection.close();
                await session.close();
                this.loggerService.logError(`Category with name '${categoryData.name}' already exists.`, "CategoriesService");
                throw new Error(`Category with name '${categoryData.name}' already exists!`);
            }

            await connection.models.Category.update({ name: categoryData.name }, { where: { categoryId: categoryId } });
            await session.executeWrite(tx => tx.run<CategoryNeo4j>(
                "MATCH (c:Category{CategoryId: $categoryId}) SET c.Name = $name RETURN c"
                , { name: categoryData.name, categoryId: categoryId }));
            this.loggerService.logInfo(`Category with ID '${categoryId}' was updated.`, "CategoriesService-Neo4j");
            await connection.close();
            await session.close();
            return categoryData;
        }
        catch (err) {
            await connection.close();
            await session.close();
            throw err;
        }
    }

    /**
     * Deletes a category.
     * @param categoryId The category ID.
     */
    public async deleteCategory(categoryId: number): Promise<void> {
        let connection: Sequelize = await this.mssqlDatabaseService.initialize();
        let driver = await this.neo4jDatabaseService.initialize();
        let session = driver.session();

        try {
            // Check if the category is referenced
            let foundReferenceReponseQuery = "MATCH (p:Product)-[h:HAS_CATEGORY]->(c:Category{CategoryId: $categoryId}) RETURN p";
            let foundReferenceResponse = await session.executeRead(tx => tx.run<ProductNeo4j>(
                foundReferenceReponseQuery
                , { categoryId: categoryId }));
            this.loggerService.logInfo("Fetched data with query: " + foundReferenceReponseQuery + ".", "CategoriesService-Neo4j");

            if (foundReferenceResponse.records.length > 0) {
                await connection.close();
                await session.close();
                this.loggerService.logError(`Category with name ID '${categoryId}' is referenced and cannot be deleted.`, "CategoriesService");
                throw new Error(`Category with ID ${categoryId} is referenced and cannot be deleted!`);
            }

            // Delete the category
            await connection.models.Category.destroy({ where: { categoryId: categoryId } });
            this.loggerService.logInfo(`Deleted Category with ID '${categoryId}'.`, "CategoriesService-MSSQL");
            await session.executeWrite(tx => tx.run("MATCH (c:Category{CategoryId: $categoryId}) DELETE c", { categoryId: categoryId }));
            this.loggerService.logInfo(`Deleted Category with ID '${categoryId}'.`, "CategoriesService-Neo4j");
            await connection.close();
            await session.close();
        }
        catch (err) {
            await connection.close();
            await session.close();
            throw err;
        }
    }

    /**
     * Returns a boolean indicating whether the given category exists for the given product.
     * @param productId The product ID.
     * @param categoryId The catgory ID.
     * @returns Boolean indicating whether the given category exists for the given product.
     */
    public async doesCategoryExist(productId: number, categoryId: number): Promise<boolean> {
        let driver = await this.neo4jDatabaseService.initialize();
        let session = driver.session();

        try {

            // Check if reference exists
            let query = "MATCH (p:Product{ProductId: $productId})-[r:HAS_CATEGORY]->(c:Category{CategoryId: $categoryId}) return r";
            let productToCategory = await session.executeRead(tx => tx.run(
                query
                , { productId: productId, categoryId: categoryId }));
            this.loggerService.logInfo("Fetched data with query: " + query + ".", "CategoriesService-Neo4j");
            await session.close();
            return productToCategory.records.length > 0;
        }
        catch (err) {
            await session.close();
            throw err;
        }
    }
}