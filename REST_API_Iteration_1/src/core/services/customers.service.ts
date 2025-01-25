import { injectable } from 'inversify';
import 'reflect-metadata';
import { DataTypes, Sequelize } from "sequelize";
import { Customer } from '../../models/customer.model';
import { ShoppingCart } from '../../models/shopping.cart.model';
import { Address } from '../../models/address.model';
import { CustomerToAddress } from '../../models/customer.to.address.model';

/**
 * The customers service.
 */
@injectable()
export class CustomersService {
    public async connectToMssql(): Promise<Sequelize>{
        return new Promise<Sequelize>(function(resolve, reject){
            let sequelize = new Sequelize(
                String(process.env.MSSQL_DB),
                String(process.env.MSSQL_USER),
                String(process.env.MSSQL_PASSWORD),
                {
                  host: String(process.env.MSSQL_HOST),
                  dialect: "mssql",
                  ssl: false,
                  password: String(process.env.MSSQL_PASSWORD),
                  port: Number(process.env.MSSQL_PORT)
                }
              );

            sequelize.authenticate().then(() => {
                resolve(sequelize);
            }).catch((err) => {
                reject(err);
            })
        });
    }

    public async getNewCustomerId(): Promise<number>{
        let connection: Sequelize = null;

        try{
            connection = await this.intializeMSSQL();
            let id = await connection.models.Customer.max("CustomerId");
            connection.close();

            if (id == null){
                return 0;
            }

            connection.close();
            return Number(id) + 1;
        }
        catch (err){
            connection.close();
            throw err;
        }
    }

    public async getNewCustomerToAddressId(): Promise<number>{
        let connection: Sequelize = null;

        try{
            connection = await this.intializeMSSQL();
            let id = await connection.models.CustomerToAddress.max("CustomerToAddressId");
            connection.close();

            if (id == null){
                return 0;
            }

            connection.close();
            return Number(id) + 1;
        }
        catch (err){
            connection.close();
            throw err;
        }
    }

    public async getNewAddressId(): Promise<number>{
        let connection: Sequelize = null;

        try{
            connection = await this.intializeMSSQL();
            let id = await connection.models.Address.max("AddressId");
            connection.close();

            if (id == null){
                return 0;
            }

            connection.close();
            return Number(id) + 1;
        }
        catch (err){
            connection.close();
            throw err;
        }
    }

    public async getNewShoppingCartId(): Promise<number>{
        let connection: Sequelize = null;

        try{
            connection = await this.intializeMSSQL();
            let id = await connection.models.ShoppingCart.max("CartId");
            connection.close();

            if (id == null){
                return 0;
            }

            return Number(id) + 1;
        }
        catch (err){
            connection.close();
            throw err;
        }
    }

    public async doesUsernameExist(userName: string): Promise<boolean>{
        let connection: Sequelize = null;

        try{
            connection = await this.intializeMSSQL();
            let user = await connection.models.Customer.findOne({where: {userName: userName}});
            connection.close();
            return user !== null;
        }
        catch (err){
            connection.close();
            throw err;
        }
    }

    public async createNewCustomer(customer: Customer): Promise<Customer>{
        let connection: Sequelize = null;

        try{
            connection = await this.intializeMSSQL();

            let foundCustomer = await connection.models.Customer.findByPk(customer.customerId);

            if (foundCustomer !== null){
                connection.close();
                throw new Error(`Customer with ID ${customer.customerId} already exists!`);
            }

            let created = await connection.models.Customer.create(customer as any);
            let createdConverted = created.dataValues as Customer;
            connection.close();
            return createdConverted;
        }
        catch (err){
            connection.close();
            throw err;
        }    
    }

    public async updateExistingCustomer(customer: Customer, customerId: number): Promise<Customer>{
        let connection: Sequelize = null;

        try{
            if (customer.customerId !== customerId){
                throw new Error(`IDs ${customerId} and ${customer.customerId} do not match!`)
            }

            connection = await this.intializeMSSQL();

            let foundCustomer = await connection.models.Customer.findByPk(customer.customerId);

            if (foundCustomer == null){
                connection.close();
                throw new Error(`Customer with ID ${customer.customerId} does not exist!`);
            }

            await connection.models.Customer.update(customer, {where: {customerId: customerId}});
            connection.close();
            return customer;
        }
        catch (err){
            connection.close();
            throw err;
        }    
    }

    public async createNewShoppingCart(cart: ShoppingCart): Promise<ShoppingCart>{
        let connection: Sequelize = null;

        try{
            connection = await this.intializeMSSQL();

            let foundCart = await connection.models.ShoppingCart.findByPk(cart.cartId);

            if (foundCart !== null){
                connection.close();
                throw new Error(`Cart with ID ${cart.cartId} already exists!`);
            }

            let foundCustomer = await connection.models.Customer.findByPk(cart.customerId);

            if (foundCustomer == null){
                connection.close();
                throw new Error(`Customer with ID ${cart.customerId} does not exist!`);
            }

            let created = await connection.models.ShoppingCart.create(cart as any);
            let createdConverted = created.dataValues as ShoppingCart;
            connection.close();
            return createdConverted;
        }
        catch (err){
            connection.close();
            throw err;
        }  
    }

    public async createNewAddress(address: Address): Promise<Address>{
        let connection: Sequelize = null;

        try{
            connection = await this.intializeMSSQL();

            let foundAddressByPk = await connection.models.Address.findByPk(address.addressId);

            if (foundAddressByPk !== null){
                connection.close();
                throw new Error(`Address with ID ${address.addressId} already exists!`);
            }

            let whereClause = {street: address.street, city: address.city, postalCode: address.postalCode, country: address.country};
            let foundAddress = await connection.models.Address.findOne({where: whereClause});

            if (foundAddress !== null){
                connection.close();
                throw new Error(`Address with the given data already exists!`);
            }

            let created = await connection.models.Address.create(address as any);
            let createdConverted = created.dataValues as Address;
            connection.close();
            return createdConverted;
        }
        catch (err){
            connection.close();
            throw err;
        }  
    }

    public async createNewCustomerAddress(address: Address, customer: Customer): Promise<Address>{
        let connection: Sequelize = null;

        try{
            connection = await this.intializeMSSQL();
            let foundAddress = await connection.models.Address.findByPk(address.addressId);

            if (foundAddress !== null){
                connection.close();
                throw new Error(`Address with ID ${address.addressId} already exists!`);
            }

            let whereClause = {street: address.street, city: address.city, postalCode: address.postalCode, country: address.country};
            let existingAddress = await connection.models.Address.findOne({where: whereClause});

            if (existingAddress !== null){
                let createdReference = await this.createNewCustomerAddressReference(existingAddress.dataValues as Address, customer);
                return existingAddress.dataValues as Address;
            }

            let newAddress = await this.createNewAddress(address);
            let createdReference = await this.createNewCustomerAddressReference(newAddress, customer);
            let createdConverted  = newAddress;
            connection.close();
            return createdConverted;
        }
        catch (err){
            connection.close();
            throw err;
        }  
    }

    public async createNewCustomerAddressReference(address: Address, customer: Customer): Promise<CustomerToAddress>{
        let connection: Sequelize = null;

        try{
            connection = await this.intializeMSSQL();
            let whereClause = {customerId: customer.customerId, addressId: address.addressId};
            let foundAddress = await connection.models.CustomerToAddress.findOne({where: whereClause});

            if (foundAddress !== null){
                connection.close();
                throw new Error(`Customer address reference with address ID ${address.addressId} and customer ID ${customer.customerId} already exists!`);
            }


            let newId = await this.getNewCustomerToAddressId();
            let customerToAddress = {customerToAddressId: newId, addressId: address.addressId, customerId: customer.customerId} as CustomerToAddress;
            let created = await connection.models.CustomerToAddress.create(customerToAddress as any);
            let createdConverted = created.dataValues as CustomerToAddress;
            connection.close();
            return createdConverted;
        }
        catch (err){
            connection.close();
            throw err;
        }  
    }

    public async updateCustomerAddress(address: Address, customer: Customer): Promise<Address>{
        let connection: Sequelize = null;

        try{
            connection = await this.intializeMSSQL();
            await connection.models.CustomerToAddress.destroy({where: {addressId: address.addressId, customerId: customer.customerId}});
            let whereClause = {street: address.street, city: address.city, postalCode: address.postalCode, country: address.country};
            let existingAddress = await connection.models.Address.findOne({where: whereClause});
            let addressToReturn: Address = null;

            if (existingAddress !== null){
                let createdReference = await this.createNewCustomerAddressReference(existingAddress.dataValues as Address, customer);
                addressToReturn = existingAddress.dataValues as Address;
            } else{
                let newId = await this.getNewAddressId();
                let addressTocreate = {addressId: newId, street: address.street, city: address.city, postalCode: address.postalCode, country: address.country} as Address;
                let newAddress = await this.createNewAddress(addressTocreate);
                let createdReference = await this.createNewCustomerAddressReference(newAddress, customer);
                addressToReturn = newAddress;
            }

            // Delete old address if no existing references
            let foundCustomerReference = connection.models.CustomerToAddress.findOne({where: {addressId: address.addressId}});
            let foundVendorReference = connection.models.VendorToAddress.findOne({where: {addressId: address.addressId}});
            let foundSupplierReference = connection.models.SupplierToAddress.findOne({where: {addressId: address.addressId}});

            let foundCustomerResult = await foundCustomerReference;

            if (foundCustomerResult !== null){
                connection.close();
                return addressToReturn;
            }

            let foundVendorResult = await foundVendorReference;

            if (foundVendorResult !== null){
                connection.close();
                return addressToReturn;
            }

            let foundSupplierResult = await foundSupplierReference;

            if (foundSupplierResult !== null){
                connection.close();
                return addressToReturn;
            }

            await connection.models.Address.destroy({where: {addressId: address.addressId}});
            connection.close();
            return addressToReturn;
        }
        catch (err){
            connection.close();
            throw err;
        }  
    }

    public async deleteCustomerAddresses(addressIds: Array<number>, customerId: number): Promise<void>{
        try{
            for (let addressId of addressIds){
                await this.deleteCustomerAddress(addressId, customerId);
            }
        }
        catch (err){
            throw err;
        }  
    }

    public async deleteCustomerAddress(addressId: number, customerId: number): Promise<void>{
        let connection: Sequelize = null;

        try{
            connection = await this.intializeMSSQL();
            await connection.models.CustomerToAddress.destroy({where: {addressId: addressId, customerId: customerId}});

            // Delete old address if no existing references
            let foundCustomerReference = connection.models.CustomerToAddress.findOne({where: {addressId: addressId}});
            let foundVendorReference = connection.models.VendorToAddress.findOne({where: {addressId: addressId}});
            let foundSupplierReference = connection.models.SupplierToAddress.findOne({where: {addressId: addressId}});

            let foundCustomerResult = await foundCustomerReference;

            if (foundCustomerResult !== null){
                connection.close();
                return;
            }

            let foundVendorResult = await foundVendorReference;

            if (foundVendorResult !== null){
                connection.close();
                return;
            }

            let foundSupplierResult = await foundSupplierReference;

            if (foundSupplierResult !== null){
                connection.close();
                return;
            }

            await connection.models.Address.destroy({where: {addressId: addressId}});
            connection.close();
            return;
        }
        catch (err){
            connection.close();
            throw err;
        }  
    }


    public async intializeMSSQL(): Promise<Sequelize>{
        return new Promise<Sequelize>((resolve, reject) => {
            this.connectToMssql().then((sequelize) => {
                this.defineModels(sequelize).then((sequelize) => {
                    resolve(sequelize);
                })
                .catch((err) => {
                    reject(err);
                })
            }).catch((err) => {
                reject(err);
            })
        });
    }

    private async defineModels(sequelize: Sequelize): Promise<Sequelize>{
        return new Promise<Sequelize>((resolve, reject) => {
            sequelize.define("Customer",
                {
                    customerId: {
                        type: DataTypes.INTEGER,
                        allowNull: false,
                        primaryKey: true
                    },
                    userName: {
                        type: DataTypes.STRING,
                        allowNull: false
                    },
                    firstName: {
                        type: DataTypes.STRING,
                        allowNull: false
                    },
                    lastName: {
                        type: DataTypes.STRING,
                        allowNull: false
                    },
                    email: {
                        type: DataTypes.STRING,
                        allowNull: false
                    },
                    password: {
                        type: DataTypes.STRING,
                        allowNull: false
                    },
                    phoneNumber: {
                        type: DataTypes.STRING,
                        allowNull: false
                    }
                },
                {
                    tableName: "Customer",
                    modelName: "Customer",
                    createdAt: false,
                    updatedAt: false
                }
            );

            sequelize.define("Address",
                {
                    addressId: {
                        type: DataTypes.INTEGER,
                        allowNull: false,
                        primaryKey: true
                    },
                    street: {
                        type: DataTypes.STRING,
                        allowNull: false
                    },
                    city: {
                        type: DataTypes.STRING,
                        allowNull: false
                    },
                    postalCode: {
                        type: DataTypes.STRING,
                        allowNull: false
                    },
                    country: {
                        type: DataTypes.INTEGER,
                        allowNull: false
                    }
                },
                {
                    tableName: "Address",
                    modelName: "Address",
                    createdAt: false,
                    updatedAt: false
                }
            );

            sequelize.define("ShoppingCart",
                {
                    cartId: {
                        type: DataTypes.INTEGER,
                        allowNull: false,
                        primaryKey: true

                    },
                    customerId: {
                        type: DataTypes.INTEGER,
                        allowNull: false,
                    },
                    dateCreated:{
                        type: DataTypes.DATE,
                        allowNull: false
                    }
                },
                {
                    tableName: "ShoppingCart",
                    modelName: "ShoppingCart",
                    createdAt: false,
                    updatedAt: false
                }
            );

            sequelize.define("CustomerToAddress",
                {
                    customerToAddressId: {
                        type: DataTypes.INTEGER,
                        allowNull: false,
                        primaryKey: true

                    },
                    customerId: {
                        type: DataTypes.INTEGER,
                        allowNull: false,
                    },
                    addressId:{
                        type: DataTypes.INTEGER,
                        allowNull: false
                    }
                },
                {
                    tableName: "CustomerToAddress",
                    modelName: "CustomerToAddress",
                    createdAt: false,
                    updatedAt: false
                }
            );

            sequelize.define("VendorToAddress",
                {
                    vendorToAddressId: {
                        type: DataTypes.INTEGER,
                        allowNull: false,
                        primaryKey: true

                    },
                    vendorId: {
                        type: DataTypes.INTEGER,
                        allowNull: false,
                    },
                    addressId:{
                        type: DataTypes.INTEGER,
                        allowNull: false
                    }
                },
                {
                    tableName: "VendorToAddress",
                    modelName: "VendorToAddress",
                    createdAt: false,
                    updatedAt: false
                }
            );

            sequelize.define("SupplierToAddress",
                {
                    supplierToAddressId: {
                        type: DataTypes.INTEGER,
                        allowNull: false,
                        primaryKey: true

                    },
                    supplierId: {
                        type: DataTypes.INTEGER,
                        allowNull: false,
                    },
                    addressId:{
                        type: DataTypes.INTEGER,
                        allowNull: false
                    }
                },
                {
                    tableName: "SupplierToAddress",
                    modelName: "SupplierToAddress",
                    createdAt: false,
                    updatedAt: false
                }
            );

            sequelize.define("OrderPosition",
                {
                    orderPositionId: {
                        type: DataTypes.INTEGER,
                        allowNull: false,
                        primaryKey: true

                    },
                    orderId: {
                        type: DataTypes.INTEGER,
                        allowNull: false,
                    },
                    amount:{
                        type: DataTypes.INTEGER,
                        allowNull: true
                    },
                    vendorToProductId: {
                        type: DataTypes.INTEGER,
                        allowNull: false
                    },
                    supplierCompanyId: {
                        type: DataTypes.INTEGER,
                        allowNull: false
                    },
                    deliveryDate: {
                        type: DataTypes.DATE,
                        allowNull: false
                    },
                    deliveryAddressId: {
                        type: DataTypes.INTEGER,
                        allowNull: false
                    }
                },
                {
                    tableName: "OrderPosition",
                    modelName: "OrderPosition",
                    createdAt: false,
                    updatedAt: false
                }
            );

            sequelize.define("CustomerOrder",
                {
                    orderId: {
                        type: DataTypes.INTEGER,
                        allowNull: false,
                        primaryKey: true

                    },
                    orderName: {
                        type: DataTypes.STRING,
                        allowNull: true
                    },
                    orderDate:{
                        type: DataTypes.DATE,
                        allowNull: false
                    },
                    customerId: {
                        type: DataTypes.INTEGER,
                        allowNull: false
                    },
                    billingAddressId: {
                        type: DataTypes.INTEGER,
                        allowNull: false
                    },
                    isPaid: {
                        type: DataTypes.BOOLEAN,
                        allowNull: false
                    }
                },
                {
                    tableName: "CustomerOrder",
                    modelName: "CustomerOrder",
                    createdAt: false,
                    updatedAt: false
                }
            );

            resolve(sequelize);
        })
    }
}