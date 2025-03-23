import vendor.vendor_test_data
import importlib

importlib.reload(vendor.vendor_test_data)
from vendor.vendor_test_data import VendorTestData
import pytds
import time

vendor_test_data = VendorTestData()


def v1() -> float:
    """Executes the requirement with ID V1.
    Returns:
        float: Amount of seconds needed to execute the requirement.
    """
    try:
        db_config = vendor_test_data.db_config
        v1_data = vendor_test_data.v1_data
        ecommerce_conn = pytds.connect(
            server=db_config["server"],
            database=db_config["database"],
            user=db_config["user"],
            password=db_config["password"],
            autocommit=True,
        )
        cursor = ecommerce_conn.cursor()
        tvp_param = pytds.TableValuedParam(
            "AddressDataType", rows=[tuple(el.values()) for el in v1_data["addresses"]]
        )
        params = (
            v1_data["userName"],
            v1_data["name"],
            v1_data["email"],
            v1_data["password"],
            v1_data["phoneNumber"],
            tvp_param,
        )
        start = time.time()
        cursor.execute("EXEC CreateNewVendor %s, %s, %s, %s, %s, %s", params)
        ecommerce_conn.commit()
        end = time.time()
        ecommerce_conn.close()
        return end - start
    except Exception as e:
        raise e


def v2() -> float:
    """Executes the requirement with ID V2.
    Returns:
        float: Amount of seconds needed to execute the requirement.
    """
    try:
        db_config = vendor_test_data.db_config
        v2_data = vendor_test_data.v2_data
        ecommerce_conn = pytds.connect(
            server=db_config["server"],
            database=db_config["database"],
            user=db_config["user"],
            password=db_config["password"],
            autocommit=True,
        )
        cursor = ecommerce_conn.cursor()
        params = (
            v2_data["id"],
            v2_data["userName"],
            v2_data["name"],
            v2_data["email"],
            v2_data["password"],
            v2_data["phoneNumber"],
        )
        start = time.time()
        cursor.execute("EXEC UpdateExistingVendor %s, %s, %s, %s, %s, %s", params)
        ecommerce_conn.commit()
        end = time.time()
        ecommerce_conn.close()
        return end - start
    except Exception as e:
        raise e


def v3() -> float:
    """Executes the requirement with ID V3.
    Returns:
        float: Amount of seconds needed to execute the requirement.
    """
    try:
        db_config = vendor_test_data.db_config
        v3_data = vendor_test_data.v3_data
        ecommerce_conn = pytds.connect(
            server=db_config["server"],
            database=db_config["database"],
            user=db_config["user"],
            password=db_config["password"],
            autocommit=True,
        )
        cursor = ecommerce_conn.cursor()
        params = (v3_data["id"],)
        start = time.time()
        cursor.execute("EXEC DeleteExistingVendor %s", params)
        ecommerce_conn.commit()
        end = time.time()
        ecommerce_conn.close()
        return end - start
    except Exception as e:
        raise e


def v4() -> float:
    """Executes the requirement with ID V4.
    Returns:
        float: Amount of seconds needed to execute the requirement.
    """
    try:
        db_config = vendor_test_data.db_config
        v4_data = vendor_test_data.v4_data
        ecommerce_conn = pytds.connect(
            server=db_config["server"],
            database=db_config["database"],
            user=db_config["user"],
            password=db_config["password"],
            autocommit=True,
        )
        cursor = ecommerce_conn.cursor()
        params = (v4_data["id"],)
        start = time.time()
        cursor.execute("SELECT * FROM GetVendorInformation(%s)", params)
        ecommerce_conn.commit()
        end = time.time()
        data = cursor.fetchall()

        if type(data) != list:
            raise Exception("Fetch operation failed!")

        ecommerce_conn.close()
        return end - start
    except Exception as e:
        raise e


def v5() -> float:
    """Executes the requirement with ID V5.
    Returns:
        float: Amount of seconds needed to execute the requirement.
    """
    try:
        db_config = vendor_test_data.db_config
        v5_data = vendor_test_data.v5_data
        ecommerce_conn = pytds.connect(
            server=db_config["server"],
            database=db_config["database"],
            user=db_config["user"],
            password=db_config["password"],
            autocommit=True,
        )
        cursor = ecommerce_conn.cursor()
        params = (
            v5_data["id"],
            v5_data["street"],
            v5_data["city"],
            v5_data["postalCode"],
            v5_data["country"],
        )
        start = time.time()
        cursor.execute("EXEC CreateNewVendorAddress %s, %s, %s, %s, %s", params)
        ecommerce_conn.commit()
        end = time.time()
        ecommerce_conn.close()
        return end - start
    except Exception as e:
        raise e


def v6() -> float:
    """Executes the requirement with ID V6.
    Returns:
        float: Amount of seconds needed to execute the requirement.
    """
    try:
        db_config = vendor_test_data.db_config
        v6_data = vendor_test_data.v6_data
        ecommerce_conn = pytds.connect(
            server=db_config["server"],
            database=db_config["database"],
            user=db_config["user"],
            password=db_config["password"],
            autocommit=True,
        )
        cursor = ecommerce_conn.cursor()
        params = (
            v6_data["id"],
            v6_data["addressId"],
            v6_data["street"],
            v6_data["city"],
            v6_data["postalCode"],
            v6_data["country"],
        )
        start = time.time()
        cursor.execute(
            "EXEC UpdateExistingVendorAddress %s, %s, %s, %s, %s, %s", params
        )
        ecommerce_conn.commit()
        end = time.time()
        ecommerce_conn.close()
        return end - start
    except Exception as e:
        raise e


def v7() -> float:
    """Executes the requirement with ID V7.
    Returns:
        float: Amount of seconds needed to execute the requirement.
    """
    try:
        db_config = vendor_test_data.db_config
        v7_data = vendor_test_data.v7_data
        ecommerce_conn = pytds.connect(
            server=db_config["server"],
            database=db_config["database"],
            user=db_config["user"],
            password=db_config["password"],
            autocommit=True,
        )
        cursor = ecommerce_conn.cursor()
        params = (v7_data["id"], v7_data["addressId"])
        start = time.time()
        cursor.execute("EXEC DeleteExistingVendorAddress %s, %s", params)
        ecommerce_conn.commit()
        end = time.time()
        ecommerce_conn.close()
        return end - start
    except Exception as e:
        raise e


def v8() -> float:
    """Executes the requirement with ID V8.
    Returns:
        float: Amount of seconds needed to execute the requirement.
    """
    try:
        db_config = vendor_test_data.db_config
        v8_data = vendor_test_data.v8_data
        ecommerce_conn = pytds.connect(
            server=db_config["server"],
            database=db_config["database"],
            user=db_config["user"],
            password=db_config["password"],
            autocommit=True,
        )
        cursor = ecommerce_conn.cursor()
        params = (v8_data["id"],)
        start = time.time()
        cursor.execute("SELECT * FROM GetVendorAddressInformation(%s)", params)
        ecommerce_conn.commit()
        end = time.time()
        data = cursor.fetchall()

        if type(data) != list:
            raise Exception("Fetch operation failed!")
        ecommerce_conn.close()
        return end - start
    except Exception as e:
        raise e


def v9() -> float:
    """Executes the requirement with ID V9.
    Returns:
        float: Amount of seconds needed to execute the requirement.
    """
    try:
        db_config = vendor_test_data.db_config
        v9_data = vendor_test_data.v9_data
        ecommerce_conn = pytds.connect(
            server=db_config["server"],
            database=db_config["database"],
            user=db_config["user"],
            password=db_config["password"],
            autocommit=True,
        )
        cursor = ecommerce_conn.cursor()
        tvp_param = pytds.TableValuedParam(
            "CategoryDataType",
            rows=[tuple(el.values()) for el in v9_data["categories"]],
        )
        params = (
            v9_data["vendorId"],
            v9_data["unitPriceEuro"],
            v9_data["inventoryLevel"],
            v9_data["name"],
            v9_data["description"],
            tvp_param,
        )
        start = time.time()
        cursor.execute("EXEC CreateNewVendorProduct %s, %s, %s, %s, %s, %s", params)
        ecommerce_conn.commit()
        end = time.time()
        ecommerce_conn.close()
        return end - start
    except Exception as e:
        raise e


def v10() -> float:
    """Executes the requirement with ID V10.
    Returns:
        float: Amount of seconds needed to execute the requirement.
    """
    try:
        db_config = vendor_test_data.db_config
        v10_data = vendor_test_data.v10_data
        ecommerce_conn = pytds.connect(
            server=db_config["server"],
            database=db_config["database"],
            user=db_config["user"],
            password=db_config["password"],
            autocommit=True,
        )
        cursor = ecommerce_conn.cursor()
        params = (
            v10_data["vendorId"],
            v10_data["vendorToProductId"],
            v10_data["unitPriceEuro"],
            v10_data["inventoryLevel"],
            v10_data["name"],
            v10_data["description"],
        )
        start = time.time()
        cursor.execute(
            "EXEC UpdateExistingVendorProduct %s, %s, %s, %s, %s, %s", params
        )
        ecommerce_conn.commit()
        end = time.time()
        ecommerce_conn.close()
        return end - start
    except Exception as e:
        raise e


def v11() -> float:
    """Executes the requirement with ID V11.
    Returns:
        float: Amount of seconds needed to execute the requirement.
    """
    try:
        db_config = vendor_test_data.db_config
        v11_data = vendor_test_data.v11_data
        ecommerce_conn = pytds.connect(
            server=db_config["server"],
            database=db_config["database"],
            user=db_config["user"],
            password=db_config["password"],
            autocommit=True,
        )
        cursor = ecommerce_conn.cursor()
        params = (v11_data["id"],)
        start = time.time()
        cursor.execute("EXEC RemoveExistingVendorProduct %s", params)
        ecommerce_conn.commit()
        end = time.time()
        ecommerce_conn.close()
        return end - start
    except Exception as e:
        raise e


def v12() -> float:
    """Executes the requirement with ID V12.
    Returns:
        float: Amount of seconds needed to execute the requirement.
    """
    try:
        db_config = vendor_test_data.db_config
        v12_data = vendor_test_data.v12_data
        ecommerce_conn = pytds.connect(
            server=db_config["server"],
            database=db_config["database"],
            user=db_config["user"],
            password=db_config["password"],
            autocommit=True,
        )
        cursor = ecommerce_conn.cursor()
        params = (v12_data["id"],)
        start = time.time()
        cursor.execute("SELECT * FROM GetVendorProductsInformation(%s)", params)
        ecommerce_conn.commit()
        end = time.time()
        data = cursor.fetchall()

        if type(data) != list:
            raise Exception("Fetch operation failed!")
        ecommerce_conn.close()
        return end - start
    except Exception as e:
        raise e


def v13() -> float:
    """Executes the requirement with ID V13.
    Returns:
        float: Amount of seconds needed to execute the requirement.
    """
    try:
        db_config = vendor_test_data.db_config
        v13_data = vendor_test_data.v13_data
        ecommerce_conn = pytds.connect(
            server=db_config["server"],
            database=db_config["database"],
            user=db_config["user"],
            password=db_config["password"],
            autocommit=True,
        )
        cursor = ecommerce_conn.cursor()
        params = (
            v13_data["vendorId"],
            v13_data["vendorToProductId"],
            v13_data["categoryId"],
        )
        start = time.time()
        cursor.execute("EXEC AddProductCategory %s, %s, %s", params)
        ecommerce_conn.commit()
        end = time.time()
        ecommerce_conn.close()
        return end - start
    except Exception as e:
        raise e


def v14() -> float:
    """Executes the requirement with ID V14.
    Returns:
        float: Amount of seconds needed to execute the requirement.
    """
    try:
        db_config = vendor_test_data.db_config
        v14_data = vendor_test_data.v14_data
        ecommerce_conn = pytds.connect(
            server=db_config["server"],
            database=db_config["database"],
            user=db_config["user"],
            password=db_config["password"],
            autocommit=True,
        )
        cursor = ecommerce_conn.cursor()
        params = (
            v14_data["vendorId"],
            v14_data["vendorToProductId"],
            v14_data["categoryId"],
        )
        start = time.time()
        cursor.execute("EXEC RemoveProductCategory %s, %s, %s", params)
        ecommerce_conn.commit()
        end = time.time()
        ecommerce_conn.close()
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
