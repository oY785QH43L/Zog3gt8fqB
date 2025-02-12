import { inject, injectable } from 'inversify';
import { DataTypes, Sequelize } from 'sequelize';
import { LoggerService } from './logger.service';

@injectable()
/**
 * The MSSQL database service.
 */
export class MssqlDatabaseService {
    /**
     * Initializes the logger service.
     * @param loggerService The logger service.
     */
    constructor(@inject(LoggerService.name) private loggerService: LoggerService) { }

    /**
     * Initializes the MSSQL connection.
     * @returns The MSSQL connection.
     */
    public async initialize(): Promise<Sequelize> {
        return new Promise<Sequelize>((resolve, reject) => {
            this.connectToMssql().then((sequelize) => {
                this.loggerService.logInfo("Connected to MSSQL.", "MssqlDatabaseService");
                this.defineModels(sequelize).then((sequelize) => {
                    this.loggerService.logInfo("Defined ORM models.", "MssqlDatabaseService");
                    resolve(sequelize);
                })
                    .catch((err) => {
                        this.loggerService.logError(err, "MssqlDatabaseService");
                        reject(err);
                    })
            }).catch((err) => {
                reject(err);
            })
        });
    }

    /**
     * Connects to MSSQL.
     * @returns The connection.
     */
    public async connectToMssql(): Promise<Sequelize> {
        return new Promise<Sequelize>(function(resolve, reject) {
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

    /**
     * Defines ORM models in the MSSQL connection.
     * @param sequelize The MSSQL connection.
     * @returns The MSSQL connection.
     */
    private async defineModels(sequelize: Sequelize): Promise<Sequelize> {
        return new Promise<Sequelize>((resolve, reject) => {
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

            sequelize.define("ProductToCart",
                {
                    productToCartId: {
                        type: DataTypes.INTEGER,
                        allowNull: false,
                        primaryKey: true

                    },
                    vendorToProductId: {
                        type: DataTypes.INTEGER,
                        allowNull: false
                    },
                    cartId: {
                        type: DataTypes.INTEGER,
                        allowNull: false
                    },
                    amount: {
                        type: DataTypes.INTEGER,
                        allowNull: false
                    }
                },
                {
                    tableName: "ProductToCart",
                    modelName: "ProductToCart",
                    createdAt: false,
                    updatedAt: false
                }
            );

            sequelize.define("VendorToProduct",
                {
                    vendorToProductId: {
                        type: DataTypes.INTEGER,
                        allowNull: false,
                        primaryKey: true

                    },
                    vendorId: {
                        type: DataTypes.INTEGER,
                        allowNull: false
                    },
                    productId: {
                        type: DataTypes.INTEGER,
                        allowNull: false
                    },
                    unitPriceEuro: {
                        type: DataTypes.DECIMAL,
                        allowNull: false
                    },
                    inventoryLevel: {
                        type: DataTypes.INTEGER,
                        allowNull: false
                    }
                },
                {
                    tableName: "VendorToProduct",
                    modelName: "VendorToProduct",
                    createdAt: false,
                    updatedAt: false
                }
            );

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

            sequelize.define("Product",
                {
                    productId: {
                        type: DataTypes.INTEGER,
                        allowNull: false,
                        primaryKey: true

                    },
                    name: {
                        type: DataTypes.STRING,
                        allowNull: false
                    },
                    description: {
                        type: DataTypes.TEXT,
                        allowNull: false
                    }
                },
                {
                    tableName: "Product",
                    modelName: "Product",
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
                    addressId: {
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
                    addressId: {
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
                    addressId: {
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
                    amount: {
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
                    orderDate: {
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

            sequelize.define("Supplier",
                {
                    supplierId: {
                        type: DataTypes.INTEGER,
                        allowNull: false,
                        primaryKey: true

                    },
                    name: {
                        type: DataTypes.STRING,
                        allowNull: false
                    },
                    email: {
                        type: DataTypes.STRING,
                        allowNull: false
                    },
                    phoneNumber: {
                        type: DataTypes.STRING,
                        allowNull: false
                    }
                },
                {
                    tableName: "Supplier",
                    modelName: "Supplier",
                    createdAt: false,
                    updatedAt: false
                }
            );

            sequelize.define("ProductToCategory",
                {
                    productToCategoryId: {
                        type: DataTypes.INTEGER,
                        allowNull: false,
                        primaryKey: true

                    },
                    productId: {
                        type: DataTypes.INTEGER,
                        allowNull: false
                    },
                    categoryId: {
                        type: DataTypes.INTEGER,
                        allowNull: false
                    }
                },
                {
                    tableName: "ProductToCategory",
                    modelName: "ProductToCategory",
                    createdAt: false,
                    updatedAt: false
                }
            );

            sequelize.define("Category",
                {
                    categoryId: {
                        type: DataTypes.INTEGER,
                        allowNull: false,
                        primaryKey: true

                    },
                    name: {
                        type: DataTypes.STRING,
                        allowNull: false
                    }
                },
                {
                    tableName: "Category",
                    modelName: "Category",
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
                    dateCreated: {
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

            resolve(sequelize);
        });
    }

    /**
     * Generates a new ID for the given attribute in the given entity.
     * @param entityName The entity name.
     * @param attributeName The attribute name.
     * @returns New ID.
     */
    public async getNewId(entityName: string, attributeName: string): Promise<Number> {
        let connection: Sequelize = await this.initialize();

        try {
            let id = await connection.models[entityName].max(attributeName);
            await connection.close();

            if (id == null) {
                return 0;
            }

            await connection.close();
            return Number(id) + 1;
        }
        catch (err) {
            await connection.close();
            throw err;
        }
    }
}