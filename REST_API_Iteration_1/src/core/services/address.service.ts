import { inject, injectable } from 'inversify';
import { MssqlDatabaseService } from './mssql.database.service';
import { LoggerService } from './logger.service';
import { Address } from '../../models/address.model';
import { Sequelize } from 'sequelize';

@injectable()
/**
 * The address service.
 */
export class AddressService {
    /**
     * Initializes the address service.
     * @param mssqlDatabaseService  The MSSQL database service. 
     * @param loggerService The logger service.
     */
    constructor(@inject(MssqlDatabaseService.name) private mssqlDatabaseService: MssqlDatabaseService,
        @inject(LoggerService.name) private loggerService: LoggerService
    ) { }

    /**
     * Creates a new address in the database.
     * @param address The address to create.
     * @returns The address to create.
     */
    public async createNewAddress(address: Address): Promise<Address> {
        let connection: Sequelize = await this.mssqlDatabaseService.initialize();

        try {
            let foundAddressByPk = await connection.models.Address.findByPk(address.addressId);
            this.loggerService.logInfo(`Fetched Address with ID '${address.addressId}'.`, "AddressService");

            if (foundAddressByPk !== null) {
                await connection.close();
                this.loggerService.logError(`Address with ID '${address.addressId}' already exists.`, "AddressService");
                throw new Error(`Address with ID '${address.addressId}' already exists!`);
            }

            let whereClause = { street: address.street, city: address.city, postalCode: address.postalCode, country: address.country };
            let foundAddress = await connection.models.Address.findOne({ where: whereClause });
            this.loggerService.logInfo(`Fetched Address with data ${JSON.stringify(whereClause)}.`, "AddressService");

            if (foundAddress !== null) {
                await connection.close();
                this.loggerService.logError(`Address with data ${JSON.stringify(whereClause)} already exists.`, "AddressService");
                throw new Error(`Address with the given data already exists!`);
            }

            let created = await connection.models.Address.create(address as any);
            this.loggerService.logInfo(`Created Address with ID '${address.addressId}'.`, "AddressService");
            let createdConverted = created.dataValues as Address;
            await connection.close();
            return createdConverted;
        }
        catch (err) {
            await connection.close();
            throw err;
        }
    }
}