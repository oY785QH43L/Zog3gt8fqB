import customer.customer_test_data
import importlib

importlib.reload(customer.customer_test_data)
from customer.customer_test_data import CustomerTestData
from neo4j import GraphDatabase
import requests
import pytds
import time

customer_test_data = CustomerTestData()


def k1() -> float:
    """Executes the requirement with ID K1.
    Returns:
        float: Amount of seconds needed to execute the requirement.
    """
    try:
        k1_data = customer_test_data.k1_data
        url = customer_test_data.it2_prefix + "/account/create"
        body = {
            "userName": k1_data["userName"],
            "firstName": k1_data["firstName"],
            "lastName": k1_data["lastName"],
            "email": k1_data["email"],
            "password": k1_data["password"],
            "phoneNumber": k1_data["phoneNumber"],
            "addresses": k1_data["addresses"],
        }
        start = time.time()
        response = requests.post(url, json=body)
        end = time.time()

        if response.status_code != 201:
            raise Exception("The execution of K1 was not successful!")

        return end - start
    except Exception as e:
        raise e


def login():
    """Logs the customer in."""
    try:
        url = customer_test_data.it2_prefix + "/account/login"
        response = requests.post(url, json=customer_test_data.login_data)

        if response.status_code != 200:
            raise Exception("Login was not successful!")
    except Exception as e:
        raise e


def k2() -> float:
    """Executes the requirement with ID K2.
    Returns:
        float: Amount of seconds needed to execute the requirement.
    """
    try:
        k2_data = customer_test_data.k2_data
        url = customer_test_data.it2_prefix + f"/account/update/{str(k2_data["id"])}"
        body = {
            "customerId": k2_data["id"],
            "userName": k2_data["userName"],
            "firstName": k2_data["firstName"],
            "lastName": k2_data["lastName"],
            "email": k2_data["email"],
            "password": k2_data["password"],
            "phoneNumber": k2_data["phoneNumber"],
        }
        start = time.time()
        response = requests.put(url, json=body)
        end = time.time()

        if response.status_code != 201:
            raise Exception("The execution of K2 was not successful!")

        return end - start
    except Exception as e:
        raise e


def k3() -> float:
    """Executes the requirement with ID K3.
    Returns:
        float: Amount of seconds needed to execute the requirement.
    """
    try:
        k3_data = customer_test_data.k3_data
        url = customer_test_data.it2_prefix + f"/account/{str(k3_data["id"])}"

        start = time.time()
        response = requests.delete(url)
        end = time.time()

        if response.status_code != 200:
            raise Exception("The execution of K3 was not successful!")

        return end - start
    except Exception as e:
        raise e


def k4() -> float:
    """Executes the requirement with ID K4.
    Returns:
        float: Amount of seconds needed to execute the requirement.
    """
    try:
        k4_data = customer_test_data.k4_data
        url = customer_test_data.it2_prefix + f"/account/{str(k4_data["id"])}"

        start = time.time()
        response = requests.get(url)
        end = time.time()

        if response.status_code != 200:
            raise Exception("The execution of K4 was not successful!")

        return end - start
    except Exception as e:
        raise e


def k5() -> float:
    """Executes the requirement with ID K5.
    Returns:
        float: Amount of seconds needed to execute the requirement.
    """
    try:
        k5_data = customer_test_data.k5_data
        url = customer_test_data.it2_prefix + "/address/create"
        body = {
            "customerId": k5_data["id"],
            "street": k5_data["street"],
            "city": k5_data["city"],
            "postalCode": k5_data["postalCode"],
            "country": k5_data["country"],
        }
        start = time.time()
        response = requests.post(url, json=body)
        end = time.time()

        if response.status_code != 201:
            raise Exception("The execution of K5 was not successful!")

        return end - start
    except Exception as e:
        raise e


def k6() -> float:
    """Executes the requirement with ID K6.
    Returns:
        float: Amount of seconds needed to execute the requirement.
    """
    try:
        k6_data = customer_test_data.k6_data
        url = (
            customer_test_data.it2_prefix
            + f"/address/update/{str(k6_data["addressId"])}"
        )
        body = {
            "customerId": k6_data["id"],
            "addressId": k6_data["addressId"],
            "street": k6_data["street"],
            "city": k6_data["city"],
            "postalCode": k6_data["postalCode"],
            "country": k6_data["country"],
        }
        start = time.time()
        response = requests.put(url, json=body)
        end = time.time()

        if response.status_code != 201:
            raise Exception("The execution of K6 was not successful!")

        return end - start
    except Exception as e:
        raise e


def k7() -> float:
    """Executes the requirement with ID K7.
    Returns:
        float: Amount of seconds needed to execute the requirement.
    """
    try:
        k7_data = customer_test_data.k7_data
        url = (
            customer_test_data.it2_prefix
            + f"/address/{str(k7_data["id"])}/{str(k7_data["addressId"])}"
        )
        start = time.time()
        response = requests.delete(url)
        end = time.time()

        if response.status_code != 200:
            raise Exception("The execution of K7 was not successful!")

        return end - start
    except Exception as e:
        raise e


def k8() -> float:
    """Executes the requirement with ID K8.
    Returns:
        float: Amount of seconds needed to execute the requirement.
    """
    try:
        k8_data = customer_test_data.k8_data
        url = customer_test_data.it2_prefix + f"/address/{str(k8_data["id"])}"
        start = time.time()
        response = requests.get(url)
        end = time.time()

        if response.status_code != 200:
            raise Exception("The execution of K8 was not successful!")

        return end - start
    except Exception as e:
        raise e


def k9() -> float:
    """Executes the requirement with ID K9.
    Returns:
        float: Amount of seconds needed to execute the requirement.
    """
    try:
        k9_data = customer_test_data.k9_data
        url = (
            customer_test_data.it2_prefix
            + f"/product/{str(customer_test_data.customer_id)}/{str(k9_data["id"])}"
        )
        start = time.time()
        response = requests.get(url)
        end = time.time()

        if response.status_code != 200:
            raise Exception("The execution of K9 was not successful!")

        return end - start
    except Exception as e:
        raise e


def k10() -> float:
    """Executes the requirement with ID K10.
    Returns:
        float: Amount of seconds needed to execute the requirement.
    """
    try:
        k10_data = customer_test_data.k10_data
        url = customer_test_data.it2_prefix + "/product/addtocart"
        body = {
            "customerId": k10_data["customerId"],
            "vendorToProductId": k10_data["vendorToProductId"],
            "shoppingCartId": k10_data["shoppingCartId"],
            "amount": k10_data["amount"],
        }
        start = time.time()
        response = requests.post(url, json=body)
        end = time.time()

        if response.status_code != 201:
            raise Exception("The execution of K10 was not successful!")

        return end - start
    except Exception as e:
        raise e


def k11() -> float:
    """Executes the requirement with ID K11.
    Returns:
        float: Amount of seconds needed to execute the requirement.
    """
    try:
        k11_data = customer_test_data.k11_data
        url = customer_test_data.it2_prefix + "/product/removefromcart"
        body = {
            "customerId": k11_data["customerId"],
            "vendorToProductId": k11_data["vendorToProductId"],
            "shoppingCartId": k11_data["shoppingCartId"],
            "amount": k11_data["amount"],
        }
        start = time.time()
        response = requests.post(url, json=body)
        end = time.time()

        if response.status_code != 200:
            raise Exception("The execution of K11 was not successful!")

        return end - start
    except Exception as e:
        raise e


def k12() -> float:
    """Executes the requirement with ID K12.
    Returns:
        float: Amount of seconds needed to execute the requirement.
    """
    try:
        k12_data = customer_test_data.k12_data
        url = (
            customer_test_data.it2_prefix
            + f"/courier/{str(customer_test_data.customer_id)}/{str(k12_data["id"])}"
        )
        start = time.time()
        response = requests.get(url)
        end = time.time()

        if response.status_code != 200:
            raise Exception("The execution of K12 was not successful!")

        return end - start
    except Exception as e:
        raise e


def k13() -> float:
    """Executes the requirement with ID K13.
    Returns:
        float: Amount of seconds needed to execute the requirement.
    """
    try:
        k13_data = customer_test_data.k13_data
        url = customer_test_data.it2_prefix + "/cart/makeorder"
        body = {
            "customerId": k13_data["customerId"],
            "courierCompanyId": k13_data["courierId"],
            "shoppingCartId": k13_data["cartId"],
            "billingAddressId": k13_data["billingAddressId"],
        }
        start = time.time()
        response = requests.post(url, json=body)
        end = time.time()

        if response.status_code != 201:
            raise Exception("The execution of K13 was not successful!")

        return end - start
    except Exception as e:
        raise e


def k14() -> float:
    """Executes the requirement with ID K14.
    Returns:
        float: Amount of seconds needed to execute the requirement.
    """
    try:
        k14_data = customer_test_data.k14_data
        url = (
            customer_test_data.it2_prefix
            + f"/recommended/product/{str(k14_data["id"])}"
        )
        start = time.time()
        response = requests.get(url)
        end = time.time()

        if response.status_code != 200:
            raise Exception("The execution of K14 was not successful!")

        return end - start
    except Exception as e:
        raise e


def k15() -> float:
    """Executes the requirement with ID K15.
    Returns:
        float: Amount of seconds needed to execute the requirement.
    """
    try:
        k15_data = customer_test_data.k15_data
        url = (
            customer_test_data.it2_prefix
            + f"/product/review/{str(customer_test_data.customer_id)}/{str(k15_data["id"])}"
        )
        start = time.time()
        response = requests.get(url)
        end = time.time()

        if response.status_code != 200:
            raise Exception("The execution of K15 was not successful!")

        return end - start
    except Exception as e:
        raise e


def k16() -> float:
    """Executes the requirement with ID K16.
    Returns:
        float: Amount of seconds needed to execute the requirement.
    """
    try:
        k16_data = customer_test_data.k16_data
        url = customer_test_data.it2_prefix + "/product/review/create"
        body = {
            "customerId": k16_data["customerId"],
            "vendorToProductId": k16_data["vendorToProductId"],
            "reviewText": k16_data["reviewText"],
            "rating": k16_data["rating"],
        }
        start = time.time()
        response = requests.post(url, json=body)
        end = time.time()

        if response.status_code != 201:
            raise Exception("The execution of K16 was not successful!")

        return end - start
    except Exception as e:
        raise e


def k17() -> float:
    """Executes the requirement with ID K17.
    Returns:
        float: Amount of seconds needed to execute the requirement.
    """
    try:
        k17_data = customer_test_data.k17_data
        url = (
            customer_test_data.it2_prefix
            + f"/product/review/{str(k17_data["reviewId"])}"
        )
        body = {
            "reviewId": k17_data["reviewId"],
            "customerId": k17_data["customerId"],
            "vendorToProductId": k17_data["vendorToProductId"],
            "reviewText": k17_data["reviewText"],
            "rating": k17_data["rating"],
        }
        start = time.time()
        response = requests.put(url, json=body)
        end = time.time()

        if response.status_code != 201:
            raise Exception("The execution of K17 was not successful!")

        return end - start
    except Exception as e:
        raise e


def k18() -> float:
    """Executes the requirement with ID K18.
    Returns:
        float: Amount of seconds needed to execute the requirement.
    """
    try:
        k18_data = customer_test_data.k18_data
        url = (
            customer_test_data.it2_prefix
            + f"/product/review/{str(customer_test_data.customer_id)}/{str(k18_data["id"])}"
        )
        start = time.time()
        response = requests.delete(url)
        end = time.time()

        if response.status_code != 200:
            raise Exception("The execution of K18 was not successful!")

        return end - start
    except Exception as e:
        raise e


def add_recommendations():
    """Adds some recommendations for the customer."""
    url = customer_test_data.it2_admin_prefix + "/recommendation/addrecommendation"
    body = {
        "adminId": customer_test_data.admin_id,
        "customerId": customer_test_data.customer_id,
        "vendorToProductId": 0,
        "purchaseProbability": 0.9,
    }
    response = requests.post(url, json=body)

    if response.status_code != 201:
        raise Exception("The recommendation could not be added!")

    body = {
        "adminId": customer_test_data.admin_id,
        "customerId": customer_test_data.customer_id,
        "vendorToProductId": 1,
        "purchaseProbability": 0.9,
    }
    response = requests.post(url, json=body)

    if response.status_code != 201:
        raise Exception("The recommendation could not be added!")


def revert_changes():
    """Reverts the changes made on other entities."""
    db_config = customer_test_data.db_config_it2
    neo4j_config = customer_test_data.neo4j_db_connection
    ecommerce_conn = pytds.connect(
        server=db_config["server"],
        database=db_config["database"],
        user=db_config["user"],
        password=db_config["password"],
        autocommit=True,
    )
    cursor = ecommerce_conn.cursor()
    cursor.execute(
        "UPDATE VendorToProduct SET InventoryLevel = %s WHERE VendorToProductId = %s",
        params=(200, 19999),
    )
    ecommerce_conn.close()
    driver = GraphDatabase.driver(
        neo4j_config["URI"],
        auth=(neo4j_config["Username"], neo4j_config["Password"]),
    )

    driver.execute_query(
        "MATCH (v:VendorToProduct{VendorToProductId : $vendorToProductId}) SET v.InventoryLevel = $inventoryLevel",
        vendorToProductId=19999,
        inventoryLevel=200,
    )
    driver.close()


mapping_dictionary = {
    "K1": k1,
    "K2": k2,
    "K3": k3,
    "K4": k4,
    "K5": k5,
    "K6": k6,
    "K7": k7,
    "K8": k8,
    "K9": k9,
    "K10": k10,
    "K11": k11,
    "K12": k12,
    "K13": k13,
    "K14": k14,
    "K15": k15,
    "K16": k16,
    "K17": k17,
    "K18": k18,
}
