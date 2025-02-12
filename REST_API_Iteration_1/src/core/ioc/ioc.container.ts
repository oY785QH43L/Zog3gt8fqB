import { Container } from 'inversify';
import { LoggerService } from '../services/logger.service';
import 'reflect-metadata';
import { interfaces, TYPE } from 'inversify-express-utils';
import { CustomersController } from '../../api/customers.controller';
import { CustomersService } from '../services/customers.service';
import { CustomersSessionService } from '../services/customers.sessions.service';
import { HashingService } from '../services/hashing.service';
import { RequestBodyValidationService } from '../services/request.body.validation.service';
import { RedisDatabaseService } from '../services/redis.database.service';
import { VendorsController } from '../../api/vendors.controller';
import { VendorsService } from '../services/vendors.service';
import { VendorsSessionService } from '../services/vendors.session.service';
import { AdminService } from '../services/admin.service';
import { AdminController } from '../../api/admin.controller';
import { MssqlDatabaseService } from '../services/mssql.database.service';
import { ProductsService } from '../services/products.service';
import { AddressService } from '../services/address.service';

/**
 * The IoC container.
 */
export class IoContainer {
    /**
     * The container variable.
     */
    private container = new Container();

    /**
     * Initializes the IoC container.
     */
    public init(): void {
        this.initServices();
        this.initControllers();
    }

    /**
     * Returns the IoC container.
     * @returns The IoC container.
     */
    public getContainer(): Container {
        return this.container;
    }

    /**
     * Initializes the controllers.
     */
    private initControllers(): void {
        this.container.bind<interfaces.Controller>(TYPE.Controller).to(CustomersController).whenTargetNamed(CustomersController.name);
        this.container.bind<interfaces.Controller>(TYPE.Controller).to(VendorsController).whenTargetNamed(VendorsController.name);
        this.container.bind<interfaces.Controller>(TYPE.Controller).to(AdminController).whenTargetNamed(AdminController.name);
    }

    /**
     * Initializes the services.
     */
    private initServices(): void {
        this.container.bind<LoggerService>(LoggerService.name).to(LoggerService).inSingletonScope();
        this.container.bind<ProductsService>(ProductsService.name).to(ProductsService).inSingletonScope();
        this.container.bind<AddressService>(AddressService.name).to(AddressService).inSingletonScope();
        this.container.bind<MssqlDatabaseService>(MssqlDatabaseService.name).to(MssqlDatabaseService).inSingletonScope();
        this.container.bind<CustomersService>(CustomersService.name).to(CustomersService).inSingletonScope();
        this.container.bind<VendorsService>(VendorsService.name).to(VendorsService).inSingletonScope();
        this.container.bind<AdminService>(AdminService.name).to(AdminService).inSingletonScope();
        this.container.bind<CustomersSessionService>(CustomersSessionService.name).to(CustomersSessionService).inSingletonScope();
        this.container.bind<VendorsSessionService>(VendorsSessionService.name).to(VendorsSessionService).inSingletonScope();
        this.container.bind<HashingService>(HashingService.name).to(HashingService).inSingletonScope();
        this.container.bind<RequestBodyValidationService>(RequestBodyValidationService.name).to(RequestBodyValidationService).inSingletonScope();
        this.container.bind<RedisDatabaseService>(RedisDatabaseService.name).to(RedisDatabaseService).inSingletonScope();
    }
}