import { injectable } from 'inversify';
import 'reflect-metadata';
import { DataTypes, Sequelize } from "sequelize";
import { Customer } from '../../models/customer.model';
import { ShoppingCart } from '../../models/shopping.cart.model';

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

    public async createNewCustomer(customer: Customer): Promise<Customer>{
        let connection: Sequelize = null;

        try{
            connection = await this.intializeMSSQL();
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

    public async createNewShoppingCart(cart: ShoppingCart): Promise<ShoppingCart>{
        let connection: Sequelize = null;

        try{
            connection = await this.intializeMSSQL();
            let created = await connection.models.ShoppingCart.create(cart as any);
            let createdConverted = created.dataValues as ShoppingCart;
            connection.close();
            return createdConverted;
        }
        catch (err){
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


            resolve(sequelize);
        })
    }
}