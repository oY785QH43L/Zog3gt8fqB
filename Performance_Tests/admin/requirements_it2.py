import admin.admin_test_data
import importlib

importlib.reload(admin.admin_test_data)
from admin.admin_test_data import AdminTestData
import time
import requests

admin_test_data = AdminTestData()


def a1() -> float:
    """Executes the requirement with ID A1.
    Returns:
        float: Amount of seconds needed to execute the requirement.
    """
    try:
        a1_data = admin_test_data.a1_data
        url = admin_test_data.it2_prefix + "/courier/create"
        body = {
            "adminId": admin_test_data.admin_id,
            "name": a1_data["name"],
            "email": a1_data["email"],
            "phoneNumber": a1_data["phoneNumber"],
            "addresses": a1_data["addresses"],
        }
        start = time.time()
        response = requests.post(url, json=body)
        end = time.time()

        if response.status_code != 201:
            raise Exception("The execution of A1 was not successful!")

        return end - start
    except Exception as e:
        raise e


def a2() -> float:
    """Executes the requirement with ID A2.
    Returns:
        float: Amount of seconds needed to execute the requirement.
    """
    try:
        a2_data = admin_test_data.a2_data
        url = admin_test_data.it2_prefix + f"/courier/update/{str(a2_data["id"])}"
        body = {
            "adminId": admin_test_data.admin_id,
            "courierId": a2_data["id"],
            "name": a2_data["name"],
            "email": a2_data["email"],
            "phoneNumber": a2_data["phoneNumber"],
        }
        start = time.time()
        response = requests.put(url, json=body)
        end = time.time()

        if response.status_code != 201:
            raise Exception("The execution of A2 was not successful!")

        return end - start
    except Exception as e:
        raise e


def a3() -> float:
    """Executes the requirement with ID A3.
    Returns:
        float: Amount of seconds needed to execute the requirement.
    """
    try:
        a3_data = admin_test_data.a3_data
        url = (
            admin_test_data.it2_prefix
            + f"/courier/{str(admin_test_data.admin_id)}/{a3_data["id"]}"
        )
        start = time.time()
        response = requests.delete(url)
        end = time.time()

        if response.status_code != 200:
            raise Exception("The execution of A3 was not successful!")

        return end - start
    except Exception as e:
        raise e


def a4() -> float:
    """Executes the requirement with ID A4.
    Returns:
        float: Amount of seconds needed to execute the requirement.
    """
    try:
        a4_data = admin_test_data.a4_data
        url = admin_test_data.it2_prefix + "/courier/address/create"
        body = {
            "adminId": admin_test_data.admin_id,
            "courierId": a4_data["id"],
            "street": a4_data["street"],
            "city": a4_data["city"],
            "postalCode": a4_data["postalCode"],
            "country": a4_data["country"],
        }
        start = time.time()
        response = requests.post(url, json=body)
        end = time.time()

        if response.status_code != 201:
            raise Exception("The execution of A4 was not successful!")

        return end - start
    except Exception as e:
        raise e


def a5() -> float:
    """Executes the requirement with ID A5.
    Returns:
        float: Amount of seconds needed to execute the requirement.
    """
    try:
        a5_data = admin_test_data.a5_data
        url = (
            admin_test_data.it2_prefix
            + f"/courier/address/update/{str(a5_data["addressId"])}"
        )
        body = {
            "adminId": admin_test_data.admin_id,
            "addressId": a5_data["addressId"],
            "courierId": a5_data["id"],
            "street": a5_data["street"],
            "city": a5_data["city"],
            "postalCode": a5_data["postalCode"],
            "country": a5_data["country"],
        }
        start = time.time()
        response = requests.put(url, json=body)
        end = time.time()

        if response.status_code != 201:
            raise Exception("The execution of A5 was not successful!")

        return end - start
    except Exception as e:
        raise e


def a6() -> float:
    """Executes the requirement with ID A6.
    Returns:
        float: Amount of seconds needed to execute the requirement.
    """
    try:
        a6_data = admin_test_data.a6_data
        url = admin_test_data.it2_prefix + "/courier/address/remove"
        body = {
            "adminId": admin_test_data.admin_id,
            "addressId": a6_data["addressId"],
            "courierId": a6_data["id"],
        }
        start = time.time()
        response = requests.post(url, json=body)
        end = time.time()

        if response.status_code != 200:
            raise Exception("The execution of A6 was not successful!")

        return end - start
    except Exception as e:
        raise e


def a7() -> float:
    """Executes the requirement with ID A7.
    Returns:
        float: Amount of seconds needed to execute the requirement.
    """
    try:
        a7_data = admin_test_data.a7_data
        url = admin_test_data.it2_prefix + "/category/create"
        body = {"adminId": admin_test_data.admin_id, "name": a7_data["name"]}
        start = time.time()
        response = requests.post(url, json=body)
        end = time.time()

        if response.status_code != 201:
            raise Exception("The execution of A7 was not successful!")

        return end - start
    except Exception as e:
        raise e


def a8() -> float:
    """Executes the requirement with ID A8.
    Returns:
        float: Amount of seconds needed to execute the requirement.
    """
    try:
        a8_data = admin_test_data.a8_data
        url = admin_test_data.it2_prefix + f"/category/update/{str(a8_data["id"])}"
        body = {
            "adminId": admin_test_data.admin_id,
            "categoryId": a8_data["id"],
            "name": a8_data["name"],
        }
        start = time.time()
        response = requests.put(url, json=body)
        end = time.time()

        if response.status_code != 201:
            raise Exception("The execution of A8 was not successful!")

        return end - start
    except Exception as e:
        raise e


def a9() -> float:
    """Executes the requirement with ID A9.
    Returns:
        float: Amount of seconds needed to execute the requirement.
    """
    try:
        a9_data = admin_test_data.a9_data
        url = (
            admin_test_data.it2_prefix
            + f"/category/{str(admin_test_data.admin_id)}/{str(a9_data["id"])}"
        )
        start = time.time()
        response = requests.delete(url)
        end = time.time()

        if response.status_code != 200:
            raise Exception("The execution of A9 was not successful!")

        return end - start
    except Exception as e:
        raise e


def a10() -> float:
    """Executes the requirement with ID A10.
    Returns:
        float: Amount of seconds needed to execute the requirement.
    """
    try:
        a10_data = admin_test_data.a10_data
        url = admin_test_data.it2_prefix + "/recommendation/addrecommendation"
        body = {
            "adminId": admin_test_data.admin_id,
            "customerId": a10_data["customerId"],
            "vendorToProductId": a10_data["vendorToProductId"],
            "purchaseProbability": a10_data["purchaseProbability"],
        }
        start = time.time()
        response = requests.post(url, json=body)
        end = time.time()

        if response.status_code != 201:
            raise Exception("The execution of A10 was not successful!")

        return end - start
    except Exception as e:
        raise e


def a11() -> float:
    """Executes the requirement with ID A11.
    Returns:
        float: Amount of seconds needed to execute the requirement.
    """
    try:
        a11_data = admin_test_data.a11_data
        url = (
            admin_test_data.it2_prefix
            + f"/recommendation/update/{str(a11_data["recommendationId"])}"
        )
        body = {
            "adminId": admin_test_data.admin_id,
            "recommendationId": a11_data["recommendationId"],
            "customerId": a11_data["customerId"],
            "vendorToProductId": a11_data["vendorToProductId"],
            "purchaseProbability": a11_data["purchaseProbability"],
        }
        start = time.time()
        response = requests.put(url, json=body)
        end = time.time()

        if response.status_code != 201:
            raise Exception("The execution of A11 was not successful!")

        return end - start
    except Exception as e:
        raise e


def a12() -> float:
    """Executes the requirement with ID A12.
    Returns:
        float: Amount of seconds needed to execute the requirement.
    """
    try:
        a12_data = admin_test_data.a12_data
        url = (
            admin_test_data.it2_prefix
            + f"/recommendation/{str(admin_test_data.admin_id)}/{str(a12_data["recommendationId"])}"
        )
        start = time.time()
        response = requests.delete(url)
        end = time.time()

        if response.status_code != 200:
            raise Exception("The execution of A12 was not successful!")

        return end - start
    except Exception as e:
        raise e


mapping_dictionary = {
    "A1": a1,
    "A2": a2,
    "A3": a3,
    "A4": a4,
    "A5": a5,
    "A6": a6,
    "A7": a7,
    "A8": a8,
    "A9": a9,
    "A10": a10,
    "A11": a11,
    "A12": a12,
}
