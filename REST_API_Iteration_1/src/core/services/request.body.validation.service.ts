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
}