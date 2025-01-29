import { injectable } from 'inversify';
import 'reflect-metadata';
import { DataTypes, Sequelize } from "sequelize";
import { Customer } from '../../models/customer.model';
import { CreateCustomerRequestBody } from '../../models/request.bodies/customer.request.bodies/create.customer.request.body/create.customer.request.body';
import { CreateCustomerAddressRequestBody } from '../../models/request.bodies/customer.request.bodies/create.customer.request.body/create.customer.address.request.body';
import { LoginCustomerRequestBody } from '../../models/request.bodies/customer.request.bodies/login.customer.request.body';
import { UpdateCustomerRequestBody } from '../../models/request.bodies/customer.request.bodies/update.customer.request.body';
import { AddCustomerAddressRequestBody } from '../../models/request.bodies/customer.request.bodies/add.customer.address.request.body';
import { UpdateCustomerAddressRequestBody } from '../../models/request.bodies/customer.request.bodies/update.customer.address.request.body';
import { AddProductToCartRequestBody } from '../../models/request.bodies/customer.request.bodies/add.product.to.cart.request.body';
import { RemoveProductFromCartRequestBody } from '../../models/request.bodies/customer.request.bodies/remove.product.from.cart.request.body';
import { MakeOrderRequestBody } from '../../models/request.bodies/customer.request.bodies/make.order.request.body';
import { CreateVendorRequestBody } from '../../models/request.bodies/vendor.request.bodies/create.vendor.request.body/create.vendor.request.body';
import { CreateVendorAddressRequestBody } from '../../models/request.bodies/vendor.request.bodies/create.vendor.request.body/create.vendor.address.request.body';
import { LoginVendorRequestBody } from '../../models/request.bodies/vendor.request.bodies/login.vendor.request.body';
import { UpdateVendorRequestBody } from '../../models/request.bodies/vendor.request.bodies/update.vendor.request.body';
import { AddVendorAddressRequestBody } from '../../models/request.bodies/vendor.request.bodies/add.vendor.address.request.body';
import { UpdateVendorAddressRequestBody } from '../../models/request.bodies/vendor.request.bodies/update.vendor.address.request.body';
import { CreateVendorProductRequestBody } from '../../models/request.bodies/vendor.request.bodies/create.vendor.product.request.body/create.vendor.product.request.body';

/**
 * The customers service.
 */
@injectable()
export class RequestBodyValidationService {
    public validateCreateCustomerRequestBody(body: CreateCustomerRequestBody){
        if (body.firstName === undefined || body.firstName === null || body.firstName.length == 0){
            throw new Error("Property firstName cannot be empty!");
        }

        if (body.lastName === undefined || body.lastName === null || body.lastName.length == 0){
            throw new Error("Property lastName cannot be empty!");
        }

        if (body.userName === undefined || body.userName === null || body.userName.length == 0){
            throw new Error("Property userName cannot be empty!");
        }

        if (body.password === undefined || body.password === null || body.password.length == 0){
            throw new Error("Property password cannot be empty!");
        }

        if (body.phoneNumber === undefined || body.phoneNumber === null || body.phoneNumber.length == 0){
            throw new Error("Property phoneNumber cannot be empty!");
        }

        if (body.email === undefined || body.email === null || body.email.length == 0){
            throw new Error("Property email cannot be empty!");
        }

        if (body.addresses.length == 0){
            return;
        }

        for (let address of body.addresses){
            this.validateCreateAddressRequestBody(address);
        }
    }

    public validateCreateAddressRequestBody(body: CreateCustomerAddressRequestBody){
        if (body.city === undefined || body.city === null || body.city.length == 0){
            throw new Error("Property city cannot be empty!");
        }

        if (body.country === undefined || body.country === null || body.country.length == 0){
            throw new Error("Property country cannot be empty!");
        }

        if (body.postalCode === undefined || body.postalCode === null || body.postalCode.length == 0){
            throw new Error("Property postalCode cannot be empty!");
        }

        if (body.street === undefined || body.street === null || body.street.length == 0){
            throw new Error("Property street cannot be empty!");
        }
    }

    public validateLoginRequestBody(body: LoginCustomerRequestBody){
        if (body.userName === undefined || body.userName === null || body.userName.length == 0){
            throw new Error("Property userName cannot be empty!");
        }

        if (body.password === undefined || body.password === null || body.password.length == 0){
            throw new Error("Property password cannot be empty!");
        }
    }

    public validateUpdateCustomerRequestBody(body: UpdateCustomerRequestBody){
        if (body.customerId === undefined || body.customerId === null){
            throw new Error("Property customerId cannot be empty!");
        }

        if (body.firstName === undefined || body.firstName === null || body.firstName.length == 0){
            throw new Error("Property firstName cannot be empty!");
        }

        if (body.lastName === undefined || body.lastName === null || body.lastName.length == 0){
            throw new Error("Property lastName cannot be empty!");
        }

        if (body.userName === undefined || body.userName === null || body.userName.length == 0){
            throw new Error("Property userName cannot be empty!");
        }

        if (body.password === undefined || body.password === null || body.password.length == 0){
            throw new Error("Property password cannot be empty!");
        }

        if (body.phoneNumber === undefined || body.phoneNumber === null || body.phoneNumber.length == 0){
            throw new Error("Property phoneNumber cannot be empty!");
        }

        if (body.email === undefined || body.email === null || body.email.length == 0){
            throw new Error("Property email cannot be empty!");
        }
    }

    public validateAddCustomerAddressRequestBody(body: AddCustomerAddressRequestBody){
        if (body.customerId === undefined || body.customerId === null){
            throw new Error("Property customerId cannot be empty!");
        }

        if (body.city === undefined || body.city === null || body.city.length == 0){
            throw new Error("Property city cannot be empty!");
        }

        if (body.country === undefined || body.country === null || body.country.length == 0){
            throw new Error("Property country cannot be empty!");
        }

        if (body.postalCode === undefined || body.postalCode === null || body.postalCode.length == 0){
            throw new Error("Property postalCode cannot be empty!");
        }

        if (body.street === undefined || body.street === null || body.street.length == 0){
            throw new Error("Property street cannot be empty!");
        }
    }

    public validateUpdateCustomerAddressRequestBody(body: UpdateCustomerAddressRequestBody){
        if (body.customerId === undefined || body.customerId === null){
            throw new Error("Property customerId cannot be empty!");
        }

        if (body.addressId === undefined || body.addressId === null){
            throw new Error("Property addressId cannot be empty!");
        }

        if (body.city === undefined || body.city === null || body.city.length == 0){
            throw new Error("Property city cannot be empty!");
        }

        if (body.country === undefined || body.country === null || body.country.length == 0){
            throw new Error("Property country cannot be empty!");
        }

        if (body.postalCode === undefined || body.postalCode === null || body.postalCode.length == 0){
            throw new Error("Property postalCode cannot be empty!");
        }

        if (body.street === undefined || body.street === null || body.street.length == 0){
            throw new Error("Property street cannot be empty!");
        }
    }

    public validateAddProductToCartRequestBody(body: AddProductToCartRequestBody){
        if (body.customerId === undefined || body.customerId === null){
            throw new Error("Property customerId cannot be empty!");
        }

        if (body.vendorToProductId === undefined || body.vendorToProductId === null){
            throw new Error("Property vendorToProductId cannot be empty!");
        }

        if (body.shoppingCartId === undefined || body.shoppingCartId === null){
            throw new Error("Property shoppingCartId cannot be empty!");
        }

        if (body.amount === undefined || body.amount === null){
            throw new Error("Property shoppingCartId cannot be empty!");
        }

        if (Number(body.amount) <= 0){
            throw new Error("Property amount cannot be 0 or negative!");
        }
    }

    public validateRemoveProductFromCartRequestBody(body: RemoveProductFromCartRequestBody){
        if (body.customerId === undefined || body.customerId === null){
            throw new Error("Property customerId cannot be empty!");
        }

        if (body.vendorToProductId === undefined || body.vendorToProductId === null){
            throw new Error("Property vendorToProductId cannot be empty!");
        }

        if (body.shoppingCartId === undefined || body.shoppingCartId === null){
            throw new Error("Property shoppingCartId cannot be empty!");
        }

        if (body.amount === undefined || body.amount === null){
            throw new Error("Property shoppingCartId cannot be empty!");
        }

        if (Number(body.amount) <= 0){
            throw new Error("Property amount cannot be 0 or negative!");
        }
    }

    public validateMakeOrderRequestBody(body: MakeOrderRequestBody){
        if (body.customerId === undefined || body.customerId === null){
            throw new Error("Property customerId cannot be empty!");
        }

        if (body.shoppingCartId === undefined || body.shoppingCartId === null){
            throw new Error("Property shoppingCartId cannot be empty!");
        }

        if (body.billingAddressId === undefined || body.billingAddressId === null){
            throw new Error("Property billingAddressId cannot be empty!");
        }

        if (body.supplierCompanyId === undefined || body.supplierCompanyId === null){
            throw new Error("Property supplierCompanyId cannot be empty!");
        }
    }

    public validateCreateVendorRequestBody(body: CreateVendorRequestBody){
        if (body.name === undefined || body.name === null || body.name.length == 0){
            throw new Error("Property name cannot be empty!");
        }

        if (body.userName === undefined || body.userName === null || body.userName.length == 0){
            throw new Error("Property userName cannot be empty!");
        }

        if (body.password === undefined || body.password === null || body.password.length == 0){
            throw new Error("Property password cannot be empty!");
        }

        if (body.phoneNumber === undefined || body.phoneNumber === null || body.phoneNumber.length == 0){
            throw new Error("Property phoneNumber cannot be empty!");
        }

        if (body.email === undefined || body.email === null || body.email.length == 0){
            throw new Error("Property email cannot be empty!");
        }

        if (body.addresses.length == 0){
            return;
        }

        for (let address of body.addresses){
            this.validateCreateVendorAddressRequestBody(address);
        }
    }

    public validateCreateVendorAddressRequestBody(body: CreateVendorAddressRequestBody){
        if (body.city === undefined || body.city === null || body.city.length == 0){
            throw new Error("Property city cannot be empty!");
        }

        if (body.country === undefined || body.country === null || body.country.length == 0){
            throw new Error("Property country cannot be empty!");
        }

        if (body.postalCode === undefined || body.postalCode === null || body.postalCode.length == 0){
            throw new Error("Property postalCode cannot be empty!");
        }

        if (body.street === undefined || body.street === null || body.street.length == 0){
            throw new Error("Property street cannot be empty!");
        }
    }

    public validateVendorLoginRequestBody(body: LoginVendorRequestBody){
        if (body.userName === undefined || body.userName === null || body.userName.length == 0){
            throw new Error("Property userName cannot be empty!");
        }

        if (body.password === undefined || body.password === null || body.password.length == 0){
            throw new Error("Property password cannot be empty!");
        }
    }

    public validateUpdateVendorRequestBody(body: UpdateVendorRequestBody){
        if (body.vendorId === undefined || body.vendorId === null){
            throw new Error("Property vendorId cannot be empty!");
        }

        if (body.name === undefined || body.name === null || body.name.length == 0){
            throw new Error("Property name cannot be empty!");
        }

        if (body.userName === undefined || body.userName === null || body.userName.length == 0){
            throw new Error("Property userName cannot be empty!");
        }

        if (body.password === undefined || body.password === null || body.password.length == 0){
            throw new Error("Property password cannot be empty!");
        }

        if (body.phoneNumber === undefined || body.phoneNumber === null || body.phoneNumber.length == 0){
            throw new Error("Property phoneNumber cannot be empty!");
        }

        if (body.email === undefined || body.email === null || body.email.length == 0){
            throw new Error("Property email cannot be empty!");
        }
    }

    public validateAddVendorAddressRequestBody(body: AddVendorAddressRequestBody){
        if (body.vendorId === undefined || body.vendorId === null){
            throw new Error("Property vendorId cannot be empty!");
        }

        if (body.city === undefined || body.city === null || body.city.length == 0){
            throw new Error("Property city cannot be empty!");
        }

        if (body.country === undefined || body.country === null || body.country.length == 0){
            throw new Error("Property country cannot be empty!");
        }

        if (body.postalCode === undefined || body.postalCode === null || body.postalCode.length == 0){
            throw new Error("Property postalCode cannot be empty!");
        }

        if (body.street === undefined || body.street === null || body.street.length == 0){
            throw new Error("Property street cannot be empty!");
        }
    }

    public validateUpdateVendorAddressRequestBody(body: UpdateVendorAddressRequestBody){
        if (body.vendorId === undefined || body.vendorId === null){
            throw new Error("Property vendorId cannot be empty!");
        }

        if (body.addressId === undefined || body.addressId === null){
            throw new Error("Property addressId cannot be empty!");
        }

        if (body.city === undefined || body.city === null || body.city.length == 0){
            throw new Error("Property city cannot be empty!");
        }

        if (body.country === undefined || body.country === null || body.country.length == 0){
            throw new Error("Property country cannot be empty!");
        }

        if (body.postalCode === undefined || body.postalCode === null || body.postalCode.length == 0){
            throw new Error("Property postalCode cannot be empty!");
        }

        if (body.street === undefined || body.street === null || body.street.length == 0){
            throw new Error("Property street cannot be empty!");
        }
    }

    public validateCreateVendorProductRequestBody(body: CreateVendorProductRequestBody){
        if (body.vendorId === undefined || body.vendorId === null){
            throw new Error("Property vendorId cannot be empty!");
        }

        if (body.unitPriceEuro === undefined || body.unitPriceEuro === null){
            throw new Error("Property unitPriceEuro cannot be empty!");
        }

        if (body.unitPriceEuro <= 0){
            throw new Error("Property unitPriceEuro cannot be less or equal to 0!");
        }

        if (body.inventoryLevel === undefined || body.inventoryLevel === null){
            throw new Error("Property unitPriceEuro cannot be empty!");
        }

        if (body.inventoryLevel < 0){
            throw new Error("Property inventoryLevel cannot be less than 0!");
        }   
        
        if (body.name === undefined || body.name === null || body.name.length === 0){
            throw new Error("Property name cannot be empty!");
        }

        if (body.description === undefined || body.description === null || body.description.length === 0){
            throw new Error("Property description cannot be empty!");
        }

        for (let el of body.categories){
            if (el.categoryId === undefined || el.categoryId === null){
                throw new Error("Property categoryId cannot be empty!");
            }
        }
    }
}