# Import necessary packages
import pyodbc
import pymongo
from datetime import datetime
from neo4j import GraphDatabase, Neo4jDriver


# Helper functions
def log(message: str):
    """Logs the message.
    Args:
        message (str): The message.
    Raises:
        TypeError: Is thrown if message is not a str.
    """
    if type(message) != str:
        raise TypeError("message must be a str!")

    current_time =datetime.today().strftime("%Y-%m-%d %H:%M:%S")
    print(current_time + " " + message)


def create_dict(parameters, vals):
    """Creates a dictionary from parameters
    and values. E.g. ["a", "b"], [1,2]
    -> {"a": 1, "b": 2}
    Args:
        parameters (list): Parameters.
        vals (list): Values.
    Raises:
        ValueError: Is thrown if parameters and
        values do not have an equal length.
    Returns:
        dict: The result dictionary.
    """
    if len(parameters) != len(vals):
        raise ValueError("parameters must have the same length as vals!")

    return dict(zip(parameters, vals))


def commit(connection, log_message=None):
    """Commis the connection.
    Args:
        connection (_type_): The connection
        log_message (_type_, optional):
        Optional log message. Defaults to None.
    """
    if connection is None:
        return
    connection.commit()

    if log_message is not None:
        log(log_message)


def close(connection, log_message=None):
    """Closes the connection.
    Args:
        connection (_type_): The connection
        log_message (_type_, optional):
        Optional log message. Defaults to None.
    """
    if connection is None:
        return
    connection.close()

    if log_message is not None:
        log(log_message)


def rollback(connection, log_message=None):
    """Rollbacks the connection.
    Args:
        connection (_type_): The connection
        log_message (_type_, optional):
        Optional log message. Defaults to None.
    """
    if connection is None:
        return
    connection.rollback()

    if log_message is not None:
        log(log_message)


def run_query(tx, query):
    """Runs a Neo4j query.
    Args:
        tx (_type_): A Neo4j transaction.
        query (str): The query.
    """
    tx.run(query)


def convert_to_neo4j_datatype(val):
    """Converts a random
    database type of the value to a Neo4j type.
    Args:
        val (_type_): The value.
    Returns:
        _type_: The converted value.
    """
    if type(val) == str:
        return f'"{val}"'

    if type(val) == datetime:
        return f'"{val}"'

    return val


def create_mongodb_collection(
    mongo_client: pymongo.MongoClient, db_name, collection_name
):
    """_Creates a MongoDB collection
    Args:
        mongo_client (pymongo.MongoClient): Mongo client.
        db_name (str): DB name.
        collection_name (str): Collection name.
    """
    db = mongo_client[db_name]
    collist = db.list_collection_names()

    if collection_name in collist:
        return

    collection = db[collection_name]
    collection.insert_one({})


def create_neo4j_properties_string(properties_dict: dict):
    """Creates a properties string from properties dict.
    E.g.: {"a": 2, "b": 3} -> a: 2, b: 3
    Args:
        properties_dict (dict): _description_
    Returns:
        str: The Neo4j properties string.
    """
    properties = ", ".join(
        "{0}: {1}".format(k, convert_to_neo4j_datatype(v))
        for k, v in properties_dict.items()
    )
    return properties


def execute_write_transaction(driver: Neo4jDriver, func, input):
    """Executes a Neo4j write transaction.
    Args:
        driver (Neo4jDriver): The Neo4j driver.
        func (_type_): The function to execute.
        input (_type_): The function input.
    """
    with driver.session() as session:
        session.write_transaction(func, input)


def add_node(driver: Neo4jDriver, param_names: list, vals: list, node_name: str):
    """Adds a node to the Neo4j database.
    Args:
        driver (Neo4jDriver): The Neo4j driver.
        param_names (list): The parameter names.
        vals (list): The parameter values.
        node_name (str): The node name.
    """
    node_dict = create_dict(param_names, vals)
    properties = create_neo4j_properties_string(node_dict)
    query = f"CREATE (n:{node_name} {{ {properties} }})"
    execute_write_transaction(driver, run_query, query)


def create_relationship(
    driver: Neo4jDriver,
    from_entity,
    to_entity,
    relationship_name,
    from_entity_attribute_val_dict,
    to_entity_attribute_val_dict,
    relationship_dict=None,
):
    """Creates a Neo4j relationship.
    Args:
        driver (Neo4jDriver): The Neo4j driver.
        from_entity (str): The source entity.
        to_entity (str): The destination entity.
        relationship_name (str): The name of the relationship.
        from_entity_attribute_val_dict (dict):
        A dictionary containing data of the Neo4j source entity node.
        to_entity_attribute_val_dict (dict):
        A dictionary containing data of the Neo4j destination entity node.
        relationship_dict (dict):
        A dictionary containing data of the Neo4j relationship node.
    """
    from_properties = create_neo4j_properties_string(
        from_entity_attribute_val_dict)
    to_properties = create_neo4j_properties_string(
        to_entity_attribute_val_dict)

    if relationship_dict is not None:
        relationship_properties = create_neo4j_properties_string(relationship_dict)
        query = f"""
        MATCH (a:{from_entity}{{ {from_properties} }}),
        (b:{to_entity}{{ {to_properties} }}) CREATE (a)-[r:{relationship_name}{{ {relationship_properties} }}]->(b)
        """
        execute_write_transaction(driver, run_query, query)
        return

    query = f"""
    MATCH (a:{from_entity}{{ {from_properties} }}),
    (b:{to_entity}{{ {to_properties} }}) CREATE (a)-[r:{relationship_name}]->(b)
    """
    execute_write_transaction(driver, run_query, query)


def create_neo4j_m_to_n_dict(entity_attributes, entity_values, mn_information):
    """Creates a dictionary that is needed to create a relationship
    reoresenting a m:n table (function create_relationship).
    Args:
        entity_attributes (list): The attribute names.
        entity_values (list): The attribute values.
        mn_information (dict): A dictionary of the format.
        {
            "fromEntity": <value>,
            "toEntity": <value>,
            "relationshipName": <value>,
            "fromAttribute": <value>,
            "toAttribute": <value>,
            "primaryKeyAttribute": <value>,
        }
    Returns:
        dict: Dictionary of the format
        {
            "fromEntity": <value>,
            "toEntity": <value>,
            "relationshipName": <value>,
            "fromEntityAttributeValDict": <value>,
            "toEntityAttributeValDict": <value>,
            "relationshipDict": <value>,
        }
    """
    attributes_enum = [(k, v) for k, v in enumerate(entity_attributes)]
    values_enum = [(k, v) for k, v in enumerate(entity_values)]
    result = dict()
    prim_key_index = [
        el[0]
        for el in attributes_enum
        if el[1] == mn_information["primaryKeyAttribute"]
    ][0]
    result["fromEntity"] = mn_information["fromEntity"]
    result["toEntity"] = mn_information["toEntity"]
    result["relationshipName"] = mn_information["relationshipName"]
    from_entity_val_index = [
        el[0] for el in attributes_enum if el[1] == mn_information["fromAttribute"]
    ][0]
    from_entity_val = [el[1] for el in values_enum if el[0] == from_entity_val_index][0]
    result["fromEntityAttributeValDict"] = {
        mn_information["fromAttribute"]: from_entity_val
    }
    to_entity_val_index = [
        el[0] for el in attributes_enum if el[1] == mn_information["toAttribute"]
    ][0]
    to_entity_val = [el[1] for el in values_enum if el[0] == to_entity_val_index][0]
    result["toEntityAttributeValDict"] = {mn_information["toAttribute"]: to_entity_val}
    omit_index = [prim_key_index, from_entity_val_index, to_entity_val_index]
    relationship_attributes = [
        el[1] for el in attributes_enum if el[0] not in omit_index
    ]
    relationship_values = [el[1] for el in values_enum if el[0] not in omit_index]

    if len(relationship_attributes) == len(relationship_values) == 0:
        result["relationshipDict"] = None
        return result

    result["relationshipDict"] = create_dict(
        relationship_attributes, relationship_values
    )
    return result


def neo4j_rollback(driver: Neo4jDriver, nodes, relationships):
    """Executes a Neo4j rollback.
    Args:
        driver (Neo4jDriver): The Neo4j driver.
        nodes (list): The Neo4j nodes.
        relationships (list): The relationship names.
    """
    if driver is None:
        return
    
    for relationship in relationships:
        execute_write_transaction(
            driver, run_query, f"MATCH ()-[r:{relationship}]->() DELETE r"
        )

    for node in nodes:
        execute_write_transaction(driver, run_query, f"MATCH (d:{node}) DELETE d")


def mongodb_rollback(client: pymongo.MongoClient, db_name):
    """Executes a MongoDB rollback.
    Args:
        client (pymongo.MongoClient): The Mongo client.
        db_name (str): The database name.
    """
    if client is None:
        return
    
    client.drop_database(db_name)


def get_neo4j_driver(connection_data):
    """Gets the Neo4j driver.
    Args:
        connection_data (dict):
        Dictionary of form {"URI: <val>, "Username": <val>, "Password": <val>}
    Returns:
        Neo4jDriver: The Neo4j driver.
    """
    driver = GraphDatabase.driver(
        connection_data["URI"],
        auth=(connection_data["Username"], connection_data["Password"]),
    )
    return driver


def get_mongodb_driver(connection_data):
    """Gets the MongoDB driver.
    Args:
        connection_data (dict):
        Dictionary of form {"connectionString": <val>}
    Returns:
        MongoClient: The MongoDB driver.
    """
    driver = pymongo.MongoClient(connection_data["connectionString"])
    return driver


# Connection data
master_db_conn_str = "DRIVER={SQL Server};SERVER=localhost;DATABASE=master;UID=sa;PWD=strongPassword123A!"
ecommerce_db_conn_str = "DRIVER={SQL Server};SERVER=localhost;DATABASE=ECommerce;UID=sa;PWD=strongPassword123A!"
new_ecommerce_db_conn_str = "DRIVER={SQL Server};SERVER=localhost;DATABASE=ECommercePolyglot;UID=sa;PWD=strongPassword123A!"
neo4j_connection = {
    "URI": "neo4j://localhost:7687",
    "Username": "neo4j",
    "Password": "strongPassword123A!",
}
mongodb_connection = {
    "connectionString": "mongodb://localhost:27017"
}

# SQL Tables
sql_tables = [
    "Address",
    "Category",
    "Customer",
    "CustomerOrder",
    "CustomerToAddress",
    "Courier",
    "CourierToAddress",
    "Vendor",
    "VendorToAddress",
    "Product",
    "VendorToProduct",
    "OrderPosition",
    "ShoppingCart",
]
old_mssql_db_name = "ECommerce"
mssql_db_name = "ECommercePolyglot"
neo4j_tables = [
    "VendorToProduct",
    "ShoppingCart",
    "Product",
    "Category"
]
mongodb_db_name = "ECommercePolyglot"
mongodb_tables = [
    "CustomerAction",
    "ProductImage",
    "ProductRecommendation",
    "ProductVideo",
    "Review",
]
relationships = ["HAS_CATEGORY", "IS_IN"]
mn_tables_dict = {
    "ProductToCart": {
        "fromEntity": "VendorToProduct",
        "toEntity": "ShoppingCart",
        "relationshipName": "IS_IN",
        "fromAttribute": "VendorToProductId",
        "toAttribute": "CartId",
        "primaryKeyAttribute": "ProductToCartId",
    },
    "ProductToCategory": {
        "fromEntity": "Product",
        "toEntity": "Category",
        "relationshipName": "HAS_CATEGORY",
        "fromAttribute": "ProductId",
        "toAttribute": "CategoryId",
        "primaryKeyAttribute": "ProductToCategoryId"
    }
}

# Create a new MSSQL server with necessary tables
# ----------------------------------------------------------------
try:
    master_conn = None
    conn_old = None
    conn_new = None
    neo4j_driver = None
    mongodb_driver = None
    neo4j_driver = get_neo4j_driver(neo4j_connection)
    mongodb_driver = get_mongodb_driver(mongodb_connection)
    master_conn = pyodbc.connect(master_db_conn_str, autocommit=True)
    log(f"Connected to {master_db_conn_str}.")
    conn_old = pyodbc.connect(ecommerce_db_conn_str)
    log(f"Connected to {ecommerce_db_conn_str}.")
    cursor = master_conn.cursor()
    cursor.execute(f"CREATE DATABASE {mssql_db_name}")
    log(f"Created {mssql_db_name}.")

    mssql_tables = [
    """
    CREATE TABLE Address
    (
        AddressId INT PRIMARY KEY,
        Street VARCHAR(100) NOT NULL,
        City VARCHAR(100) NOT NULL,
        PostalCode VARCHAR(10) NOT NULL,
        Country VARCHAR(20) NOT NULL,
    );
    """,
    """
    CREATE TABLE Category
    (
        CategoryId INT PRIMARY KEY,
        Name VARCHAR(100) NOT NULL
    );
    """,
    """
    CREATE TABLE Customer 
    (
        CustomerId INT PRIMARY KEY,
        UserName VARCHAR(100) NOT NULL,
        FirstName VARCHAR(100) NOT NULL,
        LastName VARCHAR(100) NOT NULL,
        Email VARCHAR(100) NOT NULL,
        Password VARCHAR(100) NOT NULL,
        PhoneNumber VARCHAR(20)
    );
    """,
    """
    CREATE TABLE CustomerOrder
    (
        OrderId INT PRIMARY KEY,
        OrderName VARCHAR(100),
        OrderDate DATETIME NOT NULL,
        CustomerId INT NOT NULL,
        BillingAddressId INT NOT NULL,
        IsPaid BIT NOT NULL,
        FOREIGN KEY (CustomerId) REFERENCES Customer(CustomerId),
        FOREIGN KEY (BillingAddressId) REFERENCES Address(AddressId)
    );
    """,
    """
    CREATE TABLE CustomerToAddress
    (
        CustomerToAddressId INT PRIMARY KEY,
        CustomerId INT NOT NULL,
        AddressId INT NOT NULL,
        FOREIGN KEY (CustomerId) REFERENCES Customer(CustomerId),
        FOREIGN KEY (AddressId) REFERENCES Address(AddressId)
    );
    """,
    """
    CREATE TABLE Courier
    (
        CourierId INT PRIMARY KEY,
        Name VARCHAR(100) NOT NULL,
        Email VARCHAR(100) NOT NULL,
        PhoneNumber VARCHAR(20)
    );
    """,
    """
    CREATE TABLE CourierToAddress
    (
        CourierToAddressId INT PRIMARY KEY,
        CourierId INT NOT NULL,
        AddressId INT NOT NULL,
        FOREIGN KEY (CourierId) REFERENCES Courier(CourierId),
        FOREIGN KEY (AddressId) REFERENCES Address(AddressId)
    );
    """,
    """
    CREATE TABLE Vendor
    (
        VendorId INT PRIMARY KEY,
        UserName VARCHAR(100) NOT NULL,
        Password VARCHAR(100) NOT NULL,
        Name VARCHAR(100) NOT NULL,
        Email VARCHAR(100) NOT NULL,
        PhoneNumber VARCHAR(20)
    );
    """,
    """
    CREATE TABLE VendorToAddress
    (
        VendorToAddressId INT PRIMARY KEY,
        VendorId INT NOT NULL,
        AddressId INT NOT NULL,
        FOREIGN KEY (VendorId) REFERENCES Vendor(VendorId),
        FOREIGN KEY (AddressId) REFERENCES Address(AddressId)
    );
    """,
    """
    CREATE TABLE Product 
    (
        ProductId INT PRIMARY KEY,
        Name VARCHAR(100) NOT NULL,
        Description TEXT NOT NULL
    );
    """,
    """
    CREATE TABLE VendorToProduct
    (
        VendorToProductId INT PRIMARY KEY,
        VendorId INT NOT NULL,
        ProductId INT NOT NULL,
        UnitPriceEuro DECIMAL(10,2) NOT NULL,
        InventoryLevel INT NOT NULL,
        FOREIGN KEY (VendorId) REFERENCES Vendor(VendorId),
        FOREIGN KEY (ProductId) REFERENCES Product(ProductId)
    );
    """,
    """
    CREATE TABLE OrderPosition
    (
    OrderPositionId INT PRIMARY KEY,
    OrderId INT NOT NULL,
    Amount INT, 
    VendorToProductId INT NOT NULL,
    CourierCompanyId INT NOT NULL,
    DeliveryDate DATETIME NOT NULL,
    DeliveryAddressId INT NOT NULL,
    FOREIGN KEY (CourierCompanyId) REFERENCES Courier(CourierId),
    FOREIGN KEY (DeliveryAddressId) REFERENCES Address(AddressId),
    FOREIGN KEY (OrderId) REFERENCES CustomerOrder(OrderId),
    FOREIGN KEY (VendorToProductId) REFERENCES VendorToProduct(VendorToProductId),
    );
    """,
    """
    CREATE TABLE ShoppingCart
    (
    CartId INT PRIMARY KEY,
    DateCreated DATETIME NOT NULL,
    CustomerId INT NOT NULL,
    FOREIGN KEY (CustomerId) REFERENCES Customer(CustomerId)
    );
    """
    ]

    conn_new = pyodbc.connect(new_ecommerce_db_conn_str)
    log(f"Connected to {new_ecommerce_db_conn_str}.")
    for mssql_create_table_query in mssql_tables:
        cursor = conn_new.cursor()
        cursor.execute(mssql_create_table_query)
        log(f"Executed CREATE TABLE query in {mssql_db_name}.")
    # ----------------------------------------------------------------
    # Load data into tables and create corresponding graph nodes if part of m:n relationship
    # ----------------------------------------------------------------
    for table in sql_tables:
        cursor_old = conn_old.cursor()
        cursor_new = conn_new.cursor()
        cols = cursor_old.columns(table=table)
        columns = [el.column_name for el in cols.fetchall()]
        columns_str = ",".join(columns)
        select_query = f"SELECT * FROM {table}"
        cursor_old.execute(select_query)
        old_rows = cursor_old.fetchall()
        log(f"Executed SELECT from {table} in {old_mssql_db_name}.")

        for row in old_rows:
            insert_query = (
                f"INSERT INTO {table} ("
                + columns_str
                + ") VALUES ("
                + ",".join(["?" for _ in row])
                + ");"
            )
            param_els = list(row)
            cursor_new.execute(insert_query, param_els)
            log(f"Executed INSERT to {table} in {mssql_db_name}.")

            if table in neo4j_tables:
                add_node(neo4j_driver, columns, param_els, table)
                log(
                    f"Created Neo4j node for {table} (old database {old_mssql_db_name})."
                )

    # Store the m:n-Tables as relationships in the graph database
    # ----------------------------------------------------------------
    mntables = list(mn_tables_dict.keys())

    for table in mntables:
        cursor_old = conn_old.cursor()
        cols = cursor_old.columns(table=table)
        columns = [el.column_name for el in cols.fetchall()]
        select_query = f"SELECT * FROM {table}"
        cursor_old.execute(select_query)
        old_rows = cursor_old.fetchall()
        log(f"Executed SELECT from {table} in {old_mssql_db_name}.")

        for row in old_rows:
            row = list(row)
            rd = create_neo4j_m_to_n_dict(columns, row, mn_tables_dict[table])
            create_relationship(
                neo4j_driver,
                rd["fromEntity"],
                rd["toEntity"],
                rd["relationshipName"],
                rd["fromEntityAttributeValDict"],
                rd["toEntityAttributeValDict"],
                rd["relationshipDict"],
            )
            log(
                f"Created Neo4j relationship for {table} (old database {old_mssql_db_name})."
            )

    # Store the MongoDB entities
    # ----------------------------------------------------------------
    for table in mongodb_tables:
        create_mongodb_collection(mongodb_driver, mongodb_db_name, table)
        log(f"Created MongoDB collection for {table} in database {mongodb_db_name}.")

    commit(master_conn, f"{master_db_conn_str} committed.")
    commit(conn_old, f"{ecommerce_db_conn_str} committed.")
    commit(conn_new, f"{new_ecommerce_db_conn_str} committed.")
    close(master_conn, f"{master_db_conn_str} closed.")
    close(conn_old, f"{ecommerce_db_conn_str} closed.")
    close(conn_new, f"{new_ecommerce_db_conn_str} closed.")
    close(neo4j_driver, "Neo4j driver closed.")
    close(mongodb_driver, "MongoDB driver closed.")
    log("Script completed.")
except Exception as e:
    log("Error occurred: " + str(e))
    log("Please revert the changes in the other No-SQL databases.")
    rollback(master_conn, f"{master_db_conn_str} rollback.")
    rollback(conn_old, f"{ecommerce_db_conn_str} rollback.")
    rollback(conn_new, f"{new_ecommerce_db_conn_str} rollback.")
    close(master_conn, f"{master_db_conn_str} closed.")
    close(conn_old, f"{ecommerce_db_conn_str} closed.")
    close(conn_new, f"{new_ecommerce_db_conn_str} closed.")
    neo4j_rollback(neo4j_driver, neo4j_tables)
    close(neo4j_driver, "Neo4j driver closed.")
    close(mongodb_driver, "MongoDB driver closed.")
    mongodb_rollback()
