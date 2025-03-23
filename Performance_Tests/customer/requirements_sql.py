import customer.customer_test_data
import importlib

importlib.reload(customer.customer_test_data)
from customer.customer_test_data import CustomerTestData
import pytds
import time

customer_test_data = CustomerTestData()


def k1() -> float:
    """Executes the requirement with ID K1.
    Returns:
        float: Amount of seconds needed to execute the requirement.
    """
    try:
        db_config = customer_test_data.db_config
        k1_data = customer_test_data.k1_data
        ecommerce_conn = pytds.connect(
            server=db_config["server"],
            database=db_config["database"],
            user=db_config["user"],
            password=db_config["password"],
            autocommit=True,
        )
        cursor = ecommerce_conn.cursor()
        tvp_param = pytds.TableValuedParam(
            "AddressDataType", rows=[tuple(el.values()) for el in k1_data["addresses"]]
        )
        params = (
            k1_data["userName"],
            k1_data["firstName"],
            k1_data["lastName"],
            k1_data["email"],
            k1_data["password"],
            k1_data["phoneNumber"],
            tvp_param,
        )
        start = time.time()
        cursor.execute("EXEC CreateNewCustomer %s, %s, %s, %s, %s, %s, %s", params)
        ecommerce_conn.commit()
        end = time.time()
        ecommerce_conn.close()
        return end - start
    except Exception as e:
        raise e


def k2() -> float:
    """Executes the requirement with ID K2.
    Returns:
        float: Amount of seconds needed to execute the requirement.
    """
    try:
        db_config = customer_test_data.db_config
        k2_data = customer_test_data.k2_data
        ecommerce_conn = pytds.connect(
            server=db_config["server"],
            database=db_config["database"],
            user=db_config["user"],
            password=db_config["password"],
            autocommit=True,
        )
        cursor = ecommerce_conn.cursor()
        params = (
            k2_data["id"],
            k2_data["userName"],
            k2_data["firstName"],
            k2_data["lastName"],
            k2_data["email"],
            k2_data["password"],
            k2_data["phoneNumber"],
        )
        start = time.time()
        cursor.execute("EXEC UpdateExistingCustomer %s, %s, %s, %s, %s, %s, %s", params)
        ecommerce_conn.commit()
        end = time.time()
        ecommerce_conn.close()
        return end - start
    except Exception as e:
        raise e


def k3() -> float:
    """Executes the requirement with ID K3.
    Returns:
        float: Amount of seconds needed to execute the requirement.
    """
    try:
        db_config = customer_test_data.db_config
        k3_data = customer_test_data.k3_data
        ecommerce_conn = pytds.connect(
            server=db_config["server"],
            database=db_config["database"],
            user=db_config["user"],
            password=db_config["password"],
            autocommit=True,
        )
        cursor = ecommerce_conn.cursor()
        params = (k3_data["id"],)
        start = time.time()
        cursor.execute("EXEC DeleteExistingCustomer %s", params)
        ecommerce_conn.commit()
        end = time.time()
        ecommerce_conn.close()
        return end - start
    except Exception as e:
        raise e


def k4() -> float:
    """Executes the requirement with ID K4.
    Returns:
        float: Amount of seconds needed to execute the requirement.
    """
    try:
        db_config = customer_test_data.db_config
        k4_data = customer_test_data.k4_data
        ecommerce_conn = pytds.connect(
            server=db_config["server"],
            database=db_config["database"],
            user=db_config["user"],
            password=db_config["password"],
            autocommit=True,
        )
        cursor = ecommerce_conn.cursor()
        params = (k4_data["id"],)
        start = time.time()
        cursor.execute("SELECT * FROM GetCustomerInformation(%s)", params)
        ecommerce_conn.commit()
        end = time.time()
        data = cursor.fetchall()

        if type(data) != list:
            raise Exception("Fetch operation failed!")

        ecommerce_conn.close()
        return end - start
    except Exception as e:
        raise e


def k5() -> float:
    """Executes the requirement with ID K5.
    Returns:
        float: Amount of seconds needed to execute the requirement.
    """
    try:
        db_config = customer_test_data.db_config
        k5_data = customer_test_data.k5_data
        ecommerce_conn = pytds.connect(
            server=db_config["server"],
            database=db_config["database"],
            user=db_config["user"],
            password=db_config["password"],
            autocommit=True,
        )
        cursor = ecommerce_conn.cursor()
        params = (
            k5_data["id"],
            k5_data["street"],
            k5_data["city"],
            k5_data["postalCode"],
            k5_data["country"],
        )
        start = time.time()
        cursor.execute("EXEC CreateNewCustomerAddress %s, %s, %s, %s, %s", params)
        ecommerce_conn.commit()
        end = time.time()
        ecommerce_conn.close()
        return end - start
    except Exception as e:
        raise e


def k6() -> float:
    """Executes the requirement with ID K6.
    Returns:
        float: Amount of seconds needed to execute the requirement.
    """
    try:
        db_config = customer_test_data.db_config
        k6_data = customer_test_data.k6_data
        ecommerce_conn = pytds.connect(
            server=db_config["server"],
            database=db_config["database"],
            user=db_config["user"],
            password=db_config["password"],
            autocommit=True,
        )
        cursor = ecommerce_conn.cursor()
        params = (
            k6_data["id"],
            k6_data["addressId"],
            k6_data["street"],
            k6_data["city"],
            k6_data["postalCode"],
            k6_data["country"],
        )
        start = time.time()
        cursor.execute(
            "EXEC UpdateExistingCustomerAddress %s, %s, %s, %s, %s, %s", params
        )
        ecommerce_conn.commit()
        end = time.time()
        ecommerce_conn.close()
        return end - start
    except Exception as e:
        raise e


def k7() -> float:
    """Executes the requirement with ID K7.
    Returns:
        float: Amount of seconds needed to execute the requirement.
    """
    try:
        db_config = customer_test_data.db_config
        k7_data = customer_test_data.k7_data
        ecommerce_conn = pytds.connect(
            server=db_config["server"],
            database=db_config["database"],
            user=db_config["user"],
            password=db_config["password"],
            autocommit=True,
        )
        cursor = ecommerce_conn.cursor()
        params = (k7_data["id"], k7_data["addressId"])
        start = time.time()
        cursor.execute("EXEC DeleteExistingCustomerAddress %s, %s", params)
        ecommerce_conn.commit()
        end = time.time()
        ecommerce_conn.close()
        return end - start
    except Exception as e:
        raise e


def k8() -> float:
    """Executes the requirement with ID K8.
    Returns:
        float: Amount of seconds needed to execute the requirement.
    """
    try:
        db_config = customer_test_data.db_config
        k8_data = customer_test_data.k8_data
        ecommerce_conn = pytds.connect(
            server=db_config["server"],
            database=db_config["database"],
            user=db_config["user"],
            password=db_config["password"],
            autocommit=True,
        )
        cursor = ecommerce_conn.cursor()
        params = (k8_data["id"],)
        start = time.time()
        cursor.execute("SELECT * FROM GetAddressInformation(%s)", params)
        ecommerce_conn.commit()
        end = time.time()
        data = cursor.fetchall()

        if type(data) != list:
            raise Exception("Fetch operation failed!")
        ecommerce_conn.close()
        return end - start
    except Exception as e:
        raise e


def k9() -> float:
    """Executes the requirement with ID K9.
    Returns:
        float: Amount of seconds needed to execute the requirement.
    """
    try:
        db_config = customer_test_data.db_config
        k9_data = customer_test_data.k9_data
        ecommerce_conn = pytds.connect(
            server=db_config["server"],
            database=db_config["database"],
            user=db_config["user"],
            password=db_config["password"],
            autocommit=True,
        )
        cursor = ecommerce_conn.cursor()
        params = (k9_data["id"],)
        start = time.time()
        cursor.execute("SELECT * FROM GetProductInformation(%s)", params)
        ecommerce_conn.commit()
        end = time.time()
        data = cursor.fetchall()

        if type(data) != list:
            raise Exception("Fetch operation failed!")
        ecommerce_conn.close()
        return end - start
    except Exception as e:
        raise e


def k10() -> float:
    """Executes the requirement with ID K10.
    Returns:
        float: Amount of seconds needed to execute the requirement.
    """
    try:
        db_config = customer_test_data.db_config
        k10_data = customer_test_data.k10_data
        ecommerce_conn = pytds.connect(
            server=db_config["server"],
            database=db_config["database"],
            user=db_config["user"],
            password=db_config["password"],
            autocommit=True,
        )
        cursor = ecommerce_conn.cursor()
        params = (
            k10_data["customerId"],
            k10_data["vendorToProductId"],
            k10_data["shoppingCartId"],
            k10_data["amount"],
        )
        start = time.time()
        cursor.execute("EXEC AddProductToCart %s, %s, %s, %s", params)
        ecommerce_conn.commit()
        end = time.time()
        ecommerce_conn.close()
        return end - start
    except Exception as e:
        raise e


def k11() -> float:
    """Executes the requirement with ID K11.
    Returns:
        float: Amount of seconds needed to execute the requirement.
    """
    try:
        db_config = customer_test_data.db_config
        k11_data = customer_test_data.k11_data
        ecommerce_conn = pytds.connect(
            server=db_config["server"],
            database=db_config["database"],
            user=db_config["user"],
            password=db_config["password"],
            autocommit=True,
        )
        cursor = ecommerce_conn.cursor()
        params = (
            k11_data["customerId"],
            k11_data["vendorToProductId"],
            k11_data["shoppingCartId"],
            k11_data["amount"],
        )
        start = time.time()
        cursor.execute("EXEC RemoveProductFromCart %s, %s, %s, %s", params)
        ecommerce_conn.commit()
        end = time.time()
        ecommerce_conn.close()
        return end - start
    except Exception as e:
        raise e


def k12() -> float:
    """Executes the requirement with ID K12.
    Returns:
        float: Amount of seconds needed to execute the requirement.
    """
    try:
        db_config = customer_test_data.db_config
        k12_data = customer_test_data.k12_data
        ecommerce_conn = pytds.connect(
            server=db_config["server"],
            database=db_config["database"],
            user=db_config["user"],
            password=db_config["password"],
            autocommit=True,
        )
        cursor = ecommerce_conn.cursor()
        params = (k12_data["id"],)
        start = time.time()
        cursor.execute("SELECT * FROM GetCourierInformation(%s)", params)
        ecommerce_conn.commit()
        end = time.time()
        data = cursor.fetchall()

        if type(data) != list:
            raise Exception("Fetch operation failed!")
        ecommerce_conn.close()
        return end - start
    except Exception as e:
        raise e


def k13() -> float:
    """Executes the requirement with ID K13.
    Returns:
        float: Amount of seconds needed to execute the requirement.
    """
    try:
        db_config = customer_test_data.db_config
        k13_data = customer_test_data.k13_data
        ecommerce_conn = pytds.connect(
            server=db_config["server"],
            database=db_config["database"],
            user=db_config["user"],
            password=db_config["password"],
            autocommit=True,
        )
        cursor = ecommerce_conn.cursor()
        params = (
            k13_data["customerId"],
            k13_data["cartId"],
            k13_data["billingAddressId"],
            k13_data["courierId"],
        )
        start = time.time()
        cursor.execute("EXEC MakeOrder %s, %s, %s, %s", params)
        ecommerce_conn.commit()
        end = time.time()
        ecommerce_conn.close()
        return end - start
    except Exception as e:
        raise e


def revert_changes():
    """Reverts the changes made on other entities."""
    db_config = customer_test_data.db_config
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
}
