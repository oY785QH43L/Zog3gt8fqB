import os
from pathlib import Path


class CustomerTestData:
    """Represents the data used to execute the customer requirements."""

    customer_test_data_path: Path = Path(__file__).resolve().parent
    customer_sql_measurements_path: Path = customer_test_data_path.joinpath(
        "customer_sql_seconds.csv"
    )
    customer_it1_measurements_path: Path = customer_test_data_path.joinpath(
        "customer_it1_seconds.csv"
    )
    customer_it2_measurements_path: Path = customer_test_data_path.joinpath(
        "customer_it2_seconds.csv"
    )
    db_config: dict = {
        "server": "localhost",
        "database": "ECommerce",
        "user": "sa",
        "password": "strongPassword123A!",
    }
    db_config_it2: dict = {
        "server": "localhost",
        "database": "ECommercePolyglot",
        "user": "sa",
        "password": "strongPassword123A!",
    }
    neo4j_db_connection = {
        "URI": "neo4j://localhost:7687",
        "Username": "neo4j",
        "Password": "strongPassword123A!",
    }
    it1_prefix = "http://localhost:3000/customer"
    it2_prefix = "http://localhost:3000/customer"
    it2_admin_prefix = "http://localhost:3000/admin"
    customer_id = 200
    admin_id = 241928
    login_data: dict = {"userName": "TestUserName", "password": "testpassword123"}
    k1_data: dict = {
        "userName": "TestUserName",
        "firstName": "TestFirstName",
        "lastName": "TestLastName",
        "email": "testuser@gmail.com",
        "phoneNumber": "+1111111111",
        "password": "testpassword123",
        "addresses": [
            {
                "street": "Teststreet",
                "city": "TestCity",
                "postalCode": "123A",
                "country": "TestCountry",
            },
            {
                "street": "Kaiserstraße 238",
                "city": "Vienna",
                "postalCode": "1010",
                "country": "Austria",
            },
        ],
    }
    k2_data: dict = {
        "id": 200,
        "userName": "TestUserName2",
        "firstName": "TestFirstName2",
        "lastName": "TestLastName2",
        "email": "testuser2@gmail.com",
        "phoneNumber": "+11111111112",
        "password": "testpassword123",
    }
    k3_data: dict = {"id": 200}
    k4_data: dict = {"id": 200}
    k5_data: dict = {
        "id": 200,
        "street": "Hauptstraße 154",
        "city": "Graz",
        "postalCode": "8010",
        "country": "Austria",
    }
    k6_data: dict = {
        "id": 200,
        "addressId": 1,
        "street": "Hauptstraße 155",
        "city": "Graz",
        "postalCode": "8010",
        "country": "Austria",
    }
    k7_data: dict = {"id": 200, "addressId": 901}
    k8_data: dict = {"id": 200}
    k9_data: dict = {"id": 0}
    k10_data: dict = {
        "customerId": 200,
        "vendorToProductId": 19999,
        "shoppingCartId": 200,
        "amount": 2,
    }
    k11_data: dict = {
        "customerId": 200,
        "vendorToProductId": 19999,
        "shoppingCartId": 200,
        "amount": 1,
    }
    k12_data: dict = {"id": 0}
    k13_data: dict = {
        "courierId": 0,
        "billingAddressId": 0,
        "cartId": 200,
        "customerId": 200,
    }
    k14_data: dict = {"id": 200}
    k15_data: dict = {"id": 0}
    k16_data: dict = {
        "customerId": 200,
        "vendorToProductId": 0,
        "reviewText": "This is a test review",
        "rating": 10,
    }
    k17_data: dict = {
        "reviewId": 0,
        "customerId": 200,
        "vendorToProductId": 0,
        "reviewText": "This is a test review2",
        "rating": 9,
    }
    k18_data: dict = {"id": 0}
