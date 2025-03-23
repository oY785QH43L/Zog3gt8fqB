import os
from pathlib import Path


class AdminTestData:
    """Represents the data used to execute the admin requirements."""

    admin_test_data_path: Path = Path(__file__).resolve().parent
    admin_sql_measurements_path: Path = admin_test_data_path.joinpath(
        "admin_sql_seconds.csv"
    )
    it1_prefix = "http://localhost:3000/admin"
    it2_prefix = "http://localhost:3000/admin"
    admin_id = 241928
    admin_it1_path: Path = admin_test_data_path.joinpath("admin_it1_seconds.csv")
    admin_it2_path: Path = admin_test_data_path.joinpath("admin_it2_seconds.csv")
    db_config: dict = {
        "server": "localhost",
        "database": "ECommerce",
        "user": "sa",
        "password": "strongPassword123A!",
    }
    a1_data: dict = {
        "name": "TestCourier",
        "email": "testuser@gmail.com",
        "phoneNumber": "+1111111111",
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
    a2_data: dict = {
        "id": 20,
        "name": "TestCourier2",
        "email": "testuser2@gmail.com",
        "phoneNumber": "+11111111112",
    }
    a3_data: dict = {"id": 20}
    a4_data: dict = {
        "id": 20,
        "street": "Hauptstraße 154",
        "city": "Graz",
        "postalCode": "8010",
        "country": "Austria",
    }
    a5_data: dict = {
        "id": 20,
        "addressId": 1,
        "street": "Hauptstraße 155",
        "city": "Graz",
        "postalCode": "8010",
        "country": "Austria",
    }
    a6_data: dict = {"id": 20, "addressId": 901}
    a7_data: dict = {"name": "TestCategory"}
    a8_data: dict = {"id": 7, "name": "TestCategory2"}
    a9_data: dict = {"id": 7}
    a10_data: dict = {
        "customerId": 0,
        "vendorToProductId": 0,
        "purchaseProbability": 0.9,
    }
    a11_data: dict = {
        "recommendationId": 0,
        "customerId": 0,
        "vendorToProductId": 0,
        "purchaseProbability": 0.95,
    }
    a12_data: dict = {"recommendationId": 0}
