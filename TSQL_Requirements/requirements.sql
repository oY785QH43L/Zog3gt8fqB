-- Types
CREATE TYPE AddressDataType AS TABLE
(
   Street VARCHAR(100),
   City VARCHAR(100),
   PostalCode VARCHAR(10),
   Country VARCHAR(20)
);
GO

CREATE TYPE CategoryDataType AS TABLE
(
	CategoryId INT
);
GO

-- Helper views
CREATE OR ALTER VIEW CustomerInformation
AS
SELECT c.CustomerId, c.UserName, c.FirstName, c.LastName, c.Email, c.PhoneNumber, 
a.AddressId, a.Street, a.City, a.PostalCode, a.Country FROM Customer c 
LEFT OUTER JOIN CustomerToAddress ca 
ON c.CustomerId = ca.CustomerId 
LEFT OUTER JOIN Address a
ON ca.AddressId = a.AddressId 
GO

CREATE OR ALTER VIEW ProductInformation
AS
SELECT p.ProductId, p.Name as "ProductName", p.Description, c.CategoryId, c.Name as "CategoryName" FROM Product p
LEFT OUTER JOIN ProductToCategory pc
ON p.ProductId = pc.ProductId
LEFT OUTER JOIN Category c
ON c.CategoryId = pc.CategoryId
GO

CREATE OR ALTER VIEW VendorInformation
AS
SELECT v.VendorId, v.UserName, v.Name, v.Email, v.PhoneNumber,
a.AddressId, a.Street, a.City, a.PostalCode, a.Country FROM Vendor v
LEFT OUTER JOIN VendorToAddress va 
ON v.VendorId = va.VendorId 
LEFT OUTER JOIN Address a
ON va.AddressId = a.AddressId 
GO

CREATE OR ALTER VIEW CourierInformation
AS
SELECT s.CourierId, s.Name, s.Email, s.PhoneNumber,
a.AddressId, a.Street, a.City, a.PostalCode, a.Country FROM Courier s
LEFT OUTER JOIN CourierToAddress sa 
ON s.CourierId = sa.CourierId 
LEFT OUTER JOIN Address a
ON sa.AddressId = a.AddressId 
GO

-- Helper producedures
CREATE OR ALTER PROCEDURE AddCourierAddressReference
@courierId INT,
@addressId INT
AS
BEGIN
  	BEGIN TRY 
		BEGIN TRANSACTION;
		-- Check for existing reference
		DECLARE @referenceCount INT = 0;
		SELECT @referenceCount = COUNT(*) FROM CourierToAddress
		WHERE AddressId = @addressId AND CourierId = @courierId;

		IF @referenceCount > 0
		BEGIN
			  THROW 51000, 'The address reference already exists!', 1;
		END

		-- Insert the reference
		DECLARE @newId INT  = 0;
		SELECT @newId = MAX(CourierToAddressId) + 1 FROM CourierToAddress;
		INSERT INTO CourierToAddress(CourierToAddressId, CourierId, AddressId)
		VALUES (@newId, @courierId, @addressId);
		COMMIT;
	END TRY  
	BEGIN CATCH  
	   PRINT 'An error occurred.'; 
	   ROLLBACK;
	   THROW
	END CATCH;
END
GO

CREATE OR ALTER PROCEDURE AddCustomerAddressReference
@customerId INT,
@addressId INT
AS
BEGIN
  	BEGIN TRY 
		BEGIN TRANSACTION;
		-- Check for existing reference
		DECLARE @referenceCount INT = 0;
		SELECT @referenceCount = COUNT(*) FROM CustomerToAddress
		WHERE AddressId = @addressId AND CustomerId = @customerId;

		IF @referenceCount > 0
		BEGIN
			  THROW 51000, 'The address reference already exists!', 1;
		END

		-- Insert the reference
		DECLARE @newId INT  = 0;
		SELECT @newId = MAX(CustomerToAddressId) + 1 FROM CustomerToAddress;
		INSERT INTO CustomerToAddress(CustomerToAddressId, CustomerId, AddressId)
		VALUES (@newId, @customerId, @addressId);
		COMMIT;
	END TRY  
	BEGIN CATCH  
	   PRINT 'An error occurred.'; 
	   ROLLBACK;
	   THROW
	END CATCH;
END
GO

CREATE OR ALTER PROCEDURE AddVendorAddressReference
@vendorId INT,
@addressId INT
AS
BEGIN
  	BEGIN TRY 
		BEGIN TRANSACTION;
		-- Check for existing reference
		DECLARE @referenceCount INT = 0;
		SELECT @referenceCount = COUNT(*) FROM VendorToAddress
		WHERE AddressId = @addressId AND VendorId = @vendorId;

		IF @referenceCount > 0
		BEGIN
			  THROW 51000, 'The address reference already exists!', 1;
		END

		-- Insert the reference
		DECLARE @newId INT  = 0;
		SELECT @newId = MAX(VendorToAddressId) + 1 FROM VendorToAddress;
		INSERT INTO VendorToAddress(VendorToAddressId, VendorId, AddressId)
		VALUES (@newId, @vendorId, @addressId);
		COMMIT;
	END TRY  
	BEGIN CATCH  
	   PRINT 'An error occurred.'; 
	   ROLLBACK;
	   THROW
	END CATCH;
END
GO

CREATE OR ALTER PROCEDURE AddCourierAddress
@courierId INT,
@addressId INT,
@street VARCHAR(100),
@city VARCHAR(100),
@postalCode VARCHAR(10),
@country VARCHAR(20)
AS
BEGIN
  	BEGIN TRY 
	  BEGIN TRANSACTION;
	  -- Check for existing address
	  DECLARE @existingAddresses TABLE(AddressId INT);
	  INSERT INTO @existingAddresses
	  SELECT AddressId FROM Address WHERE
	  Street = @street AND City = @city AND PostalCode = @postalCode 
	  AND Country = @country;
	  DECLARE @addressCount INT = 0;
	  SELECT @addressCount = COUNT(*) FROM @existingAddresses;

	  -- Create reference if the address exists
	  IF @addressCount > 0
	  BEGIN
	     DECLARE @existingAddressId INT = 0;
		 SELECT @existingAddressId = AddressId FROM @existingAddresses;
		 EXEC AddCourierAddressReference @courierId, @existingAddressId;
		 COMMIT;
		 RETURN 0;
	  END

	  -- Create new address
	  INSERT INTO Address(AddressId, Street, City, PostalCode, Country)
	  VALUES (@addressId, @street, @city, @postalCode, @country);
	  EXEC AddCourierAddressReference @courierId, @addressId;
	  COMMIT;
	  RETURN 0;
	END TRY  
	BEGIN CATCH  
	   PRINT 'An error occurred.'; 
	   ROLLBACK;
	   THROW
	END CATCH;
END
GO

CREATE OR ALTER PROCEDURE AddCustomerAddress
@customerId INT,
@addressId INT,
@street VARCHAR(100),
@city VARCHAR(100),
@postalCode VARCHAR(10),
@country VARCHAR(20)
AS
BEGIN
  	BEGIN TRY 
	  BEGIN TRANSACTION;
	  -- Check for existing address
	  DECLARE @existingAddresses TABLE(AddressId INT);
	  INSERT INTO @existingAddresses
	  SELECT AddressId FROM Address WHERE
	  Street = @street AND City = @city AND PostalCode = @postalCode 
	  AND Country = @country;
	  DECLARE @addressCount INT = 0;
	  SELECT @addressCount = COUNT(*) FROM @existingAddresses;

	  -- Create reference if the address exists
	  IF @addressCount > 0
	  BEGIN
	     DECLARE @existingAddressId INT = 0;
		 SELECT @existingAddressId = AddressId FROM @existingAddresses;
		 EXEC AddCustomerAddressReference @customerId, @existingAddressId;
		 COMMIT;
		 RETURN 0;
	  END

	  -- Create new address
	  INSERT INTO Address(AddressId, Street, City, PostalCode, Country)
	  VALUES (@addressId, @street, @city, @postalCode, @country);
	  EXEC AddCustomerAddressReference @customerId, @addressId;
	  COMMIT;
	  RETURN 0;
	END TRY  
	BEGIN CATCH  
	   PRINT 'An error occurred.'; 
	   ROLLBACK;
	   THROW
	END CATCH;
END
GO

CREATE OR ALTER PROCEDURE AddVendorAddress
@vendorId INT,
@addressId INT,
@street VARCHAR(100),
@city VARCHAR(100),
@postalCode VARCHAR(10),
@country VARCHAR(20)
AS
BEGIN
  	BEGIN TRY 
	  BEGIN TRANSACTION;
	  -- Check for existing address
	  DECLARE @existingAddresses TABLE(AddressId INT);
	  INSERT INTO @existingAddresses
	  SELECT AddressId FROM Address WHERE
	  Street = @street AND City = @city AND PostalCode = @postalCode 
	  AND Country = @country;
	  DECLARE @addressCount INT = 0;
	  SELECT @addressCount = COUNT(*) FROM @existingAddresses;

	  -- Create reference if the address exists
	  IF @addressCount > 0
	  BEGIN
	     DECLARE @existingAddressId INT = 0;
		 SELECT @existingAddressId = AddressId FROM @existingAddresses;
		 EXEC AddVendorAddressReference @vendorId, @existingAddressId;
		 COMMIT;
		 RETURN 0;
	  END

	  -- Create new address
	  INSERT INTO Address(AddressId, Street, City, PostalCode, Country)
	  VALUES (@addressId, @street, @city, @postalCode, @country);
	  EXEC AddVendorAddressReference @vendorId, @addressId;
	  COMMIT;
	  RETURN 0;
	END TRY  
	BEGIN CATCH  
	   PRINT 'An error occurred.'; 
	   ROLLBACK;
	   THROW
	END CATCH;
END
GO

CREATE OR ALTER PROCEDURE AddCourierAddresses
@courierId INT,
@addresses AddressDataType READONLY
AS
BEGIN
	BEGIN TRY 
		BEGIN TRANSACTION;
		DECLARE @addressId INT, @street VARCHAR(100), @city VARCHAR(100), 
		@postalCode VARCHAR(10), @country VARCHAR(20);
		DECLARE addressValueCursor CURSOR FOR
		SELECT Street, City, PostalCode, Country FROM @addresses;

		-- Iteratively fetch and insert values
		OPEN addressValueCursor;

		FETCH NEXT FROM addressValueCursor INTO 
		@street, @city, @postalCode, @country;

		WHILE @@FETCH_STATUS = 0
		BEGIN
			SELECT  @addressId = MAX(AddressId) + 1 FROM Address;
			EXEC AddCourierAddress @courierId, @addressId, @street, @city, @postalCode, @country;
			FETCH NEXT FROM addressValueCursor INTO 
			@street, @city, @postalCode, @country;
		END

		CLOSE addressValueCursor;
		DEALLOCATE addressValueCursor;
		COMMIT;
		RETURN 0;
	END TRY  
	BEGIN CATCH  
		PRINT 'An error occurred.'; 
		ROLLBACK;
		THROW
	END CATCH;
END
GO

CREATE OR ALTER PROCEDURE AddCustomerAddresses
@customerId INT,
@addresses AddressDataType READONLY
AS
BEGIN
	BEGIN TRY 
		BEGIN TRANSACTION;
		DECLARE @addressId INT, @street VARCHAR(100), @city VARCHAR(100), 
		@postalCode VARCHAR(10), @country VARCHAR(20);
		DECLARE addressValueCursor CURSOR FOR
		SELECT Street, City, PostalCode, Country FROM @addresses;

		-- Iteratively fetch and insert values
		OPEN addressValueCursor;

		FETCH NEXT FROM addressValueCursor INTO 
		@street, @city, @postalCode, @country;

		WHILE @@FETCH_STATUS = 0
		BEGIN
			SELECT  @addressId = MAX(AddressId) + 1 FROM Address;
			EXEC AddCustomerAddress @customerId, @addressId, @street, @city, @postalCode, @country;
			FETCH NEXT FROM addressValueCursor INTO 
			@street, @city, @postalCode, @country;
		END

		CLOSE addressValueCursor;
		DEALLOCATE addressValueCursor;
		COMMIT;
		RETURN 0;
	END TRY  
	BEGIN CATCH  
		PRINT 'An error occurred.'; 
		ROLLBACK;
		THROW
	END CATCH;
END
GO

CREATE OR ALTER PROCEDURE AddVendorAddresses
@vendorId INT,
@addresses AddressDataType READONLY
AS
BEGIN
	BEGIN TRY 
		BEGIN TRANSACTION;
		DECLARE @addressId INT, @street VARCHAR(100), @city VARCHAR(100), 
		@postalCode VARCHAR(10), @country VARCHAR(20);
		DECLARE addressValueCursor CURSOR FOR
		SELECT Street, City, PostalCode, Country FROM @addresses;

		-- Iteratively fetch and insert values
		OPEN addressValueCursor;

		FETCH NEXT FROM addressValueCursor INTO 
		@street, @city, @postalCode, @country;

		WHILE @@FETCH_STATUS = 0
		BEGIN
			SELECT  @addressId = MAX(AddressId) + 1 FROM Address;
			EXEC AddVendorAddress @vendorId, @addressId, @street, @city, @postalCode, @country;
			FETCH NEXT FROM addressValueCursor INTO 
			@street, @city, @postalCode, @country;
		END

		CLOSE addressValueCursor;
		DEALLOCATE addressValueCursor;
		COMMIT;
		RETURN 0;
	END TRY  
	BEGIN CATCH  
		PRINT 'An error occurred.'; 
		ROLLBACK;
		THROW
	END CATCH;
END
GO

CREATE OR ALTER PROCEDURE DeleteCourierAddress
@courierId INT,
@addressId INT
AS
BEGIN
	BEGIN TRY 
		BEGIN TRANSACTION;
		DECLARE @customerToAddressCount INT, @vendorToAddressCount INT, @courierToAddressCount INT,
		@orderPositionCount INT, @customerOrderCount INT;

		-- Delete courier to address
		DELETE FROM CourierToAddress WHERE CourierId = @courierId AND AddressId = @addressId;

		-- Leave if referenced by other relations
		-- By CustomerToAddress
		SELECT @customerToAddressCount = COUNT(*) FROM CustomerToAddress WHERE AddressId = @addressId;

		IF @customerToAddressCount > 0
		BEGIN
			COMMIT;
			RETURN 0;
		END

		-- By VendorToAddress
		SELECT @vendorToAddressCount = COUNT(*) FROM VendorToAddress WHERE AddressId = @addressId;

		IF @vendorToAddressCount > 0
		BEGIN
			COMMIT;
			RETURN 0;
		END

		-- By CourierToAddress
		SELECT @courierToAddressCount = COUNT(*) FROM CourierToAddress WHERE AddressId = @addressId;

		IF @courierToAddressCount > 0
		BEGIN
			COMMIT;
			RETURN 0;
		END

		-- By OrderPosition
		SELECT @orderPositionCount = COUNT(*) FROM OrderPosition WHERE DeliveryAddressId = @addressId;

		IF @orderPositionCount > 0
		BEGIN
			COMMIT;
			RETURN 0;
		END

		-- By CustomerOrder
		SELECT @customerOrderCount = COUNT(*) FROM CustomerOrder WHERE BillingAddressId = @addressId;

		IF @customerOrderCount > 0
		BEGIN
			COMMIT;
			RETURN 0;
		END

		-- Delete the address
		DELETE FROM Address WHERE AddressId = @addressId;
		COMMIT;
		RETURN 0;
	END TRY  
	BEGIN CATCH  
		PRINT 'An error occurred.'; 
		ROLLBACK;
		THROW
	END CATCH;
END
GO

CREATE OR ALTER PROCEDURE DeleteCustomerAddress
@customerId INT,
@addressId INT
AS
BEGIN
	BEGIN TRY 
		BEGIN TRANSACTION;
		DECLARE @customerToAddressCount INT, @vendorToAddressCount INT, @courierToAddressCount INT,
		@orderPositionCount INT, @customerOrderCount INT;

		-- Delete customer to address
		DELETE FROM CustomerToAddress WHERE CustomerId = @customerId AND AddressId = @addressId;

		-- Leave if referenced by other relations
		-- By CustomerToAddress
		SELECT @customerToAddressCount = COUNT(*) FROM CustomerToAddress WHERE AddressId = @addressId;

		IF @customerToAddressCount > 0
		BEGIN
			COMMIT;
			RETURN 0;
		END

		-- By VendorToAddress
		SELECT @vendorToAddressCount = COUNT(*) FROM VendorToAddress WHERE AddressId = @addressId;

		IF @vendorToAddressCount > 0
		BEGIN
			COMMIT;
			RETURN 0;
		END

		-- By CourierToAddress
		SELECT @courierToAddressCount = COUNT(*) FROM CourierToAddress WHERE AddressId = @addressId;

		IF @courierToAddressCount > 0
		BEGIN
			COMMIT;
			RETURN 0;
		END

		-- By OrderPosition
		SELECT @orderPositionCount = COUNT(*) FROM OrderPosition WHERE DeliveryAddressId = @addressId;

		IF @orderPositionCount > 0
		BEGIN
			COMMIT;
			RETURN 0;
		END

		-- By CustomerOrder
		SELECT @customerOrderCount = COUNT(*) FROM CustomerOrder WHERE BillingAddressId = @addressId;

		IF @customerOrderCount > 0
		BEGIN
			COMMIT;
			RETURN 0;
		END

		-- Delete the address
		DELETE FROM Address WHERE AddressId = @addressId;
		COMMIT;
		RETURN 0;
	END TRY  
	BEGIN CATCH  
		PRINT 'An error occurred.'; 
		ROLLBACK;
		THROW
	END CATCH;
END
GO

CREATE OR ALTER PROCEDURE DeleteVendorAddress
@vendorId INT,
@addressId INT
AS
BEGIN
	BEGIN TRY 
		BEGIN TRANSACTION;
		DECLARE @customerToAddressCount INT, @vendorToAddressCount INT, @courierToAddressCount INT,
		@orderPositionCount INT, @customerOrderCount INT;

		-- Delete vendor to address
		DELETE FROM VendorToAddress WHERE VendorId = @vendorId AND AddressId = @addressId;

		-- Leave if referenced by other relations
		-- By CustomerToAddress
		SELECT @customerToAddressCount = COUNT(*) FROM CustomerToAddress WHERE AddressId = @addressId;

		IF @customerToAddressCount > 0
		BEGIN
			COMMIT;
			RETURN 0;
		END

		-- By VendorToAddress
		SELECT @vendorToAddressCount = COUNT(*) FROM VendorToAddress WHERE AddressId = @addressId;

		IF @vendorToAddressCount > 0
		BEGIN
			COMMIT;
			RETURN 0;
		END

		-- By CourierToAddress
		SELECT @courierToAddressCount = COUNT(*) FROM CourierToAddress WHERE AddressId = @addressId;

		IF @courierToAddressCount > 0
		BEGIN
			COMMIT;
			RETURN 0;
		END

		-- By OrderPosition
		SELECT @orderPositionCount = COUNT(*) FROM OrderPosition WHERE DeliveryAddressId = @addressId;

		IF @orderPositionCount > 0
		BEGIN
			COMMIT;
			RETURN 0;
		END

		-- By CustomerOrder
		SELECT @customerOrderCount = COUNT(*) FROM CustomerOrder WHERE BillingAddressId = @addressId;

		IF @customerOrderCount > 0
		BEGIN
			COMMIT;
			RETURN 0;
		END

		-- Delete the address
		DELETE FROM Address WHERE AddressId = @addressId;
		COMMIT;
		RETURN 0;
	END TRY  
	BEGIN CATCH  
		PRINT 'An error occurred.'; 
		ROLLBACK;
		THROW
	END CATCH;
END
GO

CREATE OR ALTER PROCEDURE DeleteCourierAddresses
@courierId INT
AS
BEGIN
	BEGIN TRY 
		BEGIN TRANSACTION;
		DECLARE @addressId INT;
		DECLARE courierAddressCursor CURSOR FOR
		SELECT AddressId FROM CourierToAddress WHERE CourierId = @courierId;

		-- Iteratively fetch and delete values
		OPEN courierAddressCursor;

		FETCH NEXT FROM courierAddressCursor INTO 
		@addressId;

		WHILE @@FETCH_STATUS = 0
		BEGIN
			EXEC DeleteCourierAddress @courierId, @addressId;
			FETCH NEXT FROM courierAddressCursor INTO 
			@addressId;
		END

		CLOSE courierAddressCursor;
		DEALLOCATE courierAddressCursor;
		COMMIT;
		RETURN 0;
	END TRY  
	BEGIN CATCH  
		PRINT 'An error occurred.'; 
		ROLLBACK;
		THROW
	END CATCH;
END
GO

CREATE OR ALTER PROCEDURE DeleteCustomerAddresses
@customerId INT
AS
BEGIN
	BEGIN TRY 
		BEGIN TRANSACTION;
		DECLARE @addressId INT;
		DECLARE customerAddressCursor CURSOR FOR
		SELECT AddressId FROM CustomerToAddress WHERE CustomerId = @customerId;

		-- Iteratively fetch and delete values
		OPEN customerAddressCursor;

		FETCH NEXT FROM customerAddressCursor INTO 
		@addressId;

		WHILE @@FETCH_STATUS = 0
		BEGIN
			EXEC DeleteCustomerAddress @customerId, @addressId;
			FETCH NEXT FROM customerAddressCursor INTO 
			@addressId;
		END

		CLOSE customerAddressCursor;
		DEALLOCATE customerAddressCursor;
		COMMIT;
		RETURN 0;
	END TRY  
	BEGIN CATCH  
		PRINT 'An error occurred.'; 
		ROLLBACK;
		THROW
	END CATCH;
END
GO

CREATE OR ALTER PROCEDURE DeleteVendorAddresses
@vendorId INT
AS
BEGIN
	BEGIN TRY 
		BEGIN TRANSACTION;
		DECLARE @addressId INT;
		DECLARE vendorAddressCursor CURSOR FOR
		SELECT AddressId FROM VendorToAddress WHERE VendorId = @vendorId;

		-- Iteratively fetch and delete values
		OPEN vendorAddressCursor;

		FETCH NEXT FROM vendorAddressCursor INTO 
		@addressId;

		WHILE @@FETCH_STATUS = 0
		BEGIN
			EXEC DeleteVendorAddress @vendorId, @addressId;
			FETCH NEXT FROM vendorAddressCursor INTO 
			@addressId;
		END

		CLOSE vendorAddressCursor;
		DEALLOCATE vendorAddressCursor;
		COMMIT;
		RETURN 0;
	END TRY  
	BEGIN CATCH  
		PRINT 'An error occurred.'; 
		ROLLBACK;
		THROW
	END CATCH;
END
GO

CREATE OR ALTER PROCEDURE UpdateCourierAddress
@courierId INT,
@addressId INT,
@street VARCHAR(100),
@city VARCHAR(100),
@postalCode VARCHAR(10),
@country VARCHAR(20)
AS
BEGIN
  	BEGIN TRY 
	  BEGIN TRANSACTION;
	  DECLARE @existingAddresses TABLE(AddressId INT);
	  DECLARE @customerToAddressCount INT, @vendorToAddressCount INT, @courierToAddressCount INT,
		@orderPositionCount INT, @customerOrderCount INT;

	  -- Delete courier to address
	  DELETE FROM CourierToAddress WHERE CourierId = @courierId AND AddressId = @addressId;

	  -- Look for similar address
	  INSERT INTO @existingAddresses 
	  SELECT AddressId FROM Address WHERE
	  Street = @street AND City = @city AND PostalCode = @postalCode 
	  AND Country = @country;
	  DECLARE @addressCount INT;
	  SELECT @addressCount = COUNT(*) FROM @existingAddresses;

	  IF @addressCount > 0
	  BEGIN
		 DECLARE @similarAddressId INT;
		 SELECT @similarAddressId = AddressId FROM @existingAddresses;
		 EXEC AddCourierAddressReference @courierId, @similarAddressId;
	  END
	  ELSE
	  BEGIN
		 DECLARE @newId INT;
		 SELECT @newId = MAX(AddressId) + 1 FROM Address;
		 INSERT INTO Address(AddressId, Street, City, PostalCode, Country)
		 VALUES (@newId, @street, @city, @postalCode, @country);
		 EXEC AddCourierAddressReference @courierId, @newId;
	  END

	  -- Leave if referenced by other relations
	  -- By CustomerToAddress
	  SELECT @customerToAddressCount = COUNT(*) FROM CustomerToAddress WHERE AddressId = @addressId;

	    IF @customerToAddressCount > 0
		BEGIN
			COMMIT;
			RETURN 0;
		END

		-- By VendorToAddress
		SELECT @vendorToAddressCount = COUNT(*) FROM VendorToAddress WHERE AddressId = @addressId;

		IF @vendorToAddressCount > 0
		BEGIN
			COMMIT;
			RETURN 0;
		END

		-- By CourierToAddress
		SELECT @courierToAddressCount = COUNT(*) FROM CourierToAddress WHERE AddressId = @addressId;

		IF @courierToAddressCount > 0
		BEGIN
			COMMIT;
			RETURN 0;
		END

		-- By OrderPosition
		SELECT @orderPositionCount = COUNT(*) FROM OrderPosition WHERE DeliveryAddressId = @addressId;

		IF @orderPositionCount > 0
		BEGIN
			COMMIT;
			RETURN 0;
		END

		-- By CustomerOrder
		SELECT @customerOrderCount = COUNT(*) FROM CustomerOrder WHERE BillingAddressId = @addressId;

		IF @customerOrderCount > 0
		BEGIN
			COMMIT;
			RETURN 0;
		END

	  -- Delete the address
	  DELETE FROM Address WHERE AddressId = @addressId;
	  COMMIT;
	  RETURN 0;
	END TRY  
	BEGIN CATCH  
	   PRINT 'An error occurred.'; 
	   ROLLBACK;
	   THROW
	END CATCH;
END
GO

CREATE OR ALTER PROCEDURE UpdateCustomerAddress
@customerId INT,
@addressId INT,
@street VARCHAR(100),
@city VARCHAR(100),
@postalCode VARCHAR(10),
@country VARCHAR(20)
AS
BEGIN
  	BEGIN TRY 
	  BEGIN TRANSACTION;
	  DECLARE @existingAddresses TABLE(AddressId INT);
	  DECLARE @customerToAddressCount INT, @vendorToAddressCount INT, @courierToAddressCount INT,
		@orderPositionCount INT, @customerOrderCount INT;

	  -- Delete customer to address
	  DELETE FROM CustomerToAddress WHERE CustomerId = @customerId AND AddressId = @addressId;

	  -- Look for similar address
	  INSERT INTO @existingAddresses 
	  SELECT AddressId FROM Address WHERE
	  Street = @street AND City = @city AND PostalCode = @postalCode 
	  AND Country = @country;
	  DECLARE @addressCount INT;
	  SELECT @addressCount = COUNT(*) FROM @existingAddresses;

	  IF @addressCount > 0
	  BEGIN
		 DECLARE @similarAddressId INT;
		 SELECT @similarAddressId = AddressId FROM @existingAddresses;
		 EXEC AddCustomerAddressReference @customerId, @similarAddressId;
	  END
	  ELSE
	  BEGIN
		 DECLARE @newId INT;
		 SELECT @newId = MAX(AddressId) + 1 FROM Address;
		 INSERT INTO Address(AddressId, Street, City, PostalCode, Country)
		 VALUES (@newId, @street, @city, @postalCode, @country);
		 EXEC AddCustomerAddressReference @customerId, @newId;
	  END

	  -- Leave if referenced by other relations
	  -- By CustomerToAddress
	  SELECT @customerToAddressCount = COUNT(*) FROM CustomerToAddress WHERE AddressId = @addressId;

	    IF @customerToAddressCount > 0
		BEGIN
			COMMIT;
			RETURN 0;
		END

		-- By VendorToAddress
		SELECT @vendorToAddressCount = COUNT(*) FROM VendorToAddress WHERE AddressId = @addressId;

		IF @vendorToAddressCount > 0
		BEGIN
			COMMIT;
			RETURN 0;
		END

		-- By CourierToAddress
		SELECT @courierToAddressCount = COUNT(*) FROM CourierToAddress WHERE AddressId = @addressId;

		IF @courierToAddressCount > 0
		BEGIN
			COMMIT;
			RETURN 0;
		END

		-- By OrderPosition
		SELECT @orderPositionCount = COUNT(*) FROM OrderPosition WHERE DeliveryAddressId = @addressId;

		IF @orderPositionCount > 0
		BEGIN
			COMMIT;
			RETURN 0;
		END

		-- By CustomerOrder
		SELECT @customerOrderCount = COUNT(*) FROM CustomerOrder WHERE BillingAddressId = @addressId;

		IF @customerOrderCount > 0
		BEGIN
			COMMIT;
			RETURN 0;
		END

	  -- Delete the address
	  DELETE FROM Address WHERE AddressId = @addressId;
	  COMMIT;
	  RETURN 0;
	END TRY  
	BEGIN CATCH  
	   PRINT 'An error occurred.'; 
	   ROLLBACK;
	   THROW
	END CATCH;
END
GO

CREATE OR ALTER PROCEDURE UpdateVendorAddress
@vendorId INT,
@addressId INT,
@street VARCHAR(100),
@city VARCHAR(100),
@postalCode VARCHAR(10),
@country VARCHAR(20)
AS
BEGIN
  	BEGIN TRY 
	  BEGIN TRANSACTION;
	  DECLARE @existingAddresses TABLE(AddressId INT);
	  DECLARE @customerToAddressCount INT, @vendorToAddressCount INT, @courierToAddressCount INT,
		@orderPositionCount INT, @customerOrderCount INT;

	  -- Delete vendor to address
	  DELETE FROM VendorToAddress WHERE VendorId = @vendorId AND AddressId = @addressId;

	  -- Look for similar address
	  INSERT INTO @existingAddresses 
	  SELECT AddressId FROM Address WHERE
	  Street = @street AND City = @city AND PostalCode = @postalCode 
	  AND Country = @country;
	  DECLARE @addressCount INT;
	  SELECT @addressCount = COUNT(*) FROM @existingAddresses;

	  IF @addressCount > 0
	  BEGIN
		 DECLARE @similarAddressId INT;
		 SELECT @similarAddressId = AddressId FROM @existingAddresses;
		 EXEC AddVendorAddressReference @vendorId, @similarAddressId;
	  END
	  ELSE
	  BEGIN
		 DECLARE @newId INT;
		 SELECT @newId = MAX(AddressId) + 1 FROM Address;
		 INSERT INTO Address(AddressId, Street, City, PostalCode, Country)
		 VALUES (@newId, @street, @city, @postalCode, @country);
		 EXEC AddVendorAddressReference @vendorId, @newId;
	  END

	  -- Leave if referenced by other relations
	  -- By CustomerToAddress
	  SELECT @customerToAddressCount = COUNT(*) FROM CustomerToAddress WHERE AddressId = @addressId;

	    IF @customerToAddressCount > 0
		BEGIN
			COMMIT;
			RETURN 0;
		END

		-- By VendorToAddress
		SELECT @vendorToAddressCount = COUNT(*) FROM VendorToAddress WHERE AddressId = @addressId;

		IF @vendorToAddressCount > 0
		BEGIN
			COMMIT;
			RETURN 0;
		END

		-- By CourierToAddress
		SELECT @courierToAddressCount = COUNT(*) FROM CourierToAddress WHERE AddressId = @addressId;

		IF @courierToAddressCount > 0
		BEGIN
			COMMIT;
			RETURN 0;
		END

		-- By OrderPosition
		SELECT @orderPositionCount = COUNT(*) FROM OrderPosition WHERE DeliveryAddressId = @addressId;

		IF @orderPositionCount > 0
		BEGIN
			COMMIT;
			RETURN 0;
		END

		-- By CustomerOrder
		SELECT @customerOrderCount = COUNT(*) FROM CustomerOrder WHERE BillingAddressId = @addressId;

		IF @customerOrderCount > 0
		BEGIN
			COMMIT;
			RETURN 0;
		END

	  -- Delete the address
	  DELETE FROM Address WHERE AddressId = @addressId;
	  COMMIT;
	  RETURN 0;
	END TRY  
	BEGIN CATCH  
	   PRINT 'An error occurred.'; 
	   ROLLBACK;
	   THROW
	END CATCH;
END
GO

CREATE OR ALTER PROCEDURE RemoveVendorProduct
@vendorToProductId  INT
AS
BEGIN
  	BEGIN TRY 
	  BEGIN TRANSACTION;
	  -- Remove items from product to cart
	  DELETE FROM ProductToCart WHERE VendorToProductId = @vendorToProductId;

	  -- Remove items from order position
	  DELETE FROM OrderPosition WHERE VendorToProductId = @vendorToProductId;

	  -- Fetch the product ID
	  DECLARE @productId INT = 0;
	  SELECT @productId = ProductId FROM VendorToProduct WHERE VendorToProductId = @vendorToProductId;

	  -- Remove the product reference
	  DELETE FROM VendorToProduct WHERE VendorToProductId = @vendorToProductId;

	  -- Check if the underlying product is referenced by other vendor
	  DECLARE @referenceCount INT = 0;
	  SELECT @referenceCount = COUNT(*) FROM VendorToProduct WHERE ProductId = @productId;

	  -- Delete the product if it is not referenced by other vendor
	  IF @referenceCount = 0
	  BEGIN
		DELETE ProductToCategory WHERE ProductId = @productId;
		DELETE Product WHERE ProductId = @productId;
	  END
	  COMMIT;
	  RETURN 0;
	END TRY  
	BEGIN CATCH  
	   PRINT 'An error occurred.'; 
	   ROLLBACK;
	   THROW
	END CATCH;
END
GO

CREATE OR ALTER PROCEDURE RemoveVendorProducts
@vendorId  INT
AS
BEGIN
  	BEGIN TRY 
	  BEGIN TRANSACTION;
		DECLARE @vendorToProductId INT;
		DECLARE vendorProductCursor CURSOR FOR
		SELECT VendorToProductId FROM VendorToProduct WHERE VendorId = @vendorId;

		-- Iteratively fetch and delete values
		OPEN vendorProductCursor;

		FETCH NEXT FROM vendorProductCursor INTO 
		@vendorToProductId;

		WHILE @@FETCH_STATUS = 0
		BEGIN
			EXEC RemoveVendorProduct @vendorToProductId;
			FETCH NEXT FROM vendorProductCursor INTO 
			@vendorToProductId;
		END

		CLOSE vendorProductCursor;
		DEALLOCATE vendorProductCursor;
	  COMMIT;
	  RETURN 0;
	END TRY  
	BEGIN CATCH  
	   PRINT 'An error occurred.'; 
	   ROLLBACK;
	   THROW
	END CATCH;
END
GO

CREATE OR ALTER PROCEDURE CreateProductCategoryReferenceIfNotExists
@productId INT,
@categoryId INT
AS
BEGIN
  	BEGIN TRY 
	  BEGIN TRANSACTION;
	  DECLARE @referenceCount INT = 0;
	  SELECT @referenceCount = COUNT(*) FROM ProductToCategory WHERE ProductId = @productId AND CategoryId = @categoryId;

	  IF @referenceCount = 0
	  BEGIN
		DECLARE @newId INT = 0;
		SELECT @newId = MAX(ProductToCategoryId) + 1 FROM ProductToCategory;
		INSERT INTO ProductToCategory(ProductToCategoryId, ProductId, CategoryId) VALUES(@newId, @productId, @categoryId);
	  END
	  COMMIT;
	  RETURN 0;
	END TRY  
	BEGIN CATCH  
	   PRINT 'An error occurred.'; 
	   ROLLBACK;
	   THROW
	END CATCH;
END
GO

CREATE OR ALTER PROCEDURE CreateProductCategoryReferencesIfNotExist
@productId INT,
@categoryIds CategoryDataType READONLY
AS
BEGIN
  	BEGIN TRY 
	  BEGIN TRANSACTION;
		DECLARE @categoryId INT;
		DECLARE categoryCursor CURSOR FOR
		SELECT CategoryId FROM @categoryIds;

		-- Iteratively fetch and insert values
		OPEN categoryCursor;

		FETCH NEXT FROM categoryCursor INTO 
		@categoryId;

		WHILE @@FETCH_STATUS = 0
		BEGIN
			EXEC CreateProductCategoryReferenceIfNotExists @productId, @categoryId;
			FETCH NEXT FROM categoryCursor INTO 
			@categoryId;
		END

		CLOSE categoryCursor;
		DEALLOCATE categoryCursor;
	  COMMIT;
	  RETURN 0;
	END TRY  
	BEGIN CATCH  
	   PRINT 'An error occurred.'; 
	   ROLLBACK;
	   THROW
	END CATCH;
END
GO

-- A1
/*
	Creates a new courier using name, email, phone number and addresses.
*/
CREATE OR ALTER PROCEDURE CreateNewCourier
@name VARCHAR(100),
@email VARCHAR(100),
@phoneNumber VARCHAR(20),
@addresses AddressDataType READONLY
AS
BEGIN
  	BEGIN TRY 
	  BEGIN TRANSACTION;

	  -- Check for existing courier
	  DECLARE @courierCount INT = 0;
	  SELECT @courierCount = COUNT(*) FROM Courier WHERE Name = @name;

	  IF @courierCount > 0
	  BEGIN
		  THROW 51000, 'The courier with the given name already exists!', 1;
	  END

	  -- Create the courier
	  DECLARE @courierId INT  = 0;
	  SELECT @courierId = MAX(CourierId) + 1 FROM Courier;
	  INSERT INTO Courier(CourierId, Name, Email, PhoneNumber) VALUES
	  (@courierId, @name, @email, @phoneNumber);

	  -- Create the addresses
	  EXEC AddCourierAddresses @courierId, @addresses;
	  COMMIT;
	  RETURN 0;
	END TRY  
	BEGIN CATCH  
	   PRINT 'An error occurred.'; 
	   ROLLBACK;
	   THROW
	END CATCH;
END
GO

-- A1 - Test
BEGIN
	DECLARE @name VARCHAR(100) = 'TestCourier', @email VARCHAR(100) = 'testuser@gmail.com',
	@phoneNumber VARCHAR(20) = '+1111111111';
	DECLARE @addresses AS AddressDataType;
	INSERT INTO @addresses VALUES('Teststreet', 'TestCity', '123A', 'TestCountry');
	INSERT INTO @addresses VALUES ('Kaiserstraße 238', 'Vienna', '1010', 'Austria');
	DECLARE @t1 DATETIME;
	DECLARE @t2 DATETIME;
	SET @t1 = GETDATE();
	EXEC CreateNewCourier @name, @email, @phoneNumber, @addresses;
	SET @t2 = GETDATE();
	SELECT DATEDIFF(millisecond,@t1,@t2) AS elapsed_ms;
END;

-- A2
/*
	Updates an existing courier with specific ID using name, email, phone number.
*/
CREATE OR ALTER PROCEDURE UpdateExistingCourier
@courierId INT,
@name VARCHAR(100),
@email VARCHAR(100),
@phoneNumber VARCHAR(20)
AS
BEGIN
  	BEGIN TRY 
	  BEGIN TRANSACTION;
	  -- Check for other existing couriers
	  DECLARE @otherCourierCount INT = 0;
	  SELECT @otherCourierCount = COUNT(*) FROM Courier
	  WHERE Name = @name AND CourierId != @courierId;

	  IF @otherCourierCount > 0
	  BEGIN
		THROW 51000, 'Other courier with the given name already exists!', 1;
	  END

	  UPDATE Courier SET Name = @name, Email = @email, PhoneNumber = @phoneNumber
	  WHERE CourierId = @courierId;
	  COMMIT;
	  RETURN 0;
	END TRY  
	BEGIN CATCH  
	   PRINT 'An error occurred.'; 
	   ROLLBACK;
	   THROW
	END CATCH;
END
GO

-- A2 - Test
BEGIN
	DECLARE @t1 DATETIME;
	DECLARE @t2 DATETIME;
	SET @t1 = GETDATE();
	EXEC UpdateExistingCourier 20, 'TestCourier2', 'testuser@gmail2.com', '+11111111112'; 
	SET @t2 = GETDATE();
	SELECT DATEDIFF(millisecond,@t1,@t2) AS elapsed_ms;
END;

-- A3
/*
	Deletes an existing courier using a specific ID.
*/
CREATE OR ALTER PROCEDURE DeleteExistingCourier
@courierId INT
AS
BEGIN
  	BEGIN TRY 
	  BEGIN TRANSACTION;
	  -- Check if the courier is referenced by some order position
	  DECLARE @orderPositionCount INT = 0;
	  SELECT @orderPositionCount = COUNT(*) FROM OrderPosition
	  WHERE CourierCompanyId = @courierId;

	  IF @orderPositionCount > 0
	  BEGIN
		THROW 51000, 'Courier is referenced by order position and cannot be therefore deleted!', 1;
	  END

	  -- Delete the courier addresses
	  EXEC DeleteCourierAddresses @courierId;

	  -- Delete the courier
	  DELETE FROM Courier WHERE CourierId = @courierId;
	  
	  COMMIT;
	  RETURN 0;
	END TRY  
	BEGIN CATCH  
	   PRINT 'An error occurred.'; 
	   ROLLBACK;
	   THROW
	END CATCH;
END
GO

-- A3 - Test
BEGIN
	DECLARE @t1 DATETIME;
	DECLARE @t2 DATETIME;
	SET @t1 = GETDATE();
	EXEC DeleteExistingCourier 20; 
	SET @t2 = GETDATE();
	SELECT DATEDIFF(millisecond,@t1,@t2) AS elapsed_ms;
END;

-- A4
/*
	Creates a new address for a courier with specific ID using the street, city, postal code and country.
*/
CREATE OR ALTER PROCEDURE CreateNewCourierAddress
@courierId INT,
@street VARCHAR(100),
@city VARCHAR(100),
@postalCode VARCHAR(10),
@country VARCHAR(20)
AS
BEGIN
  	BEGIN TRY 
	  BEGIN TRANSACTION;
	  DECLARE @newAddressId INT;

	  -- Create new address
	  SELECT @newAddressId = MAX(AddressId) + 1 FROM Address;
	  EXEC AddCourierAddress @courierId, @newAddressId, @street, @city, @postalCode, @country;
	  COMMIT;
	  RETURN 0;
	END TRY  
	BEGIN CATCH  
	   PRINT 'An error occurred.'; 
	   ROLLBACK;
	   THROW
	END CATCH;
END
GO

-- A4 - Test
BEGIN
	DECLARE @courierId INT  = 20, @street VARCHAR(100) = 'Hauptstraße 154',
	@city VARCHAR(100) = 'Graz', @postalCode VARCHAR(10) = '8010', @country VARCHAR(20) = 'Austria';  
	DECLARE @t1 DATETIME;
	DECLARE @t2 DATETIME;
	SET @t1 = GETDATE();
	EXEC CreateNewCourierAddress @courierId, @street, @city, @postalCode, @country;
	SET @t2 = GETDATE();
	SELECT DATEDIFF(millisecond,@t1,@t2) AS elapsed_ms;
END;

-- A5
/*
	Updates an address for a courier with a specific ID.
	The address is identified by an ID and following data
	is used to update the address: street, city, postal code and country.
*/
CREATE OR ALTER PROCEDURE UpdateExistingCourierAddress
@courierId INT,
@addressId INT,
@street VARCHAR(100),
@city VARCHAR(100),
@postalCode VARCHAR(10),
@country VARCHAR(20)
AS
BEGIN
  	BEGIN TRY 
	  BEGIN TRANSACTION;
	  EXEC UpdateCourierAddress @courierId, @addressId, @street, @city, @postalCode, @country;
	  COMMIT;
	  RETURN 0;
	END TRY  
	BEGIN CATCH  
	   PRINT 'An error occurred.'; 
	   ROLLBACK;
	   THROW
	END CATCH;
END
GO

-- A5 - Test
BEGIN
	DECLARE @addressId INT  = 1, @courierId INT  = 20, @street VARCHAR(100) = 'Hauptstraße 155',
	@city VARCHAR(100) = 'Graz', @postalCode VARCHAR(10) = '8010', @country VARCHAR(20) = 'Austria';  
	DECLARE @t1 DATETIME;
	DECLARE @t2 DATETIME;
	SET @t1 = GETDATE();
	EXEC UpdateExistingCourierAddress @courierId, @addressId, @street, @city, @postalCode, @country;
	SET @t2 = GETDATE();
	SELECT DATEDIFF(millisecond,@t1,@t2) AS elapsed_ms;
END;

-- A6
/*
	Deletes an address identified by ID for a courier with specific ID.
*/
CREATE OR ALTER PROCEDURE DeleteExistingCourierAddress
@courierId INT,
@addressId INT
AS
BEGIN
  	BEGIN TRY 
	  BEGIN TRANSACTION;
	  EXEC DeleteCourierAddress @courierId, @addressId;
	  COMMIT;
	  RETURN 0;
	END TRY  
	BEGIN CATCH  
	   PRINT 'An error occurred.'; 
	   ROLLBACK;
	   THROW
	END CATCH;
END
GO

-- A6 - Test
BEGIN 
	DECLARE @t1 DATETIME;
	DECLARE @t2 DATETIME;
	SET @t1 = GETDATE();
	EXEC DeleteExistingCourierAddress 20, 901;
	SET @t2 = GETDATE();
	SELECT DATEDIFF(millisecond,@t1,@t2) AS elapsed_ms;
END;

-- A7
/*
	Creates a new category with a specific name.
*/
CREATE OR ALTER PROCEDURE CreateCategory
@name VARCHAR(100)
AS
BEGIN
  	BEGIN TRY 
	  BEGIN TRANSACTION;
	  DECLARE @otherCategoriesCount INT = 0;

	  -- Check for other existing categories
	  SELECT @otherCategoriesCount = COUNT(*) FROM Category
	  WHERE Name = @name;

	  IF @otherCategoriesCount > 0
	  BEGIN
		THROW 51000, 'Category with the given name already exists!', 1;
	  END

	  -- Create the category
	  DECLARE @newId INT;
	  SELECT @newId = MAX(CategoryId) + 1 FROM Category;
	  INSERT INTO Category(CategoryId, Name) VALUES (@newId, @name);
	  COMMIT;
	  RETURN 0;
	END TRY  
	BEGIN CATCH  
	   PRINT 'An error occurred.'; 
	   ROLLBACK;
	   THROW
	END CATCH;
END

-- A7 - Test
BEGIN 
	DECLARE @t1 DATETIME;
	DECLARE @t2 DATETIME;
	SET @t1 = GETDATE();
	EXEC CreateCategory 'TestCategory';
	SET @t2 = GETDATE();
	SELECT DATEDIFF(millisecond,@t1,@t2) AS elapsed_ms;
END;

-- A8
/*
	Updates a category identified by an ID using a specific name.
*/
CREATE OR ALTER PROCEDURE UpdateCategory
@categoryId INT,
@name VARCHAR(100)
AS
BEGIN
  	BEGIN TRY 
	  BEGIN TRANSACTION;
	  DECLARE @otherCategoriesCount INT = 0;

	  -- Check for other existing categories
	  SELECT @otherCategoriesCount = COUNT(*) FROM Category
	  WHERE Name = @name AND CategoryId != @categoryId;

	  IF @otherCategoriesCount > 0
	  BEGIN
		THROW 51000, 'Category with the given name already exists!', 1;
	  END

	  -- Update the category
	  UPDATE Category SET Name = @name WHERE CategoryId = @categoryId;
	  COMMIT;
	  RETURN 0;
	END TRY  
	BEGIN CATCH  
	   PRINT 'An error occurred.'; 
	   ROLLBACK;
	   THROW
	END CATCH;
END

-- A8 - Test
BEGIN 
	DECLARE @t1 DATETIME;
	DECLARE @t2 DATETIME;
	SET @t1 = GETDATE();
	EXEC  UpdateCategory 7, 'TestCategory2';
	SET @t2 = GETDATE();
	SELECT DATEDIFF(MILLISECOND,@t1,@t2) AS elapsed_ms;
END;

-- A9
/*
	Deletes a category identified by an ID.
*/
CREATE OR ALTER PROCEDURE DeleteCategory
@categoryId INT
AS
BEGIN
  	BEGIN TRY 
	  BEGIN TRANSACTION;
	  DECLARE @categoryReferencesCount INT = 0;

	  -- Check if the category is referenced
	  SELECT @categoryReferencesCount = COUNT(*) FROM ProductToCategory
	  WHERE CategoryId = @categoryId;

	  IF @categoryReferencesCount > 0
	  BEGIN
		THROW 51000, 'Category is referenced and cannot be deleted!', 1;
	  END

	  -- Delete the category
	  DELETE Category WHERE CategoryId = @categoryId;
	  COMMIT;
	  RETURN 0;
	END TRY  
	BEGIN CATCH  
	   PRINT 'An error occurred.'; 
	   ROLLBACK;
	   THROW
	END CATCH;
END

-- A9 - Test
BEGIN 
	DECLARE @t1 DATETIME;
	DECLARE @t2 DATETIME;
	SET @t1 = GETDATE();
	EXEC  DeleteCategory 7;
	SET @t2 = GETDATE();
	SELECT DATEDIFF(MILLISECOND,@t1,@t2) AS elapsed_ms;
END;

-- K1
/*
	Creates a new customer using username, first name, last name, email, password phone number
	and addresses.
*/
CREATE OR ALTER PROCEDURE CreateNewCustomer
@userName VARCHAR(100),
@firstName VARCHAR(100),
@lastName VARCHAR(100),
@email VARCHAR(100),
@password VARCHAR(100),
@phoneNumber VARCHAR(20),
@addresses AddressDataType READONLY
AS
BEGIN
  	BEGIN TRY 
	  BEGIN TRANSACTION;

	  -- Check for existing customer
	  DECLARE @customerCount INT = 0;
	  SELECT @customerCount = COUNT(*) FROM Customer WHERE UserName = @userName;

	  IF @customerCount > 0
	  BEGIN
		  THROW 51000, 'The customer with the given username already exists!', 1;
	  END

	  -- Create the customer
	  DECLARE @customerId INT  = 0;
	  SELECT @customerId = MAX(CustomerId) + 1 FROM Customer;
	  INSERT INTO Customer(CustomerId, UserName, FirstName, LastName, Email, Password, PhoneNumber)
	  VALUES (@customerId, @userName, @firstName, @lastName, @email, @password, @phoneNumber);

	  -- Create the shopping cart
	  DECLARE @cartId INT = 0;
	  SELECT @cartId = MAX(CartId) + 1 FROM ShoppingCart;
	  DECLARE @timestamp DATETIME = GETUTCDATE();
	  INSERT INTO ShoppingCart(CartId, CustomerId, DateCreated) VALUES (@cartId, @customerId, @timestamp);

	  -- Create the addresses
	  EXEC AddCustomerAddresses @customerId, @addresses;
	  COMMIT;
	  RETURN 0;
	END TRY  
	BEGIN CATCH  
	   PRINT 'An error occurred.'; 
	   ROLLBACK;
	   THROW
	END CATCH;
END
GO

-- K1 - Test
BEGIN 
	DECLARE @userName VARCHAR(100) = 'TestUserName', @firstName VARCHAR(100) = 'TestFirstName',
	@lastName VARCHAR(100) = 'TestLastName', @email VARCHAR(100) = 'testuser@gmail.com',
	@password VARCHAR(100) = 'testpassword123', @phoneNumber VARCHAR(20) = '+1111111111';
	DECLARE @addresses AS AddressDataType;
	INSERT INTO @addresses VALUES('Teststreet', 'TestCity', '123A', 'TestCountry');
	INSERT INTO @addresses VALUES ('Kaiserstraße 238', 'Vienna', '1010', 'Austria');
	DECLARE @t1 DATETIME;
	DECLARE @t2 DATETIME;
	SET @t1 = GETDATE();
	EXEC CreateNewCustomer @userName, @firstName, @lastName, @email, @password, @phoneNumber, @addresses;
	SET @t2 = GETDATE();
	SELECT DATEDIFF(millisecond,@t1,@t2) AS elapsed_ms;
END;

-- K2
/*
	Updates an existing customer identified by ID using username, first name, last name, email, password
	and phone number.
*/
CREATE OR ALTER PROCEDURE UpdateExistingCustomer
@customerId INT,
@userName VARCHAR(100),
@firstName VARCHAR(100),
@lastName VARCHAR(100),
@email VARCHAR(100),
@password VARCHAR(100),
@phoneNumber VARCHAR(20)
AS
BEGIN
  	BEGIN TRY 
	  BEGIN TRANSACTION;
	  -- Check for other existing customers
	  DECLARE @otherCustomerCount INT = 0;
	  SELECT @otherCustomerCount = COUNT(*) FROM Customer
	  WHERE UserName = @userName AND CustomerId != @customerId;

	  IF @otherCustomerCount > 0
	  BEGIN
		THROW 51000, 'Other customer with the given username already exists!', 1;
	  END

	  UPDATE Customer SET UserName = @userName, FirstName = @firstName, LastName = @lastName,
	  Email = @email, Password = @password, PhoneNumber = @phoneNumber
	  WHERE CustomerId = @customerId;
	  COMMIT;
	  RETURN 0;
	END TRY  
	BEGIN CATCH  
	   PRINT 'An error occurred.'; 
	   ROLLBACK;
	   THROW
	END CATCH;
END
GO

-- K2 - Test
BEGIN 
	DECLARE @customerId INT = 200,
	@userName VARCHAR(100) = 'TestUserName2', @firstName VARCHAR(100) = 'TestFirstName2',
	@lastName VARCHAR(100) = 'TestLastName2', @email VARCHAR(100) = 'testuser@gmail2.com',
	@password VARCHAR(100) = 'testpassword1232', @phoneNumber VARCHAR(20) = '+11111111112';
	DECLARE @t1 DATETIME;
	DECLARE @t2 DATETIME;
	SET @t1 = GETDATE();
	EXEC UpdateExistingCustomer @customerId, @userName, @firstName, @lastName, @email, @password, @phoneNumber;
	SET @t2 = GETDATE();
	SELECT DATEDIFF(millisecond,@t1,@t2) AS elapsed_ms;
END;

-- K3
/*
	Deletes an existing customer identified by ID.
*/
CREATE OR ALTER PROCEDURE DeleteExistingCustomer
@customerId INT
AS
BEGIN
  	BEGIN TRY 
	  BEGIN TRANSACTION;
	  -- Delete the order positions
	  DELETE OrderPosition WHERE OrderPositionId IN (SELECT op.OrderPositionId FROM OrderPosition op  
      LEFT OUTER JOIN CustomerOrder co  
      ON co.OrderId = op.OrderId 
      LEFT OUTER JOIN Customer c  
      ON co.CustomerId = c.CustomerId 
      WHERE c.CustomerId= @customerId);

	  -- Delete customer orders
	  DELETE CustomerOrder WHERE CustomerId = @customerId;

	  -- Delete shopping cart references
	  DELETE FROM ProductToCart WHERE CartId IN
      (SELECT CartId FROM ShoppingCart WHERE CustomerId = @customerId);

	  -- Delete shopping cart
	  DELETE FROM ShoppingCart WHERE CustomerId = @customerId;

	  -- Delete the addresses
	  EXEC DeleteCustomerAddresses @customerId;

	  --Delete the customer
	  DELETE FROM Customer WHERE CustomerId = @customerId;
	  COMMIT;
	  RETURN 0;
	END TRY  
	BEGIN CATCH  
	   PRINT 'An error occurred.'; 
	   ROLLBACK;
	   THROW
	END CATCH;
END
GO

-- K3 - Test
BEGIN 
	DECLARE @customerId INT = 200;
	DECLARE @t1 DATETIME;
	DECLARE @t2 DATETIME;
	SET @t1 = GETDATE();
	EXEC DeleteExistingCustomer @customerId;
	SET @t2 = GETDATE();
	SELECT DATEDIFF(millisecond,@t1,@t2) AS elapsed_ms;
END;

-- K4
/*
	Retrieves the customer information given the customer ID.
*/
CREATE OR ALTER FUNCTION GetCustomerInformation(@customerId INT)
RETURNS @information TABLE
(
   CustomerId INT,
   UserName VARCHAR(100),
   FirstName VARCHAR(100),
   LastName VARCHAR(100),
   Email VARCHAR(100),
   PhoneNumber VARCHAR(20),
   AddressId INT,
   Street VARCHAR(100),
   City VARCHAR(100),
   PostalCode VARCHAR(10),
   Country VARCHAR(20)
)
AS
BEGIN
    INSERT INTO @information
	SELECT * FROM CustomerInformation
	WHERE CustomerId = @customerId
	RETURN
END

-- K4 - Test
BEGIN 
	DECLARE @customerId INT = 200;
	DECLARE @t1 DATETIME;
	DECLARE @t2 DATETIME;
	SET @t1 = GETDATE();
	SELECT * FROM GetCustomerInformation(@customerId);
	SET @t2 = GETDATE();
	SELECT DATEDIFF(millisecond,@t1,@t2) AS elapsed_ms;
END;

-- K5
/*
	Creates a new address for a customer with specific ID using the following data: street, city, postal code and country.
*/
CREATE OR ALTER PROCEDURE CreateNewCustomerAddress
@customerId INT,
@street VARCHAR(100),
@city VARCHAR(100),
@postalCode VARCHAR(10),
@country VARCHAR(20)
AS
BEGIN
  	BEGIN TRY 
	  BEGIN TRANSACTION;
	  DECLARE @newAddressId INT;

	  -- Create new address
	  SELECT @newAddressId = MAX(AddressId) + 1 FROM Address;
	  EXEC AddCustomerAddress @customerId, @newAddressId, @street, @city, @postalCode, @country;
	  COMMIT;
	  RETURN 0;
	END TRY  
	BEGIN CATCH  
	   PRINT 'An error occurred.'; 
	   ROLLBACK;
	   THROW
	END CATCH;
END
GO

-- K5 - Test
BEGIN 
	DECLARE @customerId INT  = 200, @street VARCHAR(100) = 'Hauptstraße 154',
	@city VARCHAR(100) = 'Graz', @postalCode VARCHAR(10) = '8010', @country VARCHAR(20) = 'Austria';  
	DECLARE @t1 DATETIME;
	DECLARE @t2 DATETIME;
	SET @t1 = GETDATE();
	EXEC CreateNewCustomerAddress @customerId, @street, @city, @postalCode, @country;
	SET @t2 = GETDATE();
	SELECT DATEDIFF(millisecond,@t1,@t2) AS elapsed_ms;
END;

-- K6
/*
	Updates an existing address by an ID for a customer with a specific ID. 
	Following data is used to update the customer: street, city, postal code and country.
*/
CREATE OR ALTER PROCEDURE UpdateExistingCustomerAddress
@customerId INT,
@addressId INT,
@street VARCHAR(100),
@city VARCHAR(100),
@postalCode VARCHAR(10),
@country VARCHAR(20)
AS
BEGIN
  	BEGIN TRY 
	  BEGIN TRANSACTION;
	  EXEC UpdateCustomerAddress @customerId, @addressId, @street, @city, @postalCode, @country;
	  COMMIT;
	  RETURN 0;
	END TRY  
	BEGIN CATCH  
	   PRINT 'An error occurred.'; 
	   ROLLBACK;
	   THROW
	END CATCH;
END
GO

-- K6 - Test
BEGIN 
	DECLARE @customerId INT  = 200, @addressId INT = 902, @street VARCHAR(100) = 'Teststreet2',
	@city VARCHAR(100) = 'TestCity', @postalCode VARCHAR(10) = '123A', @country VARCHAR(20) = 'TestCity';  
	DECLARE @t1 DATETIME;
	DECLARE @t2 DATETIME;
	SET @t1 = GETDATE();
	EXEC UpdateCustomerAddress @customerId, @addressId, @street, @city, @postalCode, @country;
	SET @t2 = GETDATE();
	SELECT DATEDIFF(millisecond,@t1,@t2) AS elapsed_ms;
END;

-- K7
/*
	Deletes the address identified by an ID for the customer with the specified ID.
*/
CREATE OR ALTER PROCEDURE DeleteExistingCustomerAddress
@customerId INT,
@addressId INT
AS
BEGIN
  	BEGIN TRY 
	  BEGIN TRANSACTION;
	  EXEC DeleteCustomerAddress @customerId, @addressId;
	  COMMIT;
	  RETURN 0;
	END TRY  
	BEGIN CATCH  
	   PRINT 'An error occurred.'; 
	   ROLLBACK;
	   THROW
	END CATCH;
END
GO

-- K7 - Test
BEGIN 
	DECLARE @t1 DATETIME;
	DECLARE @t2 DATETIME;
	SET @t1 = GETDATE();
	EXEC DeleteExistingCustomerAddress 200, 0;
	SET @t2 = GETDATE();
	SELECT DATEDIFF(millisecond,@t1,@t2) AS elapsed_ms;
END;

-- K8
/*
	Retrieves the address information for the customer with the given ID.
*/
CREATE OR ALTER FUNCTION GetAddressInformation(@customerId INT)
RETURNS @information TABLE
(
   AddressId INT,
   Street VARCHAR(100),
   City VARCHAR(100),
   PostalCode VARCHAR(10),
   Country VARCHAR(20)
)
AS
BEGIN
    INSERT INTO @information
	SELECT AddressId, Street, City, PostalCode, Country FROM CustomerInformation
	WHERE CustomerId = @customerId
	RETURN
END

-- K8 - Test
BEGIN 
	DECLARE @customerId INT = 200;
	DECLARE @t1 DATETIME;
	DECLARE @t2 DATETIME;
	SET @t1 = GETDATE();
	SELECT * FROM GetAddressInformation(@customerId);
	SET @t2 = GETDATE();
	SELECT DATEDIFF(millisecond,@t1,@t2) AS elapsed_ms;
END;

-- K9
/*
	Retrieves the product information for the product with the given ID.
*/
CREATE OR ALTER FUNCTION GetProductInformation(@vendorToProductId INT)
RETURNS @information TABLE
(
   ProductId INT,
   ProductName VARCHAR(100),
   Description text,
   UnitPriceEuro DECIMAL(10, 2),
   InventoryLevel INT,
   CategoryId INT,
   CategoryName VARCHAR(100),
   VendorId INT,
   UserName VARCHAR(100),
   Name VARCHAR(100),
   Email VARCHAR(100),
   PhoneNumber VARCHAR(20),
   AddressId INT,
   Street VARCHAR(100),
   City VARCHAR(100),
   PostalCode VARCHAR(10),
   Country VARCHAR(20)
)
AS
BEGIN
    INSERT INTO @information
	SELECT p.ProductId, p.ProductName, p.Description, vp.UnitPriceEuro, vp.InventoryLevel, p.CategoryId, p.CategoryName,
	v.VendorId, v.UserName, v.Name, v.Email, v.PhoneNumber, v.AddressId, v.Street, v.City, v.PostalCode, v.Country
	FROM VendorToProduct vp
	LEFT OUTER JOIN VendorInformation v
	ON vp.VendorId = v.VendorId
	LEFT OUTER JOIN ProductInformation p
	ON p.ProductId = vp.ProductId
	WHERE vp.VendorToProductId = @vendorToProductId
	RETURN
END

-- K9 - Test
BEGIN 
	DECLARE @vendorToProductId INT = 0;
	DECLARE @t1 DATETIME;
	DECLARE @t2 DATETIME;
	SET @t1 = GETDATE();
	SELECT * FROM GetProductInformation(@vendorToProductId);
	SET @t2 = GETDATE();
	SELECT DATEDIFF(millisecond,@t1,@t2) AS elapsed_ms;
END;

-- K10
/*
	Adds the product with the given ID and amount to the shopping cart of the given customer.
*/
CREATE OR ALTER PROCEDURE AddProductToCart
@customerId INT,
@vendorToProductId INT,
@shoppingCartId INT,
@amount INT
AS
BEGIN
  	BEGIN TRY 
	  BEGIN TRANSACTION;
	  DECLARE @inventoryLevel INT;

	  -- Throw if amount negative or 0
	  IF @amount <= 0
	  BEGIN 
			THROW 51000, 'Amount cannot be negative or 0!', 1;
	  END

	  -- Store the inventory level
	  SELECT @inventoryLevel = InventoryLevel FROM VendorToProduct WHERE VendorToProductId = @vendorToProductId;

	  -- Check for product to cart references
	  DECLARE @productToCartCount INT = 0;
	  SELECT @productToCartCount = COUNT(*) FROM ProductToCart
	  WHERE VendorToProductId = @vendorToProductId AND CartId = @shoppingCartId;

	  IF @productToCartCount = 0
	  BEGIN
	    -- Throw error if amount is surpassing
		IF @amount > @inventoryLevel
		BEGIN
			 THROW 51000, 'Invalid amount selected (surpasses inventory level of the  product)!', 1;
		END

		-- Create new reference
		DECLARE @referenceId INT = 0;
		SELECT @referenceId = MAX(ProductToCartId) + 1 FROM ProductToCart;
		INSERT INTO ProductToCart(ProductToCartId, VendorToProductId, CartId, Amount) VALUES (@referenceId, @vendorToProductId, @shoppingCartId, @amount);
	  END
	  ELSE
	  BEGIN
		DECLARE @cartAmount INT = 0;
		SELECT @cartAmount = Amount FROM ProductToCart WHERE VendorToProductId = @vendorToProductId AND CartId = @shoppingCartId;

		-- Throw error if amount is surpassing
		IF @amount + @cartAmount > @inventoryLevel
		BEGIN
			 THROW 51000, 'Invalid amount selected (surpasses inventory level of the  product)!', 1;
		END

		UPDATE ProductToCart SET Amount = @cartAmount + @amount WHERE VendorToProductId = @vendorToProductId AND CartId = @shoppingCartId;
	  END
	  COMMIT;
	  RETURN 0;
	END TRY  
	BEGIN CATCH  
	   PRINT 'An error occurred.'; 
	   ROLLBACK;
	   THROW
	END CATCH;
END
GO

-- K10 - Test
BEGIN 
	DECLARE @vendorToProductId INT = 19999, @cartId INT = 200, @customerId INT = 200, @amount INT = 2;
	DECLARE @t1 DATETIME;
	DECLARE @t2 DATETIME;
	SET @t1 = GETDATE();
	EXEC AddProductToCart @customerId, @vendorToProductId, @cartId, @amount;
	SET @t2 = GETDATE();
	SELECT DATEDIFF(millisecond,@t1,@t2) AS elapsed_ms;
END;

-- K11
/*
	Removes the product with the given ID and amount for the shopping cart of the given customer.
*/
CREATE OR ALTER PROCEDURE RemoveProductFromCart
@customerId INT,
@vendorToProductId INT,
@shoppingCartId INT,
@amount INT
AS
BEGIN
  	BEGIN TRY 
	  BEGIN TRANSACTION;
	  -- Throw if amount negative or 0
	  IF @amount <= 0
	  BEGIN 
			THROW 51000, 'Amount cannot be negative or 0!', 1;
	  END

	  DECLARE @cartAmount INT = 0;
      SELECT @cartAmount = Amount FROM ProductToCart WHERE VendorToProductId = @vendorToProductId AND CartId = @shoppingCartId;

      -- Throw error if amount is surpassing
	  IF @amount > @cartAmount
	  BEGIN
		    THROW 51000, 'Invalid amount selected (surpasses the amount of the product in the cart)!', 1;
	  END

	  -- Update the amount
	  UPDATE ProductToCart SET Amount = @cartAmount - @amount WHERE VendorToProductId = @vendorToProductId AND CartId = @shoppingCartId;

	  -- Delete if cart level is 0
	  IF @amount = @cartAmount
	  BEGIN
			DELETE ProductToCart WHERE VendorToProductId = @vendorToProductId AND CartId = @shoppingCartId;
	  END
	  COMMIT;
	  RETURN 0;
	END TRY  
	BEGIN CATCH  
	   PRINT 'An error occurred.'; 
	   ROLLBACK;
	   THROW
	END CATCH;
END
GO

-- K11 - Test
BEGIN 
	DECLARE @vendorToProductId INT = 19999, @cartId INT = 200, @customerId INT = 200, @amount INT = 2;
	DECLARE @t1 DATETIME;
	DECLARE @t2 DATETIME;
	SET @t1 = GETDATE();
	EXEC RemoveProductFromCart @customerId, @vendorToProductId, @cartId, @amount;
	SET @t2 = GETDATE();
	SELECT DATEDIFF(millisecond,@t1,@t2) AS elapsed_ms;
END;

-- K12
/*
	Retrieves information about the given courier.
*/
CREATE OR ALTER FUNCTION GetCourierInformation(@courierId INT)
RETURNS @information TABLE
(
   CourierId INT,
   Name VARCHAR(100),
   Email VARCHAR(100),
   PhoneNumber VARCHAR(20),
   AddressId INT,
   Street VARCHAR(100),
   City VARCHAR(100),
   PostalCode VARCHAR(10),
   Country VARCHAR(20)
)
AS
BEGIN
    INSERT INTO @information
	SELECT * FROM CourierInformation
	WHERE CourierId = @courierId
	RETURN
END
GO

-- K12 - Test
BEGIN 
	DECLARE @courierId INT = 0;
	DECLARE @t1 DATETIME;
	DECLARE @t2 DATETIME;
	SET @t1 = GETDATE();
	SELECT * FROM GetCourierInformation(@courierId);
	SET @t2 = GETDATE();
	SELECT DATEDIFF(millisecond,@t1,@t2) AS elapsed_ms;
END;

-- K13
/*
	Makes an order for the given customer by specifying his shopping cart, billing address ID and courier company ID.
*/
CREATE OR ALTER PROCEDURE MakeOrder
@customerId INT,
@shoppingCartId INT,
@billingAddressId INT,
@courierCompanyId INT
AS
BEGIN
  	BEGIN TRY 
	 BEGIN TRANSACTION;
		DECLARE @vendorToProductId INT, @cartAmount INT, @inventoryLevel INT;
		DECLARE cartProductsCursor CURSOR FOR
		SELECT VendorToProductId, Amount FROM ProductToCart WHERE CartId = @shoppingCartId;

		-- Iteratively fetch and check for item availability
		OPEN cartProductsCursor;

		FETCH NEXT FROM cartProductsCursor INTO 
		@vendorToProductId, @cartAmount;

		WHILE @@FETCH_STATUS = 0
		BEGIN
			SELECT @inventoryLevel = InventoryLevel FROM VendorToProduct WHERE VendorToProductId = @vendorToProductId;

			IF @cartAmount >  @inventoryLevel
			BEGIN
				THROW 51000, 'Vendor item of the given amount is not available!', 1;
			END

			FETCH NEXT FROM cartProductsCursor INTO 
			@vendorToProductId, @cartAmount;
		END

		CLOSE cartProductsCursor;

		-- Create the order
		DECLARE @orderId INT;
		SELECT @orderId = MAX(OrderId) + 1 FROM CustomerOrder;
		DECLARE @currentTime DATETIME = GETUTCDATE();
		DECLARE @deliveryDate DATETIME = DATEADD(DAY, 14, @currentTime);
		INSERT INTO CustomerOrder(OrderId, OrderName, OrderDate, CustomerId, BillingAddressId, IsPaid)
		VALUES (@orderId, NULL, @currentTime, @customerId, @billingAddressId, 0);

		-- Iteratively place the order positions and adapt the inventory level
		OPEN cartProductsCursor;
		FETCH NEXT FROM cartProductsCursor INTO 
		@vendorToProductId, @cartAmount;

		WHILE @@FETCH_STATUS = 0
		BEGIN
			SELECT @inventoryLevel = InventoryLevel FROM VendorToProduct WHERE VendorToProductId = @vendorToProductId;

			IF @cartAmount >  @inventoryLevel
			BEGIN
				THROW 51000, 'Vendor item of the given amount is not available!', 1;
			END

			-- Insert into order position
			DECLARE @orderPositionId INT = 0;
			SELECT @orderPositionId = MAX(OrderPositionId) + 1 FROM OrderPosition;
			INSERT INTO OrderPosition(OrderPositionId, OrderId, Amount, VendorToProductId, CourierCompanyId, DeliveryDate, DeliveryAddressId)
			VALUES(@orderPositionId, @orderId, @cartAmount, @vendorToProductId, @courierCompanyId, @deliveryDate, @billingAddressId);

			--Remove from product to cart
			DELETE FROM ProductToCart WHERE CartId = @shoppingCartId AND VendorToProductId = @vendorToProductId;

			-- Adapt vendor to product
			UPDATE VendorToProduct SET InventoryLevel = @inventoryLevel - @cartAmount WHERE VendorToProductId = @vendorToProductId;

			FETCH NEXT FROM cartProductsCursor INTO 
			@vendorToProductId, @cartAmount;
		END

		CLOSE cartProductsCursor;
		DEALLOCATE cartProductsCursor;
	  COMMIT;
	  RETURN 0;
	END TRY  
	BEGIN CATCH  
	   PRINT 'An error occurred.'; 
	   ROLLBACK;
	   THROW
	END CATCH;
END
GO

-- K13 - Test
BEGIN 
	DECLARE @courierId INT = 0, @billingAddressId INT = 0, @cartId INT = 200, @customerId INT = 200;
	DECLARE @t1 DATETIME;
	DECLARE @t2 DATETIME;
	SET @t1 = GETDATE();
	EXEC MakeOrder @customerId, @cartId, @billingAddressId, @courierId;
	SET @t2 = GETDATE();
	SELECT DATEDIFF(millisecond,@t1,@t2) AS elapsed_ms;
END;

-- V1
/*
	Creates a new vendor using username, name, email, password, phone number and addresses.
*/
CREATE OR ALTER PROCEDURE CreateNewVendor
@userName VARCHAR(100),
@name VARCHAR(100),
@email VARCHAR(100),
@password VARCHAR(100),
@phoneNumber VARCHAR(20),
@addresses AddressDataType READONLY
AS
BEGIN
  	BEGIN TRY 
	  BEGIN TRANSACTION;

	  -- Check for existing vendor
	  DECLARE @vendorCount INT = 0;
	  SELECT @vendorCount = COUNT(*) FROM Vendor WHERE UserName = @userName;

	  IF @vendorCount > 0
	  BEGIN
		  THROW 51000, 'The vendor with the given username already exists!', 1;
	  END

	  -- Create the vendor
	  DECLARE @vendorId INT  = 0;
	  SELECT @vendorId = MAX(VendorId) + 1 FROM Vendor;
	  INSERT INTO Vendor(VendorId, UserName, Name, Email, Password, PhoneNumber)
	  VALUES (@vendorId, @userName, @name, @email, @password, @phoneNumber);

	  -- Create the addresses
	  EXEC AddVendorAddresses @vendorId, @addresses;
	  COMMIT;
	  RETURN 0;
	END TRY  
	BEGIN CATCH  
	   PRINT 'An error occurred.'; 
	   ROLLBACK;
	   THROW
	END CATCH;
END
GO

-- V1 - Test
BEGIN 
	DECLARE @userName VARCHAR(100) = 'TestFirmaName', @name VARCHAR(100) = 'TestFirmaName',
	@email VARCHAR(100) = 'testfirma@gmail.com',
	@password VARCHAR(100) = 'testpassword123', @phoneNumber VARCHAR(20) = '+1111111111';
	DECLARE @addresses AS AddressDataType;
	INSERT INTO @addresses VALUES('Teststreet', 'TestCity', '123A', 'TestCountry');
	INSERT INTO @addresses VALUES ('Kaiserstraße 238', 'Vienna', '1010', 'Austria');
	DECLARE @t1 DATETIME;
	DECLARE @t2 DATETIME;
	SET @t1 = GETDATE();
	EXEC CreateNewVendor @userName, @name, @email, @password, @phoneNumber, @addresses;
	SET @t2 = GETDATE();
	SELECT DATEDIFF(millisecond,@t1,@t2) AS elapsed_ms;
END;

-- V2
/*
	Updates an existing vendor specified by an ID using username, name, email, password and phone number.
*/
CREATE OR ALTER PROCEDURE UpdateExistingVendor
@vendorId INT,
@userName VARCHAR(100),
@name VARCHAR(100),
@email VARCHAR(100),
@password VARCHAR(100),
@phoneNumber VARCHAR(20)
AS
BEGIN
  	BEGIN TRY 
	  BEGIN TRANSACTION;
	  -- Check for other existing vendors
	  DECLARE @otherVendorCount INT = 0;
	  SELECT @otherVendorCount = COUNT(*) FROM Vendor
	  WHERE UserName = @userName AND VendorId != @vendorId;

	  IF @otherVendorCount > 0
	  BEGIN
		THROW 51000, 'Other vendor with the given username already exists!', 1;
	  END

	  UPDATE Vendor SET UserName = @userName, Name = @name,
	  Email = @email, Password = @password, PhoneNumber = @phoneNumber
	  WHERE VendorId = @vendorId;
	  COMMIT;
	  RETURN 0;
	END TRY  
	BEGIN CATCH  
	   PRINT 'An error occurred.'; 
	   ROLLBACK;
	   THROW
	END CATCH;
END
GO

-- V2 - Test
BEGIN 
	DECLARE @vendorId INT = 200, @userName VARCHAR(100) = 'TestFirmaName2', @name VARCHAR(100) = 'TestFirmaName2',
	@email VARCHAR(100) = 'testfirma2@gmail.com',
	@password VARCHAR(100) = 'testpassword123', @phoneNumber VARCHAR(20) = '+11111111112';
	DECLARE @t1 DATETIME;
	DECLARE @t2 DATETIME;
	SET @t1 = GETDATE();
	EXEC UpdateExistingVendor @vendorId, @userName, @name, @email, @password, @phoneNumber;
	SET @t2 = GETDATE();
	SELECT DATEDIFF(millisecond,@t1,@t2) AS elapsed_ms;
END;

-- V3
/*
	Deletes an existing vendor specified by an ID.
*/
CREATE OR ALTER PROCEDURE DeleteExistingVendor
@vendorId INT
AS
BEGIN
  	BEGIN TRY 
	  BEGIN TRANSACTION;
	  -- Delete the vendor products
	  EXEC RemoveVendorProducts @vendorId;

	  -- Delete the addresses
	  EXEC DeleteVendorAddresses @vendorId;

	  --Delete the vendor
	  DELETE FROM Vendor WHERE VendorId = @vendorId;
	  COMMIT;
	  RETURN 0;
	END TRY  
	BEGIN CATCH  
	   PRINT 'An error occurred.'; 
	   ROLLBACK;
	   THROW
	END CATCH;
END
GO

-- V3 - Test
BEGIN 
	DECLARE @vendorId INT = 200;
	DECLARE @t1 DATETIME;
	DECLARE @t2 DATETIME;
	SET @t1 = GETDATE();
	EXEC DeleteExistingVendor @vendorId;
	SET @t2 = GETDATE();
	SELECT DATEDIFF(millisecond,@t1,@t2) AS elapsed_ms;
END;

-- V4
/*
	Retrieves information about the vendor specified by an ID.
*/
CREATE OR ALTER FUNCTION GetVendorInformation(@vendorId INT)
RETURNS @information TABLE
(
   VendorId INT,
   UserName VARCHAR(100),
   Name VARCHAR(100),
   Email VARCHAR(100),
   PhoneNumber VARCHAR(20),
   AddressId INT,
   Street VARCHAR(100),
   City VARCHAR(100),
   PostalCode VARCHAR(10),
   Country VARCHAR(20)
)
AS
BEGIN
    INSERT INTO @information
	SELECT * FROM VendorInformation
	WHERE VendorId = @vendorId
	RETURN
END

-- V4 - Test
BEGIN 
	DECLARE @vendorId INT = 200;
	DECLARE @t1 DATETIME;
	DECLARE @t2 DATETIME;
	SET @t1 = GETDATE();
	SELECT * FROM GetVendorInformation(@vendorId);
	SET @t2 = GETDATE();
	SELECT DATEDIFF(millisecond,@t1,@t2) AS elapsed_ms;
END;

-- V5
/*
	Creates a new address for a vendor specified by an ID using street, city, postal code and country.
*/
CREATE OR ALTER PROCEDURE CreateNewVendorAddress
@vendorId INT,
@street VARCHAR(100),
@city VARCHAR(100),
@postalCode VARCHAR(10),
@country VARCHAR(20)
AS
BEGIN
  	BEGIN TRY 
	  BEGIN TRANSACTION;
	  DECLARE @newAddressId INT;

	  -- Create new address
	  SELECT @newAddressId = MAX(AddressId) + 1 FROM Address;
	  EXEC AddVendorAddress @vendorId, @newAddressId, @street, @city, @postalCode, @country;
	  COMMIT;
	  RETURN 0;
	END TRY  
	BEGIN CATCH  
	   PRINT 'An error occurred.'; 
	   ROLLBACK;
	   THROW
	END CATCH;
END
GO

-- V5 - Test
BEGIN 
	DECLARE @vendorId INT  = 200, @street VARCHAR(100) = 'Hauptstraße 154',
	@city VARCHAR(100) = 'Graz', @postalCode VARCHAR(10) = '8010', @country VARCHAR(20) = 'Austria';  
	DECLARE @t1 DATETIME;
	DECLARE @t2 DATETIME;
	SET @t1 = GETDATE();
	EXEC CreateNewVendorAddress @vendorId, @street, @city, @postalCode, @country;
	SET @t2 = GETDATE();
	SELECT DATEDIFF(millisecond,@t1,@t2) AS elapsed_ms;
END;

-- V6
/*
	Updates an existing address by an ID for a vendor with a specific ID.
	Following data is used to update the address: street, city, postal code and country.
*/
CREATE OR ALTER PROCEDURE UpdateExistingVendorAddress
@vendorId INT,
@addressId INT,
@street VARCHAR(100),
@city VARCHAR(100),
@postalCode VARCHAR(10),
@country VARCHAR(20)
AS
BEGIN
  	BEGIN TRY 
	  BEGIN TRANSACTION;
	  EXEC UpdateVendorAddress @vendorId, @addressId, @street, @city, @postalCode, @country;
	  COMMIT;
	  RETURN 0;
	END TRY  
	BEGIN CATCH  
	   PRINT 'An error occurred.'; 
	   ROLLBACK;
	   THROW
	END CATCH;
END
GO

-- V6 - Test
BEGIN 
	DECLARE @vendorId INT  = 200, @addressId INT = 1, @street VARCHAR(100) = 'Hauptstraße 155',
	@city VARCHAR(100) = 'Graz', @postalCode VARCHAR(10) = '8010', @country VARCHAR(20) = 'Austria';  
	DECLARE @t1 DATETIME;
	DECLARE @t2 DATETIME;
	SET @t1 = GETDATE();
	EXEC UpdateExistingVendorAddress @vendorId, @addressId, @street, @city, @postalCode, @country;
	SET @t2 = GETDATE();
	SELECT DATEDIFF(millisecond,@t1,@t2) AS elapsed_ms;
END;

-- V7
/*
	Deletes an existing address specified by an ID for a vendor with an ID.
*/
CREATE OR ALTER PROCEDURE DeleteExistingVendorAddress
@vendorId INT,
@addressId INT
AS
BEGIN
  	BEGIN TRY 
	  BEGIN TRANSACTION;
	  EXEC DeleteVendorAddress @vendorId, @addressId;
	  COMMIT;
	  RETURN 0;
	END TRY  
	BEGIN CATCH  
	   PRINT 'An error occurred.'; 
	   ROLLBACK;
	   THROW
	END CATCH;
END
GO

-- V7 - Test
BEGIN 
	DECLARE @t1 DATETIME;
	DECLARE @t2 DATETIME;
	SET @t1 = GETDATE();
	EXEC DeleteExistingVendorAddress 200, 1;
	SET @t2 = GETDATE();
	SELECT DATEDIFF(millisecond,@t1,@t2) AS elapsed_ms;
END;

-- V8
/*
	Retrieves address information for a vendor with the specified ID.
*/
CREATE OR ALTER FUNCTION GetVendorAddressInformation(@vendorId INT)
RETURNS @information TABLE
(
   AddressId INT,
   Street VARCHAR(100),
   City VARCHAR(100),
   PostalCode VARCHAR(10),
   Country VARCHAR(20)
)
AS
BEGIN
    INSERT INTO @information
	SELECT AddressId, Street, City, PostalCode, Country FROM VendorInformation
	WHERE VendorId = @vendorId
	RETURN
END

-- V8 - Test
BEGIN 
	DECLARE @vendorId INT = 200;
	DECLARE @t1 DATETIME;
	DECLARE @t2 DATETIME;
	SET @t1 = GETDATE();
	SELECT * FROM GetVendorAddressInformation(@vendorId);
	SET @t2 = GETDATE();
	SELECT DATEDIFF(millisecond,@t1,@t2) AS elapsed_ms;
END;

-- V9
/*
	Creates a new product for the given vendor using following information:
	unit price in €, inventory level, name, description and category IDs.
*/
CREATE OR ALTER PROCEDURE CreateNewVendorProduct
@vendorId INT,
@unitPriceEuro DECIMAL(10, 2),
@inventoryLevel INT,
@name VARCHAR(100),
@description TEXT,
@categoryIds CategoryDataType READONLY
AS
BEGIN
  	BEGIN TRY 
	  BEGIN TRANSACTION;
	  -- Throw error if not existing category detected
	  DECLARE @inputCategoriesCount INT = 0;
	  SELECT @inputCategoriesCount = COUNT(*) FROM @categoryIds;
	  DECLARE @existingCategoriesCount INT = 0;
	  SELECT  @existingCategoriesCount = COUNT(*) FROM Category WHERE CategoryId IN (SELECT CategoryId FROM @categoryIds);

	  IF @unitPriceEuro <= 0
	  BEGIN
		THROW 51000, 'Invalid price detected!', 1;
	  END

	  IF @inventoryLevel < 0
	  BEGIN
		THROW 51000, 'Invalid inventory level detected!', 1;
	  END

	  IF @existingCategoriesCount != @inputCategoriesCount
	  BEGIN
		THROW 51000, 'Non-existing category detected!', 1;
	  END

	  -- Check for own existing product
	  DECLARE @ownProductCount INT = 0;
	  SELECT @ownProductCount = COUNT(*) FROM VendorToProduct vp
	  LEFT OUTER JOIN Product P ON vp.ProductId = p.ProductId
	  WHERE vp.VendorId = @vendorId AND p.Name = @name AND p.Description LIKE @description;

	  IF @ownProductCount > 0
	  BEGIN
		  THROW 51000, 'The already owns the product!', 1;
	  END

	  -- Check for other existing product
	  DECLARE @otherProductCount INT, @productId INT;
	  DECLARE @otherProductIds TABLE(ProductId INT);
	  INSERT INTO @otherProductIds
	  SELECT p.ProductId FROM VendorToProduct vp
	  LEFT OUTER JOIN Product P ON vp.ProductId = p.ProductId
	  WHERE vp.VendorId != @vendorId AND p.Name = @name AND p.Description LIKE @description;
	  SELECT @otherProductCount = COUNT(*) FROM @otherProductIds;

	  -- Generate new vendor product ID
	  DECLARE  @newVendorProductId INT;
	  SELECT @newVendorProductId = MAX(VendorToProductId) + 1 FROM VendorToProduct;


	  IF @otherProductCount = 0
	  BEGIN
	    -- Insert a new product
		SELECT @productId = MAX(ProductId) + 1 FROM Product;
		INSERT INTO Product(ProductId, Name, Description) VALUES(@productId, @name, @description);
		INSERT INTO VendorToProduct(VendorToProductId, VendorId, ProductId, UnitPriceEuro, InventoryLevel) 
		VALUES(@newVendorProductId, @vendorId, @productId, @unitPriceEuro, @inventoryLevel);
	  END
	  ELSE
	  BEGIN
	     -- Create a reference to an existing product
		 SELECT @productId = ProductId FROM @otherProductIds;
		 INSERT INTO VendorToProduct(VendorToProductId, VendorId, ProductId, UnitPriceEuro, InventoryLevel) 
		 VALUES(@newVendorProductId, @vendorId, @productId, @unitPriceEuro, @inventoryLevel);
	  END

	  -- Create category references
	  EXEC CreateProductCategoryReferencesIfNotExist @productId, @categoryIds;
	  COMMIT;
	  RETURN 0;
	END TRY  
	BEGIN CATCH  
	   PRINT 'An error occurred.'; 
	   ROLLBACK;
	   THROW
	END CATCH;
END
GO

-- V9 - Test
BEGIN 
	DECLARE @vendorId INT = 200, @inventoryLevel INT = 29, @name VARCHAR(100) = 'Test',
	@description VARCHAR(1000) = 'This is a test product', @unitPriceEuro DECIMAL(10, 2) = 12,
	@categories CategoryDataType;
	INSERT INTO @categories VALUES(2);
	DECLARE @t1 DATETIME;
	DECLARE @t2 DATETIME;
	SET @t1 = GETDATE();
	EXEC CreateNewVendorProduct @vendorId, @unitPriceEuro, @inventoryLevel, @name, @description, @categories;
	SET @t2 = GETDATE();
	SELECT DATEDIFF(millisecond,@t1,@t2) AS elapsed_ms;
END;

--V10
/*
	Updates an existing product with an ID for the given vendor using 
	the following information: unit price in €, inventory level, name and description.
*/
CREATE OR ALTER PROCEDURE UpdateExistingVendorProduct
@vendorId INT,
@vendorToProductId INT,
@unitPriceEuro DECIMAL(10, 2),
@inventoryLevel INT,
@name VARCHAR(100),
@description TEXT
AS
BEGIN
  	BEGIN TRY 
	  BEGIN TRANSACTION;
	  DECLARE @cartsCount INT, @orderPositionCount INT, @vendorReferenceCount INT, @productId INT;

	  IF @unitPriceEuro <= 0
	  BEGIN
		THROW 51000, 'Invalid price detected!', 1;
	  END

	  IF @inventoryLevel < 0
	  BEGIN
		THROW 51000, 'Invalid inventory level detected!', 1;
	  END

	  -- Throw error if the product does not belong to the vendor
	  SELECT @vendorReferenceCount = COUNT(*) FROM VendorToProduct WHERE VendorId = @vendorId AND VendorToProductId = @vendorToProductId;

	  IF @vendorReferenceCount = 0
	  BEGIN
		  THROW 51000, 'The product does not belong to the vendor!', 1;
	  END

	  SELECT @productId = ProductId FROM VendorToProduct WHERE VendorId = @vendorId AND VendorToProductId = @vendorToProductId;

	  -- Throw error if referenced by some order position or cart
	  SELECT @orderPositionCount = COUNT(*) FROM OrderPosition WHERE VendorToProductId = @vendorToProductId;

	  IF @orderPositionCount > 0
	  BEGIN
		  THROW 51000, 'The product cannot be updated because it is referenced by an order position!', 1;
	  END

	  SELECT @cartsCount = COUNT(*) FROM ProductToCart WHERE VendorToProductId = @vendorToProductId;

	  IF @cartsCount > 0
	  BEGIN
		  THROW 51000, 'The product cannot be updated because it is referenced by a shopping cart!', 1;
	  END

	  -- Check for other existing product
	  DECLARE @otherProductCount INT, @otherProductId INT;
	  DECLARE @otherProductIds TABLE(ProductId INT);
	  INSERT INTO @otherProductIds
	  SELECT p.ProductId FROM VendorToProduct vp
	  LEFT OUTER JOIN Product P ON vp.ProductId = p.ProductId
	  WHERE p.Name = @name AND p.Description LIKE @description;
	  SELECT @otherProductCount = COUNT(*) FROM @otherProductIds;

	  IF @otherProductCount > 0
	  BEGIN
			SELECT @otherProductId = ProductId FROM @otherProductIds;
			UPDATE VendorToProduct SET ProductId = @otherProductId, UnitPriceEuro = @unitPriceEuro, InventoryLevel = @inventoryLevel WHERE VendorToProductId = @vendorToProductId;
	  END
	  ELSE
	  BEGIN
	        DECLARE @newProductId INT = 0;
			SELECT @newProductId = MAX(ProductId) + 1 FROM Product;
			INSERT INTO Product(ProductId, Name, Description) VALUES(@newProductId, @name, @description);
			UPDATE VendorToProduct SET ProductId = @newProductId, UnitPriceEuro = @unitPriceEuro, InventoryLevel = @inventoryLevel WHERE VendorToProductId = @vendorToProductId;
	  END

	  -- Remove the underlying product if it is no longer referenced
	  DECLARE @otherProductReferenceCount INT = 0;
	  SELECT @otherProductReferenceCount = COUNT(*) FROM VendorToProduct WHERE ProductId = @productId;

	  IF @otherProductReferenceCount = 0
	  BEGIN
		DELETE FROM ProductToCategory WHERE ProductId = @productId;
		DELETE FROM Product WHERE ProductId = @productId;
	  END
	  COMMIT;
	  RETURN 0;
	END TRY  
	BEGIN CATCH  
	   PRINT 'An error occurred.'; 
	   ROLLBACK;
	   THROW
	END CATCH;
END
GO

-- V10 - Test
BEGIN 
	DECLARE @vendorId INT = 200, @vendorToProductId INT  = 20000, @inventoryLevel INT = 29, @name VARCHAR(100) = 'Compact Portable Air Purifier',
	@description VARCHAR(1000) = 'Compact air purifier for personal use', @unitPriceEuro DECIMAL(10, 2) = 12;
	DECLARE @t1 DATETIME;
	DECLARE @t2 DATETIME;
	SET @t1 = GETDATE();
	EXEC UpdateExistingVendorProduct @vendorId, @vendorToProductId, @unitPriceEuro, @inventoryLevel, @name, @description;
	SET @t2 = GETDATE();
	SELECT DATEDIFF(millisecond,@t1,@t2) AS elapsed_ms;
END;

--V11
/*
	Removes an existing vendor product specified by an ID.
*/
CREATE OR ALTER PROCEDURE RemoveExistingVendorProduct
@vendorToProductId INT
AS
BEGIN
  	BEGIN TRY 
	  BEGIN TRANSACTION;
	  EXEC RemoveVendorProduct @vendorToProductId;
	  COMMIT;
	  RETURN 0;
	END TRY  
	BEGIN CATCH  
	   PRINT 'An error occurred.'; 
	   ROLLBACK;
	   THROW
	END CATCH;
END
GO

-- V11 - Test
BEGIN 
	DECLARE @vendorToProductId INT  = 20000;
	DECLARE @t1 DATETIME;
	DECLARE @t2 DATETIME;
	SET @t1 = GETDATE();
	EXEC RemoveExistingVendorProduct @vendorToProductId;
	SET @t2 = GETDATE();
	SELECT DATEDIFF(millisecond,@t1,@t2) AS elapsed_ms;
END;

-- V12
/*
	Retrieves product information for the vendor specified by the given ID.
*/
CREATE OR ALTER FUNCTION GetVendorProductsInformation(@vendorId INT)
RETURNS @information TABLE
(
   ProductId INT,
   ProductName VARCHAR(100),
   Description text,
   UnitPriceEuro DECIMAL(10, 2),
   InventoryLevel INT,
   CategoryId INT,
   CategoryName VARCHAR(100)
)
AS
BEGIN
    INSERT INTO @information
	SELECT p.ProductId, p.ProductName, p.Description, vp.UnitPriceEuro, vp.InventoryLevel, p.CategoryId, p.CategoryName
	FROM VendorToProduct vp
	LEFT OUTER JOIN ProductInformation p
	ON p.ProductId = vp.ProductId
	WHERE vp.VendorId = @vendorId;
	RETURN
END

-- V12 - Test
BEGIN 
	DECLARE @vendorId INT = 200;
	DECLARE @t1 DATETIME;
	DECLARE @t2 DATETIME;
	SET @t1 = GETDATE();
	SELECT * FROM GetVendorProductsInformation(@vendorId);
	SET @t2 = GETDATE();
	SELECT DATEDIFF(millisecond,@t1,@t2) AS elapsed_ms;
END;

--V13
/*
	Adds a product category for the given product of the given vendor.
*/
CREATE OR ALTER PROCEDURE AddProductCategory
@vendorId INT,
@vendorToProductId INT,
@categoryId INT
AS
BEGIN
  	BEGIN TRY 
	  BEGIN TRANSACTION;
	  -- Throw error if the product does not belong to the vendor
	  DECLARE @vendorReferenceCount INT = 0;
	  SELECT @vendorReferenceCount = COUNT(*) FROM VendorToProduct WHERE VendorId = @vendorId AND VendorToProductId = @vendorToProductId;

	  IF @vendorReferenceCount = 0
	  BEGIN
		  THROW 51000, 'The product does not belong to the vendor!', 1;
	  END

	  -- Fetch the product ID and insert a reference if it does not exist
	  DECLARE @productId INT = 0;
	  SELECT @productId = ProductId FROM VendorToProduct WHERE VendorToProductId = @vendorToProductId;
	  EXEC CreateProductCategoryReferenceIfNotExists @productId, @categoryId;
	  COMMIT;
	  RETURN 0;
	END TRY  
	BEGIN CATCH  
	   PRINT 'An error occurred.'; 
	   ROLLBACK;
	   THROW
	END CATCH;
END
GO

-- V13 - Test
BEGIN 
	DECLARE @vendorId INT  = 200, @categoryId INT = 0, @vendorToProductId INT = 20000;
	DECLARE @t1 DATETIME;
	DECLARE @t2 DATETIME;
	SET @t1 = GETDATE();
	EXEC AddProductCategory @vendorId, @vendorToProductId, @categoryId;
	SET @t2 = GETDATE();
	SELECT DATEDIFF(millisecond,@t1,@t2) AS elapsed_ms;
END;

--V14
/*
	Removes the category from the given product of the given vendor.
*/
CREATE OR ALTER PROCEDURE RemoveProductCategory
@vendorId INT,
@vendorToProductId INT,
@categoryId INT
AS
BEGIN
  	BEGIN TRY 
	  BEGIN TRANSACTION;
	  -- Throw error if the product does not belong to the vendor
	  DECLARE @vendorReferenceCount INT = 0;
	  SELECT @vendorReferenceCount = COUNT(*) FROM VendorToProduct WHERE VendorId = @vendorId AND VendorToProductId = @vendorToProductId;

	  IF @vendorReferenceCount = 0
	  BEGIN
		  THROW 51000, 'The product does not belong to the vendor!', 1;
	  END

	  -- Fetch the product ID and remove the category reference
	  DECLARE @productId INT = 0;
	  SELECT @productId = ProductId FROM VendorToProduct WHERE VendorToProductId = @vendorToProductId;
	  DELETE FROM ProductToCategory WHERE ProductId = @productId AND CategoryId = @categoryId;
	  COMMIT;
	  RETURN 0;
	END TRY  
	BEGIN CATCH  
	   PRINT 'An error occurred.'; 
	   ROLLBACK;
	   THROW
	END CATCH;
END
GO

-- V14 - Test
BEGIN 
	DECLARE @vendorId INT  = 200, @categoryId INT = 0, @vendorToProductId INT = 20000;
	DECLARE @t1 DATETIME;
	DECLARE @t2 DATETIME;
	SET @t1 = GETDATE();
	EXEC RemoveProductCategory @vendorId, @vendorToProductId, @categoryId;
	SET @t2 = GETDATE();
	SELECT DATEDIFF(millisecond,@t1,@t2) AS elapsed_ms;
END;