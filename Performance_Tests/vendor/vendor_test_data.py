import os
from pathlib import Path


class VendorTestData:
    """Represents the data used to execute the vendor requirements."""

    vendor_test_data_path: Path = Path(__file__).resolve().parent
    vendor_sql_measurements_path: Path = vendor_test_data_path.joinpath(
        "vendor_sql_seconds.csv"
    )
    vendor_it1_measurements_path: Path = vendor_test_data_path.joinpath(
        "vendor_it1_seconds.csv"
    )
    vendor_it2_measurements_path: Path = vendor_test_data_path.joinpath(
        "vendor_it2_seconds.csv"
    )
    login_data: dict = {"userName": "TestFirmaName", "password": "testpassword123"}
    vendor_id = 200
    it1_prefix = "http://localhost:3000/vendor"
    it2_prefix = "http://localhost:3000/vendor"
    db_config: dict = {
        "server": "localhost",
        "database": "ECommerce",
        "user": "sa",
        "password": "strongPassword123A!",
    }
    v1_data: dict = {
        "userName": "TestFirmaName",
        "name": "TestFirmaName",
        "email": "testfirma@gmail.com",
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
    v2_data: dict = {
        "id": 200,
        "userName": "TestFirmaName2",
        "name": "TestFirstName2",
        "email": "testfirma2@gmail.com",
        "phoneNumber": "+11111111112",
        "password": "testpassword123",
    }
    v3_data: dict = {"id": 200}
    v4_data: dict = {"id": 200}
    v5_data: dict = {
        "id": 200,
        "street": "Hauptstraße 154",
        "city": "Graz",
        "postalCode": "8010",
        "country": "Austria",
    }
    v6_data: dict = {
        "id": 200,
        "addressId": 1,
        "street": "Hauptstraße 155",
        "city": "Graz",
        "postalCode": "8010",
        "country": "Austria",
    }
    v7_data: dict = {"id": 200, "addressId": 901}
    v8_data: dict = {"id": 200}
    v9_data: dict = {
        "vendorId": 200,
        "inventoryLevel": 29,
        "name": "Test",
        "description": "This is a test product",
        "unitPriceEuro": 12,
        "imageContent": vendor_test_data_path.joinpath("test_image.jpg"),
        "videoContent": vendor_test_data_path.joinpath("test_video.mp4"),
        "categories": [{"categoryId": 2}],
    }
    v10_data: dict = {
        "vendorId": 200,
        "vendorToProductId": 20000,
        "inventoryLevel": 29,
        "name": "Test2",
        "imageContent": vendor_test_data_path.joinpath("test_image.jpg"),
        "videoContent": vendor_test_data_path.joinpath("test_video.mp4"),
        "description": "This is a test product2",
        "unitPriceEuro": 12,
    }
    v11_data: dict = {"id": 20000}
    v12_data: dict = {"id": 200}
    v13_data: dict = {"vendorId": 200, "vendorToProductId": 20000, "categoryId": 0}
    v14_data: dict = {"vendorId": 200, "vendorToProductId": 20000, "categoryId": 0}
