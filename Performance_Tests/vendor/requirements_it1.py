import vendor.vendor_test_data
import importlib

importlib.reload(vendor.vendor_test_data)
from vendor.vendor_test_data import VendorTestData
import time
import requests

vendor_test_data = VendorTestData()


def v1() -> float:
    """Executes the requirement with ID V1.
    Returns:
        float: Amount of seconds needed to execute the requirement.
    """
    try:
        v1_data = vendor_test_data.v1_data
        url = vendor_test_data.it1_prefix + "/account/create"
        body = {
            "userName": v1_data["userName"],
            "name": v1_data["name"],
            "email": v1_data["email"],
            "password": v1_data["password"],
            "phoneNumber": v1_data["phoneNumber"],
            "addresses": v1_data["addresses"],
        }
        start = time.time()
        response = requests.post(url, json=body)
        end = time.time()

        if response.status_code != 201:
            raise Exception("The execution of V1 was not successful!")

        return end - start
    except Exception as e:
        raise e


def login():
    """Logs the vendor in."""
    try:
        url = vendor_test_data.it1_prefix + "/account/login"
        response = requests.post(url, json=vendor_test_data.login_data)

        if response.status_code != 200:
            raise Exception("Login was not successful!")
    except Exception as e:
        raise e


def v2() -> float:
    """Executes the requirement with ID V2.
    Returns:
        float: Amount of seconds needed to execute the requirement.
    """
    try:
        v2_data = vendor_test_data.v2_data
        url = vendor_test_data.it1_prefix + f"/account/update/{str(v2_data["id"])}"
        body = {
            "vendorId": v2_data["id"],
            "userName": v2_data["userName"],
            "name": v2_data["name"],
            "email": v2_data["email"],
            "password": v2_data["password"],
            "phoneNumber": v2_data["phoneNumber"],
        }
        start = time.time()
        response = requests.put(url, json=body)
        end = time.time()

        if response.status_code != 201:
            raise Exception("The execution of V2 was not successful!")

        return end - start
    except Exception as e:
        raise e


def v3() -> float:
    """Executes the requirement with ID V3.
    Returns:
        float: Amount of seconds needed to execute the requirement.
    """
    try:
        v3_data = vendor_test_data.v3_data
        url = vendor_test_data.it1_prefix + f"/account/{str(v3_data["id"])}"
        start = time.time()
        response = requests.delete(url)
        end = time.time()

        if response.status_code != 200:
            raise Exception("The execution of V3 was not successful!")

        return end - start
    except Exception as e:
        raise e


def v4() -> float:
    """Executes the requirement with ID V4.
    Returns:
        float: Amount of seconds needed to execute the requirement.
    """
    try:
        v4_data = vendor_test_data.v4_data
        url = vendor_test_data.it1_prefix + f"/account/{str(v4_data["id"])}"
        start = time.time()
        response = requests.get(url)
        end = time.time()

        if response.status_code != 200:
            raise Exception("The execution of V4 was not successful!")

        return end - start
    except Exception as e:
        raise e


def v5() -> float:
    """Executes the requirement with ID V5.
    Returns:
        float: Amount of seconds needed to execute the requirement.
    """
    try:
        v5_data = vendor_test_data.v5_data
        url = vendor_test_data.it1_prefix + "/address/create"
        body = {
            "vendorId": v5_data["id"],
            "street": v5_data["street"],
            "city": v5_data["city"],
            "postalCode": v5_data["postalCode"],
            "country": v5_data["country"],
        }
        start = time.time()
        response = requests.post(url, json=body)
        end = time.time()

        if response.status_code != 201:
            raise Exception("The execution of V5 was not successful!")

        return end - start
    except Exception as e:
        raise e


def v6() -> float:
    """Executes the requirement with ID V6.
    Returns:
        float: Amount of seconds needed to execute the requirement.
    """
    try:
        v6_data = vendor_test_data.v6_data
        url = (
            vendor_test_data.it1_prefix + f"/address/update/{str(v6_data["addressId"])}"
        )
        body = {
            "vendorId": v6_data["id"],
            "addressId": v6_data["addressId"],
            "street": v6_data["street"],
            "city": v6_data["city"],
            "postalCode": v6_data["postalCode"],
            "country": v6_data["country"],
        }
        start = time.time()
        response = requests.put(url, json=body)
        end = time.time()

        if response.status_code != 201:
            raise Exception("The execution of V6 was not successful!")

        return end - start
    except Exception as e:
        raise e


def v7() -> float:
    """Executes the requirement with ID V7.
    Returns:
        float: Amount of seconds needed to execute the requirement.
    """
    try:
        v7_data = vendor_test_data.v7_data
        url = (
            vendor_test_data.it1_prefix
            + f"/address/{str(v7_data["id"])}/{str(v7_data["addressId"])}"
        )
        start = time.time()
        response = requests.delete(url)
        end = time.time()

        if response.status_code != 200:
            raise Exception("The execution of V7 was not successful!")

        return end - start
    except Exception as e:
        raise e


def v8() -> float:
    """Executes the requirement with ID V8.
    Returns:
        float: Amount of seconds needed to execute the requirement.
    """
    try:
        v8_data = vendor_test_data.v8_data
        url = vendor_test_data.it1_prefix + f"/address/{str(v8_data["id"])}"
        start = time.time()
        response = requests.get(url)
        end = time.time()

        if response.status_code != 200:
            raise Exception("The execution of V8 was not successful!")

        return end - start
    except Exception as e:
        raise e


def v9() -> float:
    """Executes the requirement with ID V9.
    Returns:
        float: Amount of seconds needed to execute the requirement.
    """
    try:
        v9_data = vendor_test_data.v9_data
        url = vendor_test_data.it1_prefix + "/product/create"
        body = {
            "vendorId": v9_data["vendorId"],
            "unitPriceEuro": v9_data["unitPriceEuro"],
            "inventoryLevel": v9_data["inventoryLevel"],
            "name": v9_data["name"],
            "description": v9_data["description"],
            "categories": v9_data["categories"],
        }
        start = time.time()
        response = requests.post(url, json=body)
        end = time.time()

        if response.status_code != 201:
            raise Exception("The execution of V9 was not successful!")

        return end - start
    except Exception as e:
        raise e


def v10() -> float:
    """Executes the requirement with ID V10.
    Returns:
        float: Amount of seconds needed to execute the requirement.
    """
    try:
        v10_data = vendor_test_data.v10_data
        url = (
            vendor_test_data.it1_prefix
            + f"/product/update/{str(v10_data["vendorToProductId"])}"
        )
        body = {
            "vendorId": v10_data["vendorId"],
            "unitPriceEuro": v10_data["unitPriceEuro"],
            "vendorToProductId": v10_data["vendorToProductId"],
            "inventoryLevel": v10_data["inventoryLevel"],
            "name": v10_data["name"],
            "description": v10_data["description"],
        }
        start = time.time()
        response = requests.put(url, json=body)
        end = time.time()

        if response.status_code != 201:
            raise Exception("The execution of V10 was not successful!")

        return end - start
    except Exception as e:
        raise e


def v11() -> float:
    """Executes the requirement with ID V11.
    Returns:
        float: Amount of seconds needed to execute the requirement.
    """
    try:
        v11_data = vendor_test_data.v11_data
        url = (
            vendor_test_data.it1_prefix
            + f"/product/{str(vendor_test_data.vendor_id)}/{str(v11_data["id"])}"
        )
        start = time.time()
        response = requests.delete(url)
        end = time.time()

        if response.status_code != 200:
            raise Exception("The execution of V11 was not successful!")

        return end - start
    except Exception as e:
        raise e


def v12() -> float:
    """Executes the requirement with ID V12.
    Returns:
        float: Amount of seconds needed to execute the requirement.
    """
    try:
        v12_data = vendor_test_data.v12_data
        url = vendor_test_data.it1_prefix + f"/product/{str(v12_data["id"])}"
        start = time.time()
        response = requests.get(url)
        end = time.time()

        if response.status_code != 200:
            raise Exception("The execution of V12 was not successful!")

        return end - start
    except Exception as e:
        raise e


def v13() -> float:
    """Executes the requirement with ID V13.
    Returns:
        float: Amount of seconds needed to execute the requirement.
    """
    try:
        v13_data = vendor_test_data.v13_data
        url = vendor_test_data.it1_prefix + f"/product/addcategory"
        body = {
            "vendorId": v13_data["vendorId"],
            "vendorToProductId": v13_data["vendorToProductId"],
            "categoryId": v13_data["categoryId"],
        }
        start = time.time()
        response = requests.post(url, json=body)
        end = time.time()

        if response.status_code != 201:
            raise Exception("The execution of V13 was not successful!")

        return end - start
    except Exception as e:
        raise e


def v14() -> float:
    """Executes the requirement with ID V14.
    Returns:
        float: Amount of seconds needed to execute the requirement.
    """
    try:
        v14_data = vendor_test_data.v14_data
        url = vendor_test_data.it1_prefix + f"/product/removecategory"
        body = {
            "vendorId": v14_data["vendorId"],
            "vendorToProductId": v14_data["vendorToProductId"],
            "categoryId": v14_data["categoryId"],
        }
        start = time.time()
        response = requests.put(url, json=body)
        end = time.time()

        if response.status_code != 200:
            raise Exception("The execution of V14 was not successful!")

        return end - start
    except Exception as e:
        raise e


mapping_dictionary = {
    "V1": v1,
    "V2": v2,
    "V3": v3,
    "V4": v4,
    "V5": v5,
    "V6": v6,
    "V7": v7,
    "V8": v8,
    "V9": v9,
    "V10": v10,
    "V11": v11,
    "V12": v12,
    "V13": v13,
    "V14": v14,
}
