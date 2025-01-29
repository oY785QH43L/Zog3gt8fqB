import { injectable } from 'inversify';
import 'reflect-metadata';
import { DataTypes, Sequelize } from 'sequelize';
import { Vendor } from '../../models/vendor.model';
import { Address } from '../../models/address.model';
import { VendorToAddress } from '../../models/vendor.to.address.model';


/**
 * The vendors service.
 */
@injectable()
export class VendorsService {
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

    public async getNewId(entityName: string, attributeName: string): Promise<Number>{
        let connection: Sequelize = await this.intializeMSSQL();

        try{
            let id = await connection.models[entityName].max(attributeName);
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

    public async doesUsernameExist(userName: string): Promise<boolean>{
        let connection: Sequelize = await this.intializeMSSQL();

        try{
            let user = await connection.models.Vendor.findOne({where: {userName: userName}});
            connection.close();
            return user !== null;
        }
        catch (err){
            connection.close();
            throw err;
        }
    }
    
    public async createNewAddress(address: Address): Promise<Address>{
        let connection: Sequelize = await this.intializeMSSQL();

        try{
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

    public async createNewVendor(vendor: Vendor): Promise<Vendor>{
        let connection: Sequelize = await this.intializeMSSQL();

        try{
            let foundVendor = await connection.models.Vendor.findByPk(vendor.vendorId);

            if (foundVendor !== null){
                connection.close();
                throw new Error(`Vendor with ID ${vendor.vendorId} already exists!`);
            }

            let created = await connection.models.Vendor.create(vendor as any);
            let createdConverted = created.dataValues as Vendor;
            connection.close();
            return createdConverted;
        }
        catch (err){
            connection.close();
            throw err;
        }    
    }

    public async createNewVendorAddress(address: Address, vendor: Vendor): Promise<Address>{
        let connection: Sequelize = await this.intializeMSSQL();

        try{
            let foundAddress = await connection.models.Address.findByPk(address.addressId);

            if (foundAddress !== null){
                connection.close();
                throw new Error(`Address with ID ${address.addressId} already exists!`);
            }

            let whereClause = {street: address.street, city: address.city, postalCode: address.postalCode, country: address.country};
            let existingAddress = await connection.models.Address.findOne({where: whereClause});

            if (existingAddress !== null){
                let createdReference = await this.createNewVendorAddressReference(existingAddress.dataValues as Address, vendor);
                return existingAddress.dataValues as Address;
            }

            let newAddress = await this.createNewAddress(address);
            let createdReference = await this.createNewVendorAddressReference(newAddress, vendor);
            let createdConverted  = newAddress;
            connection.close();
            return createdConverted;
        }
        catch (err){
            connection.close();
            throw err;
        }  
    }

    public async createNewVendorAddressReference(address: Address, vendor: Vendor): Promise<VendorToAddress>{
        let connection: Sequelize = await this.intializeMSSQL();

        try{
            let whereClause = {vendorId: vendor.vendorId, addressId: address.addressId};
            let foundAddress = await connection.models.VendorToAddress.findOne({where: whereClause});

            if (foundAddress !== null){
                connection.close();
                throw new Error(`Vendor address reference with address ID ${address.addressId} and vendor ID ${vendor.vendorId} already exists!`);
            }


            let newId = await this.getNewId("VendorToAddress", "VendorToAddressId");
            let vendorToAddress = {vendorToAddressId: newId, addressId: address.addressId, vendorId: vendor.vendorId} as VendorToAddress;
            let created = await connection.models.VendorToAddress.create(vendorToAddress as any);
            let createdConverted = created.dataValues as VendorToAddress;
            connection.close();
            return createdConverted;
        }
        catch (err){
            connection.close();
            throw err;
        }  
    }

    public async updateExistingVendor(vendor: Vendor, vendorId: number): Promise<Vendor>{
        let connection: Sequelize = await this.intializeMSSQL();

        try{
            if (vendor.vendorId !== vendorId){
                throw new Error(`IDs ${vendorId} and ${vendor.vendorId} do not match!`)
            }

            let foundVendor = await connection.models.Vendor.findByPk(vendor.vendorId);

            if (foundVendor == null){
                connection.close();
                throw new Error(`Vendor with ID ${vendor.vendorId} does not exist!`);
            }

            await connection.models.Vendor.update(vendor, {where: {vendorId: vendorId}});
            connection.close();
            return vendor;
        }
        catch (err){
            connection.close();
            throw err;
        }    
    }

    public async deleteVendorAddresses(addressIds: Array<number>, vendorId: number): Promise<void>{
        try{
            for (let addressId of addressIds){
                await this.deleteVendorAddress(addressId, vendorId);
            }
        }
        catch (err){
            throw err;
        }  
    }

    public async deleteVendorAddress(addressId: number, vendorId: number): Promise<void>{
        let connection: Sequelize = await this.intializeMSSQL();

        try{
            await connection.models.VendorToAddress.destroy({where: {addressId: addressId, vendorId: vendorId}});

            // Delete old address if no existing references
            let foundCustomerReference = connection.models.CustomerToAddress.findOne({where: {addressId: addressId}});
            let foundVendorReference = connection.models.VendorToAddress.findOne({where: {addressId: addressId}});
            let foundSupplierReference = connection.models.SupplierToAddress.findOne({where: {addressId: addressId}});
            let foundDeliveryReference = connection.models.OrderPosition.findOne({where: {deliveryAddressId: addressId}});
            let foundOrderReference = connection.models.CustomerOrder.findOne({where: {billingAddressId: addressId}});

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

            let foundDeliveryResult = await foundDeliveryReference;

            if (foundDeliveryResult !== null){
                connection.close();
                return;
            }

            let foundOrderResult = await foundOrderReference;

            if (foundOrderResult !== null){
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

    public async updateVendorAddress(address: Address, vendor: Vendor): Promise<Address>{
        let connection: Sequelize = await this.intializeMSSQL();

        try{
            await connection.models.VendorToAddress.destroy({where: {addressId: address.addressId, vendorId: vendor.vendorId}});
            let whereClause = {street: address.street, city: address.city, postalCode: address.postalCode, country: address.country};
            let existingAddress = await connection.models.Address.findOne({where: whereClause});
            let addressToReturn: Address = null;

            if (existingAddress !== null){
                let createdReference = await this.createNewVendorAddressReference(existingAddress.dataValues as Address, vendor);
                addressToReturn = existingAddress.dataValues as Address;
            } else{
                let newId = await this.getNewId("Address", "AddressId");
                let addressTocreate = {addressId: newId, street: address.street, city: address.city, postalCode: address.postalCode, country: address.country} as Address;
                let newAddress = await this.createNewAddress(addressTocreate);
                let createdReference = await this.createNewVendorAddressReference(newAddress, vendor);
                addressToReturn = newAddress;
            }

            // Delete old address if no existing references
            let foundCustomerReference = connection.models.CustomerToAddress.findOne({where: {addressId: address.addressId}});
            let foundVendorReference = connection.models.VendorToAddress.findOne({where: {addressId: address.addressId}});
            let foundSupplierReference = connection.models.SupplierToAddress.findOne({where: {addressId: address.addressId}});
            let foundDeliveryReference = connection.models.OrderPosition.findOne({where: {deliveryAddressId: address.addressId}});
            let foundOrderReference = connection.models.CustomerOrder.findOne({where: {billingAddressId: address.addressId}});

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

            let foundDeliveryResult = await foundDeliveryReference;

            if (foundDeliveryResult !== null){
                connection.close();
                return addressToReturn;
            }

            let foundOrderResult = await foundOrderReference;

            if (foundOrderResult !== null){
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
            sequelize.define("Vendor",
                {
                    vendorId: {
                        type: DataTypes.INTEGER,
                        allowNull: false,
                        primaryKey: true
                    },
                    userName: {
                        type: DataTypes.STRING,
                        allowNull: false
                    },
                    name: {
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
                    tableName: "Vendor",
                    modelName: "Vendor",
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