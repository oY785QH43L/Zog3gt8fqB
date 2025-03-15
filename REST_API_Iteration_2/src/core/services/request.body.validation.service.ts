import 'reflect-metadata';
import { injectable } from 'inversify';
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
import { UpdateVendorProductRequestBody } from '../../models/request.bodies/vendor.request.bodies/update.vendor.product.request.body';
import { AddCategoryRequestBody } from '../../models/request.bodies/vendor.request.bodies/add.category.request.body';
import { RemoveCategoryRequestBody } from '../../models/request.bodies/vendor.request.bodies/remove.category.request.body';
import { CreateCourierRequestBody } from '../../models/request.bodies/admin.request.bodies/create.courier.request.body/create.courier.request.body';
import { CreateCourierAddressRequestBody } from '../../models/request.bodies/admin.request.bodies/create.courier.request.body/create.courier.address.request.body';
import { UpdateCourierRequestBody } from '../../models/request.bodies/admin.request.bodies/update.courier.request.body';
import { AddCourierAddressRequestBody } from '../../models/request.bodies/admin.request.bodies/add.courier.address.request.body';
import { UpdateCourierAddressRequestBody } from '../../models/request.bodies/admin.request.bodies/update.courier.address.request.body';
import { RemoveCourierAddressRequestBody } from '../../models/request.bodies/admin.request.bodies/remove.courier.address.request.body';
import { CreateCategoryRequestBody } from '../../models/request.bodies/admin.request.bodies/create.category.request.body';
import { UpdateCategoryRequestBody } from '../../models/request.bodies/admin.request.bodies/update.category.request.body';
import { AddRecommendationRequestBody } from '../../models/request.bodies/admin.request.bodies/add.recommendation.request.body';
import { UpdateRecommendationRequestBody } from '../../models/request.bodies/admin.request.bodies/update.recommendation.request.body';
import { CreateReviewRequestBody } from '../../models/request.bodies/customer.request.bodies/create.review.request.body';
import { UpdateReviewRequestBody } from '../../models/request.bodies/customer.request.bodies/update.review.request.body';

@injectable()
/**
 * The request body validation service.
 */
export class RequestBodyValidationService {
    /**
     * Validates the given request body.
     * @param body The request body.
     */
    public validateCreateCustomerRequestBody(body: CreateCustomerRequestBody) {
        if (body.firstName === undefined || body.firstName === null || body.firstName.length == 0) {
            throw new Error("Property firstName cannot be empty!");
        }

        if (body.lastName === undefined || body.lastName === null || body.lastName.length == 0) {
            throw new Error("Property lastName cannot be empty!");
        }

        if (body.userName === undefined || body.userName === null || body.userName.length == 0) {
            throw new Error("Property userName cannot be empty!");
        }

        if (body.password === undefined || body.password === null || body.password.length == 0) {
            throw new Error("Property password cannot be empty!");
        }

        if (body.phoneNumber === undefined || body.phoneNumber === null || body.phoneNumber.length == 0) {
            throw new Error("Property phoneNumber cannot be empty!");
        }

        if (body.email === undefined || body.email === null || body.email.length == 0) {
            throw new Error("Property email cannot be empty!");
        }

        if (body.addresses.length == 0) {
            return;
        }

        for (let address of body.addresses) {
            this.validateCreateAddressRequestBody(address);
        }
    }

    /**
     * Validates the given request body.
     * @param body The request body.
     */
    public validateCreateAddressRequestBody(body: CreateCustomerAddressRequestBody) {
        if (body.city === undefined || body.city === null || body.city.length == 0) {
            throw new Error("Property city cannot be empty!");
        }

        if (body.country === undefined || body.country === null || body.country.length == 0) {
            throw new Error("Property country cannot be empty!");
        }

        if (body.postalCode === undefined || body.postalCode === null || body.postalCode.length == 0) {
            throw new Error("Property postalCode cannot be empty!");
        }

        if (body.street === undefined || body.street === null || body.street.length == 0) {
            throw new Error("Property street cannot be empty!");
        }
    }

    /**
     * Validates the given request body.
     * @param body The request body.
     */
    public validateLoginRequestBody(body: LoginCustomerRequestBody) {
        if (body.userName === undefined || body.userName === null || body.userName.length == 0) {
            throw new Error("Property userName cannot be empty!");
        }

        if (body.password === undefined || body.password === null || body.password.length == 0) {
            throw new Error("Property password cannot be empty!");
        }
    }

    /**
     * Validates the given request body.
     * @param body The request body.
     */
    public validateUpdateCustomerRequestBody(body: UpdateCustomerRequestBody) {
        if (body.customerId === undefined || body.customerId === null) {
            throw new Error("Property customerId cannot be empty!");
        }

        if (body.firstName === undefined || body.firstName === null || body.firstName.length == 0) {
            throw new Error("Property firstName cannot be empty!");
        }

        if (body.lastName === undefined || body.lastName === null || body.lastName.length == 0) {
            throw new Error("Property lastName cannot be empty!");
        }

        if (body.userName === undefined || body.userName === null || body.userName.length == 0) {
            throw new Error("Property userName cannot be empty!");
        }

        if (body.password === undefined || body.password === null || body.password.length == 0) {
            throw new Error("Property password cannot be empty!");
        }

        if (body.phoneNumber === undefined || body.phoneNumber === null || body.phoneNumber.length == 0) {
            throw new Error("Property phoneNumber cannot be empty!");
        }

        if (body.email === undefined || body.email === null || body.email.length == 0) {
            throw new Error("Property email cannot be empty!");
        }
    }

    /**
     * Validates the given request body.
     * @param body The request body.
     */
    public validateAddCustomerAddressRequestBody(body: AddCustomerAddressRequestBody) {
        if (body.customerId === undefined || body.customerId === null) {
            throw new Error("Property customerId cannot be empty!");
        }

        if (body.city === undefined || body.city === null || body.city.length == 0) {
            throw new Error("Property city cannot be empty!");
        }

        if (body.country === undefined || body.country === null || body.country.length == 0) {
            throw new Error("Property country cannot be empty!");
        }

        if (body.postalCode === undefined || body.postalCode === null || body.postalCode.length == 0) {
            throw new Error("Property postalCode cannot be empty!");
        }

        if (body.street === undefined || body.street === null || body.street.length == 0) {
            throw new Error("Property street cannot be empty!");
        }
    }

    /**
     * Validates the given request body.
     * @param body The request body.
     */
    public validateUpdateCustomerAddressRequestBody(body: UpdateCustomerAddressRequestBody) {
        if (body.customerId === undefined || body.customerId === null) {
            throw new Error("Property customerId cannot be empty!");
        }

        if (body.addressId === undefined || body.addressId === null) {
            throw new Error("Property addressId cannot be empty!");
        }

        if (body.city === undefined || body.city === null || body.city.length == 0) {
            throw new Error("Property city cannot be empty!");
        }

        if (body.country === undefined || body.country === null || body.country.length == 0) {
            throw new Error("Property country cannot be empty!");
        }

        if (body.postalCode === undefined || body.postalCode === null || body.postalCode.length == 0) {
            throw new Error("Property postalCode cannot be empty!");
        }

        if (body.street === undefined || body.street === null || body.street.length == 0) {
            throw new Error("Property street cannot be empty!");
        }
    }

    /**
     * Validates the given request body.
     * @param body The request body.
     */
    public validateAddProductToCartRequestBody(body: AddProductToCartRequestBody) {
        if (body.customerId === undefined || body.customerId === null) {
            throw new Error("Property customerId cannot be empty!");
        }

        if (body.vendorToProductId === undefined || body.vendorToProductId === null) {
            throw new Error("Property vendorToProductId cannot be empty!");
        }

        if (body.shoppingCartId === undefined || body.shoppingCartId === null) {
            throw new Error("Property shoppingCartId cannot be empty!");
        }

        if (body.amount === undefined || body.amount === null) {
            throw new Error("Property shoppingCartId cannot be empty!");
        }

        if (Number(body.amount) <= 0) {
            throw new Error("Property amount cannot be 0 or negative!");
        }
    }

    /**
     * Validates the given request body.
     * @param body The request body.
     */
    public validateRemoveProductFromCartRequestBody(body: RemoveProductFromCartRequestBody) {
        if (body.customerId === undefined || body.customerId === null) {
            throw new Error("Property customerId cannot be empty!");
        }

        if (body.vendorToProductId === undefined || body.vendorToProductId === null) {
            throw new Error("Property vendorToProductId cannot be empty!");
        }

        if (body.shoppingCartId === undefined || body.shoppingCartId === null) {
            throw new Error("Property shoppingCartId cannot be empty!");
        }

        if (body.amount === undefined || body.amount === null) {
            throw new Error("Property shoppingCartId cannot be empty!");
        }

        if (Number(body.amount) <= 0) {
            throw new Error("Property amount cannot be 0 or negative!");
        }
    }

    /**
     * Validates the given request body.
     * @param body The request body.
     */
    public validateMakeOrderRequestBody(body: MakeOrderRequestBody) {
        if (body.customerId === undefined || body.customerId === null) {
            throw new Error("Property customerId cannot be empty!");
        }

        if (body.shoppingCartId === undefined || body.shoppingCartId === null) {
            throw new Error("Property shoppingCartId cannot be empty!");
        }

        if (body.billingAddressId === undefined || body.billingAddressId === null) {
            throw new Error("Property billingAddressId cannot be empty!");
        }

        if (body.courierCompanyId === undefined || body.courierCompanyId === null) {
            throw new Error("Property courierCompanyId cannot be empty!");
        }
    }

    /**
     * Validates the given request body.
     * @param body The request body.
     */
    public validateCreateVendorRequestBody(body: CreateVendorRequestBody) {
        if (body.name === undefined || body.name === null || body.name.length == 0) {
            throw new Error("Property name cannot be empty!");
        }

        if (body.userName === undefined || body.userName === null || body.userName.length == 0) {
            throw new Error("Property userName cannot be empty!");
        }

        if (body.password === undefined || body.password === null || body.password.length == 0) {
            throw new Error("Property password cannot be empty!");
        }

        if (body.phoneNumber === undefined || body.phoneNumber === null || body.phoneNumber.length == 0) {
            throw new Error("Property phoneNumber cannot be empty!");
        }

        if (body.email === undefined || body.email === null || body.email.length == 0) {
            throw new Error("Property email cannot be empty!");
        }

        if (body.addresses.length == 0) {
            return;
        }

        for (let address of body.addresses) {
            this.validateCreateVendorAddressRequestBody(address);
        }
    }

    /**
     * Validates the given request body.
     * @param body The request body.
     */
    public validateCreateVendorAddressRequestBody(body: CreateVendorAddressRequestBody) {
        if (body.city === undefined || body.city === null || body.city.length == 0) {
            throw new Error("Property city cannot be empty!");
        }

        if (body.country === undefined || body.country === null || body.country.length == 0) {
            throw new Error("Property country cannot be empty!");
        }

        if (body.postalCode === undefined || body.postalCode === null || body.postalCode.length == 0) {
            throw new Error("Property postalCode cannot be empty!");
        }

        if (body.street === undefined || body.street === null || body.street.length == 0) {
            throw new Error("Property street cannot be empty!");
        }
    }

    /**
     * Validates the given request body.
     * @param body The request body.
     */
    public validateVendorLoginRequestBody(body: LoginVendorRequestBody) {
        if (body.userName === undefined || body.userName === null || body.userName.length == 0) {
            throw new Error("Property userName cannot be empty!");
        }

        if (body.password === undefined || body.password === null || body.password.length == 0) {
            throw new Error("Property password cannot be empty!");
        }
    }

    /**
     * Validates the given request body.
     * @param body The request body.
     */
    public validateUpdateVendorRequestBody(body: UpdateVendorRequestBody) {
        if (body.vendorId === undefined || body.vendorId === null) {
            throw new Error("Property vendorId cannot be empty!");
        }

        if (body.name === undefined || body.name === null || body.name.length == 0) {
            throw new Error("Property name cannot be empty!");
        }

        if (body.userName === undefined || body.userName === null || body.userName.length == 0) {
            throw new Error("Property userName cannot be empty!");
        }

        if (body.password === undefined || body.password === null || body.password.length == 0) {
            throw new Error("Property password cannot be empty!");
        }

        if (body.phoneNumber === undefined || body.phoneNumber === null || body.phoneNumber.length == 0) {
            throw new Error("Property phoneNumber cannot be empty!");
        }

        if (body.email === undefined || body.email === null || body.email.length == 0) {
            throw new Error("Property email cannot be empty!");
        }
    }

    /**
     * Validates the given request body.
     * @param body The request body.
     */
    public validateAddVendorAddressRequestBody(body: AddVendorAddressRequestBody) {
        if (body.vendorId === undefined || body.vendorId === null) {
            throw new Error("Property vendorId cannot be empty!");
        }

        if (body.city === undefined || body.city === null || body.city.length == 0) {
            throw new Error("Property city cannot be empty!");
        }

        if (body.country === undefined || body.country === null || body.country.length == 0) {
            throw new Error("Property country cannot be empty!");
        }

        if (body.postalCode === undefined || body.postalCode === null || body.postalCode.length == 0) {
            throw new Error("Property postalCode cannot be empty!");
        }

        if (body.street === undefined || body.street === null || body.street.length == 0) {
            throw new Error("Property street cannot be empty!");
        }
    }

    /**
     * Validates the given request body.
     * @param body The request body.
     */
    public validateUpdateVendorAddressRequestBody(body: UpdateVendorAddressRequestBody) {
        if (body.vendorId === undefined || body.vendorId === null) {
            throw new Error("Property vendorId cannot be empty!");
        }

        if (body.addressId === undefined || body.addressId === null) {
            throw new Error("Property addressId cannot be empty!");
        }

        if (body.city === undefined || body.city === null || body.city.length == 0) {
            throw new Error("Property city cannot be empty!");
        }

        if (body.country === undefined || body.country === null || body.country.length == 0) {
            throw new Error("Property country cannot be empty!");
        }

        if (body.postalCode === undefined || body.postalCode === null || body.postalCode.length == 0) {
            throw new Error("Property postalCode cannot be empty!");
        }

        if (body.street === undefined || body.street === null || body.street.length == 0) {
            throw new Error("Property street cannot be empty!");
        }
    }

    /**
     * Validates the given request body.
     * @param body The request body.
     */
    public validateCreateVendorProductRequestBody(body: CreateVendorProductRequestBody) {
        if (body.vendorId === undefined || body.vendorId === null) {
            throw new Error("Property vendorId cannot be empty!");
        }

        if (body.unitPriceEuro === undefined || body.unitPriceEuro === null) {
            throw new Error("Property unitPriceEuro cannot be empty!");
        }

        if (body.unitPriceEuro <= 0) {
            throw new Error("Property unitPriceEuro cannot be less or equal to 0!");
        }

        if (body.inventoryLevel === undefined || body.inventoryLevel === null) {
            throw new Error("Property unitPriceEuro cannot be empty!");
        }

        if (body.inventoryLevel < 0) {
            throw new Error("Property inventoryLevel cannot be less than 0!");
        }

        if (body.name === undefined || body.name === null || body.name.length === 0) {
            throw new Error("Property name cannot be empty!");
        }

        if (body.description === undefined || body.description === null || body.description.length === 0) {
            throw new Error("Property description cannot be empty!");
        }

        for (let el of body.categories) {
            if (el.categoryId === undefined || el.categoryId === null) {
                throw new Error("Property categoryId cannot be empty!");
            }
        }
    }

    /**
     * Validates the given request body.
     * @param body The request body.
     */
    public validateUpdateVendorProductRequestBody(body: UpdateVendorProductRequestBody) {
        if (body.vendorId === undefined || body.vendorId === null) {
            throw new Error("Property vendorId cannot be empty!");
        }

        if (body.unitPriceEuro === undefined || body.unitPriceEuro === null) {
            throw new Error("Property unitPriceEuro cannot be empty!");
        }

        if (body.unitPriceEuro <= 0) {
            throw new Error("Property unitPriceEuro cannot be less or equal to 0!");
        }

        if (body.inventoryLevel === undefined || body.inventoryLevel === null) {
            throw new Error("Property unitPriceEuro cannot be empty!");
        }

        if (body.inventoryLevel < 0) {
            throw new Error("Property inventoryLevel cannot be less than 0!");
        }

        if (body.name === undefined || body.name === null || body.name.length === 0) {
            throw new Error("Property name cannot be empty!");
        }

        if (body.description === undefined || body.description === null || body.description.length === 0) {
            throw new Error("Property description cannot be empty!");
        }
    }

    /**
     * Validates the given request body.
     * @param body The request body.
     */
    public validateAddCategoryRequestBody(body: AddCategoryRequestBody) {
        if (body.vendorId === undefined || body.vendorId === null) {
            throw new Error("Property vendorId cannot be empty!");
        }

        if (body.vendorToProductId === undefined || body.vendorToProductId === null) {
            throw new Error("Property vendorToProductId cannot be empty!");
        }

        if (body.categoryId === undefined || body.categoryId === null) {
            throw new Error("Property categoryId cannot be empty!");
        }
    }

    /**
     * Validates the given request body.
     * @param body The request body.
     */
    public validateRemoveCategoryRequestBody(body: RemoveCategoryRequestBody) {
        if (body.vendorId === undefined || body.vendorId === null) {
            throw new Error("Property vendorId cannot be empty!");
        }

        if (body.vendorToProductId === undefined || body.vendorToProductId === null) {
            throw new Error("Property vendorToProductId cannot be empty!");
        }

        if (body.categoryId === undefined || body.categoryId === null) {
            throw new Error("Property categoryId cannot be empty!");
        }
    }

    /**
     * Validates the given request body.
     * @param body The request body.
     */
    public validateCreateCourierRequestBody(body: CreateCourierRequestBody) {
        if (body.adminId === undefined || body.adminId === null) {
            throw new Error("Property adminId cannot be empty!");
        }

        if (body.name === undefined || body.name === null || body.name.length == 0) {
            throw new Error("Property name cannot be empty!");
        }

        if (body.phoneNumber === undefined || body.phoneNumber === null || body.phoneNumber.length == 0) {
            throw new Error("Property phoneNumber cannot be empty!");
        }

        if (body.email === undefined || body.email === null || body.email.length == 0) {
            throw new Error("Property email cannot be empty!");
        }

        if (body.addresses.length == 0) {
            return;
        }

        for (let address of body.addresses) {
            this.validateCreateCourierAddressRequestBody(address);
        }
    }

    /**
     * Validates the given request body.
     * @param body The request body.
     */
    public validateCreateCourierAddressRequestBody(body: CreateCourierAddressRequestBody) {
        if (body.city === undefined || body.city === null || body.city.length == 0) {
            throw new Error("Property city cannot be empty!");
        }

        if (body.country === undefined || body.country === null || body.country.length == 0) {
            throw new Error("Property country cannot be empty!");
        }

        if (body.postalCode === undefined || body.postalCode === null || body.postalCode.length == 0) {
            throw new Error("Property postalCode cannot be empty!");
        }

        if (body.street === undefined || body.street === null || body.street.length == 0) {
            throw new Error("Property street cannot be empty!");
        }
    }

    /**
     * Validates the given request body.
     * @param body The request body.
     */
    public validateUpdateCourierRequestBody(body: UpdateCourierRequestBody) {
        if (body.adminId === undefined || body.adminId === null) {
            throw new Error("Property adminId cannot be empty!");
        }

        if (body.name === undefined || body.name === null || body.name.length == 0) {
            throw new Error("Property name cannot be empty!");
        }

        if (body.phoneNumber === undefined || body.phoneNumber === null || body.phoneNumber.length == 0) {
            throw new Error("Property phoneNumber cannot be empty!");
        }

        if (body.email === undefined || body.email === null || body.email.length == 0) {
            throw new Error("Property email cannot be empty!");
        }
    }

    /**
     * Validates the given request body.
     * @param body The request body.
     */
    public validateAddCourierAddressRequestBody(body: AddCourierAddressRequestBody) {
        if (body.adminId === undefined || body.adminId === null) {
            throw new Error("Property adminId cannot be empty!");
        }

        if (body.courierId === undefined || body.courierId === null) {
            throw new Error("Property courierId cannot be empty!");
        }

        if (body.city === undefined || body.city === null || body.city.length == 0) {
            throw new Error("Property city cannot be empty!");
        }

        if (body.country === undefined || body.country === null || body.country.length == 0) {
            throw new Error("Property country cannot be empty!");
        }

        if (body.postalCode === undefined || body.postalCode === null || body.postalCode.length == 0) {
            throw new Error("Property postalCode cannot be empty!");
        }

        if (body.street === undefined || body.street === null || body.street.length == 0) {
            throw new Error("Property street cannot be empty!");
        }
    }

    /**
     * Validates the given request body.
     * @param body The request body.
     */
    public validateUpdateCourierAddressRequestBody(body: UpdateCourierAddressRequestBody) {
        if (body.adminId === undefined || body.adminId === null) {
            throw new Error("Property adminId cannot be empty!");
        }

        if (body.addressId === undefined || body.addressId === null) {
            throw new Error("Property addressId cannot be empty!");
        }

        if (body.courierId === undefined || body.courierId === null) {
            throw new Error("Property courierId cannot be empty!");
        }

        if (body.city === undefined || body.city === null || body.city.length == 0) {
            throw new Error("Property city cannot be empty!");
        }

        if (body.country === undefined || body.country === null || body.country.length == 0) {
            throw new Error("Property country cannot be empty!");
        }

        if (body.postalCode === undefined || body.postalCode === null || body.postalCode.length == 0) {
            throw new Error("Property postalCode cannot be empty!");
        }

        if (body.street === undefined || body.street === null || body.street.length == 0) {
            throw new Error("Property street cannot be empty!");
        }
    }

    /**
     * Validates the given request body.
     * @param body The request body.
     */
    public validateRemoveCourierAddressRequestBody(body: RemoveCourierAddressRequestBody) {
        if (body.adminId === undefined || body.adminId === null) {
            throw new Error("Property adminId cannot be empty!");
        }

        if (body.addressId === undefined || body.addressId === null) {
            throw new Error("Property addressId cannot be empty!");
        }

        if (body.courierId === undefined || body.courierId === null) {
            throw new Error("Property courierId cannot be empty!");
        }
    }

    /**
     * Validates the given request body.
     * @param body The request body.
     */
    public validateCreateCategoryRequestBody(body: CreateCategoryRequestBody) {
        if (body.adminId === undefined || body.adminId === null) {
            throw new Error("Property adminId cannot be empty!");
        }

        if (body.name === undefined || body.name === null || body.name.length === 0) {
            throw new Error("Property name cannot be empty!");
        }
    }

    /**
     * Validates the given request body.
     * @param body The request body.
     */
    public validateUpdateCategoryRequestBody(body: UpdateCategoryRequestBody) {
        if (body.adminId === undefined || body.adminId === null) {
            throw new Error("Property adminId cannot be empty!");
        }

        if (body.categoryId === undefined || body.categoryId === null) {
            throw new Error("Property categoryId cannot be empty!");
        }

        if (body.name === undefined || body.name === null || body.name.length === 0) {
            throw new Error("Property name cannot be empty!");
        }
    }

    /**
     * Validates the given request body.
     * @param body The request body.
     */
    public validateAddRecommendationRequestBody(body: AddRecommendationRequestBody) {
        if (body.adminId === undefined || body.adminId === null) {
            throw new Error("Property adminId cannot be empty!");
        }

        if (body.customerId === undefined || body.customerId === null) {
            throw new Error("Property customerId cannot be empty!");
        }

        if (body.vendorToProductId === undefined || body.vendorToProductId === null) {
            throw new Error("Property vendorToProductId cannot be empty!");
        }

        if (body.purchaseProbability === undefined || body.purchaseProbability === null) {
            throw new Error("Property purchaseProbability cannot be empty!");
        }

        if (!(body.purchaseProbability >= 0 && body.purchaseProbability <= 1)) {
            throw new Error("Property purchaseProbability must be between 0 and 1!");
        }
    }

    /**
     * Validates the given request body.
     * @param body The request body.
     */
    public validateUpdateRecommendationRequestBody(body: UpdateRecommendationRequestBody) {
        if (body.adminId === undefined || body.adminId === null) {
            throw new Error("Property adminId cannot be empty!");
        }

        if (body.recommendationId === undefined || body.recommendationId === null) {
            throw new Error("Property recommendationId cannot be empty!");
        }

        if (body.customerId === undefined || body.customerId === null) {
            throw new Error("Property customerId cannot be empty!");
        }

        if (body.vendorToProductId === undefined || body.vendorToProductId === null) {
            throw new Error("Property vendorToProductId cannot be empty!");
        }

        if (body.purchaseProbability === undefined || body.purchaseProbability === null) {
            throw new Error("Property purchaseProbability cannot be empty!");
        }

        if (!(body.purchaseProbability >= 0 && body.purchaseProbability <= 1)) {
            throw new Error("Property purchaseProbability must be between 0 and 1!");
        }
    }

    /**
     * Validates the given request body.
     * @param body The request body.
     */
    public validateCreateReviewRequestBody(body: CreateReviewRequestBody) {
        if (body.customerId === undefined || body.customerId === null) {
            throw new Error("Property customerId cannot be empty!");
        }

        if (body.vendorToProductId === undefined || body.vendorToProductId === null) {
            throw new Error("Property vendorToProductId cannot be empty!");
        }

        if (body.reviewText === undefined || body.reviewText === null || body.reviewText.length == 0) {
            throw new Error("Property reviewText cannot be empty!");
        }

        if (body.rating === undefined || body.rating === null) {
            throw new Error("Property rating cannot be empty!");
        }

        if (!(body.rating >= 1 && body.rating <= 10)) {
            throw new Error("Property rating must be between 1 and 10!");
        }
    }

    /**
     * Validates the given request body.
     * @param body The request body.
     */
    public validateUpdateReviewRequestBody(body: UpdateReviewRequestBody) {
        if (body.reviewId === undefined || body.reviewId === null) {
            throw new Error("Property reviewId cannot be empty!");
        }

        if (body.customerId === undefined || body.customerId === null) {
            throw new Error("Property customerId cannot be empty!");
        }

        if (body.vendorToProductId === undefined || body.vendorToProductId === null) {
            throw new Error("Property vendorToProductId cannot be empty!");
        }

        if (body.reviewText === undefined || body.reviewText === null || body.reviewText.length == 0) {
            throw new Error("Property reviewText cannot be empty!");
        }

        if (body.rating === undefined || body.rating === null) {
            throw new Error("Property rating cannot be empty!");
        }

        if (!(body.rating >= 1 && body.rating <= 10)) {
            throw new Error("Property rating must be between 1 and 10!");
        }
    }
}