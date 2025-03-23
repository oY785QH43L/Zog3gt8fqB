import admin.admin_test_data
import importlib

importlib.reload(admin.admin_test_data)
from admin.admin_test_data import AdminTestData
import pytds
import time

admin_test_data = AdminTestData()


def a1() -> float:
    """Executes the requirement with ID A1.
    Returns:
        float: Amount of seconds needed to execute the requirement.
    """
    try:
        db_config = admin_test_data.db_config
        a1_data = admin_test_data.a1_data
        ecommerce_conn = pytds.connect(
            server=db_config["server"],
            database=db_config["database"],
            user=db_config["user"],
            password=db_config["password"],
            autocommit=True,
        )
        cursor = ecommerce_conn.cursor()
        tvp_param = pytds.TableValuedParam(
            "AddressDataType", rows=[tuple(el.values()) for el in a1_data["addresses"]]
        )
        params = (a1_data["name"], a1_data["email"], a1_data["phoneNumber"], tvp_param)
        start = time.time()
        cursor.execute("EXEC CreateNewCourier %s, %s, %s, %s", params)
        ecommerce_conn.commit()
        end = time.time()
        ecommerce_conn.close()
        return end - start
    except Exception as e:
        raise e


def a2() -> float:
    """Executes the requirement with ID A2.
    Returns:
        float: Amount of seconds needed to execute the requirement.
    """
    try:
        db_config = admin_test_data.db_config
        a2_data = admin_test_data.a2_data
        ecommerce_conn = pytds.connect(
            server=db_config["server"],
            database=db_config["database"],
            user=db_config["user"],
            password=db_config["password"],
            autocommit=True,
        )
        cursor = ecommerce_conn.cursor()
        params = (
            a2_data["id"],
            a2_data["name"],
            a2_data["email"],
            a2_data["phoneNumber"],
        )
        start = time.time()
        cursor.execute("EXEC UpdateExistingCourier %s, %s, %s, %s", params)
        ecommerce_conn.commit()
        end = time.time()
        ecommerce_conn.close()
        return end - start
    except Exception as e:
        raise e


def a3() -> float:
    """Executes the requirement with ID A3.
    Returns:
        float: Amount of seconds needed to execute the requirement.
    """
    try:
        db_config = admin_test_data.db_config
        a3_data = admin_test_data.a3_data
        ecommerce_conn = pytds.connect(
            server=db_config["server"],
            database=db_config["database"],
            user=db_config["user"],
            password=db_config["password"],
            autocommit=True,
        )
        cursor = ecommerce_conn.cursor()
        params = (a3_data["id"],)
        start = time.time()
        cursor.execute("EXEC DeleteExistingCourier %s", params)
        ecommerce_conn.commit()
        end = time.time()
        ecommerce_conn.close()
        return end - start
    except Exception as e:
        raise e


def a4() -> float:
    """Executes the requirement with ID A4.
    Returns:
        float: Amount of seconds needed to execute the requirement.
    """
    try:
        db_config = admin_test_data.db_config
        a4_data = admin_test_data.a4_data
        ecommerce_conn = pytds.connect(
            server=db_config["server"],
            database=db_config["database"],
            user=db_config["user"],
            password=db_config["password"],
            autocommit=True,
        )
        cursor = ecommerce_conn.cursor()
        params = (
            a4_data["id"],
            a4_data["street"],
            a4_data["city"],
            a4_data["postalCode"],
            a4_data["country"],
        )
        start = time.time()
        cursor.execute("EXEC CreateNewCourierAddress %s, %s, %s, %s, %s", params)
        ecommerce_conn.commit()
        end = time.time()
        ecommerce_conn.close()
        return end - start
    except Exception as e:
        raise e


def a5() -> float:
    """Executes the requirement with ID A5.
    Returns:
        float: Amount of seconds needed to execute the requirement.
    """
    try:
        db_config = admin_test_data.db_config
        a5_data = admin_test_data.a5_data
        ecommerce_conn = pytds.connect(
            server=db_config["server"],
            database=db_config["database"],
            user=db_config["user"],
            password=db_config["password"],
            autocommit=True,
        )
        cursor = ecommerce_conn.cursor()
        params = (
            a5_data["id"],
            a5_data["addressId"],
            a5_data["street"],
            a5_data["city"],
            a5_data["postalCode"],
            a5_data["country"],
        )
        start = time.time()
        cursor.execute(
            "EXEC UpdateExistingCourierAddress %s, %s, %s, %s, %s, %s", params
        )
        ecommerce_conn.commit()
        end = time.time()
        ecommerce_conn.close()
        return end - start
    except Exception as e:
        raise e


def a6() -> float:
    """Executes the requirement with ID A6.
    Returns:
        float: Amount of seconds needed to execute the requirement.
    """
    try:
        db_config = admin_test_data.db_config
        a6_data = admin_test_data.a6_data
        ecommerce_conn = pytds.connect(
            server=db_config["server"],
            database=db_config["database"],
            user=db_config["user"],
            password=db_config["password"],
            autocommit=True,
        )
        cursor = ecommerce_conn.cursor()
        params = (a6_data["id"], a6_data["addressId"])
        start = time.time()
        cursor.execute("EXEC DeleteExistingCourierAddress %s, %s", params)
        ecommerce_conn.commit()
        end = time.time()
        ecommerce_conn.close()
        return end - start
    except Exception as e:
        raise e


def a7() -> float:
    """Executes the requirement with ID A7.
    Returns:
        float: Amount of seconds needed to execute the requirement.
    """
    try:
        db_config = admin_test_data.db_config
        a7_data = admin_test_data.a7_data
        ecommerce_conn = pytds.connect(
            server=db_config["server"],
            database=db_config["database"],
            user=db_config["user"],
            password=db_config["password"],
            autocommit=True,
        )
        cursor = ecommerce_conn.cursor()
        params = (a7_data["name"],)
        start = time.time()
        cursor.execute("EXEC CreateCategory %s", params)
        ecommerce_conn.commit()
        end = time.time()
        ecommerce_conn.close()
        return end - start
    except Exception as e:
        raise e


def a8() -> float:
    """Executes the requirement with ID A8.
    Returns:
        float: Amount of seconds needed to execute the requirement.
    """
    try:
        db_config = admin_test_data.db_config
        a8_data = admin_test_data.a8_data
        ecommerce_conn = pytds.connect(
            server=db_config["server"],
            database=db_config["database"],
            user=db_config["user"],
            password=db_config["password"],
            autocommit=True,
        )
        cursor = ecommerce_conn.cursor()
        params = (a8_data["id"], a8_data["name"])
        start = time.time()
        cursor.execute("EXEC UpdateCategory %s, %s", params)
        ecommerce_conn.commit()
        end = time.time()
        ecommerce_conn.close()
        return end - start
    except Exception as e:
        raise e


def a9() -> float:
    """Executes the requirement with ID A9.
    Returns:
        float: Amount of seconds needed to execute the requirement.
    """
    try:
        db_config = admin_test_data.db_config
        a9_data = admin_test_data.a9_data
        ecommerce_conn = pytds.connect(
            server=db_config["server"],
            database=db_config["database"],
            user=db_config["user"],
            password=db_config["password"],
            autocommit=True,
        )
        cursor = ecommerce_conn.cursor()
        params = (a9_data["id"],)
        start = time.time()
        cursor.execute("EXEC DeleteCategory %s", params)
        ecommerce_conn.commit()
        end = time.time()
        ecommerce_conn.close()
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
}
