import 'reflect-metadata';
import { injectable } from 'inversify';
import { CreateVendorProductRequestBody } from '../../models/request.bodies/vendor.request.bodies/create.vendor.product.request.body/create.vendor.product.request.body';
import { AddVendorProductCategoryRequestBody } from '../../models/request.bodies/vendor.request.bodies/create.vendor.product.request.body/add.vendor.product.category.request.body';
import { UpdateVendorProductRequestBody } from '../../models/request.bodies/vendor.request.bodies/update.vendor.product.request.body';

@injectable()
/**
 * The form-data (HTTP) conversion service.
 */
export class FormDataConversionService {
    /**
     * Converts the form data (HTTP) to a request body with data needed to create a vendor product.
     * @param body The form-data (HTTP) body.
     * @returns The converted body.
     */
    public convertToCreateVendorProductRequestBody(body): CreateVendorProductRequestBody {
        try {
            if (body.vendorId === undefined || body.vendorId === null) {
                throw new Error("Property vendorId cannot be empty!");
            }

            if (body.unitPriceEuro === undefined || body.unitPriceEuro === null) {
                throw new Error("Property unitPriceEuro cannot be empty!");
            }

            if (body.inventoryLevel === undefined || body.inventoryLevel === null) {
                throw new Error("Property unitPriceEuro cannot be empty!");
            }

            if (body.name === undefined || body.name === null || body.name.length === 0) {
                throw new Error("Property name cannot be empty!");
            }

            if (body.description === undefined || body.description === null || body.description.length === 0) {
                throw new Error("Property description cannot be empty!");
            }

            if (body.categories === undefined || body.categories === null) {
                throw new Error("Property categories cannot be empty!");
            }

            let vendorId = Number(body.vendorId);
            let unitPriceEuro = Number(body.unitPriceEuro);
            let inventoryLevel = Number(body.inventoryLevel);
            let name = String(body.name);
            let description = String(body.description);
            let jsonParsed = JSON.parse(body.categories);
            let categories = jsonParsed as AddVendorProductCategoryRequestBody[];
            let result = { vendorId: vendorId, unitPriceEuro: unitPriceEuro, inventoryLevel: inventoryLevel, name: name, description: description, categories: categories } as CreateVendorProductRequestBody;
            return result;
        }
        catch (err) {
            throw err;
        }
    }

    /**
     * Converts the form data (HTTP) to a request body with data needed to update a vendor product.
     * @param body The form-data (HTTP) body.
     * @returns The converted body.
     */
    public convertToUpdateVendorProductRequestBody(body): UpdateVendorProductRequestBody {
        try {
            if (body.vendorId === undefined || body.vendorId === null) {
                throw new Error("Property vendorId cannot be empty!");
            }

            if (body.vendorToProductId === undefined || body.vendorToProductId === null) {
                throw new Error("Property vendorToProductId cannot be empty!");
            }

            if (body.unitPriceEuro === undefined || body.unitPriceEuro === null) {
                throw new Error("Property unitPriceEuro cannot be empty!");
            }

            if (body.inventoryLevel === undefined || body.inventoryLevel === null) {
                throw new Error("Property unitPriceEuro cannot be empty!");
            }

            if (body.name === undefined || body.name === null || body.name.length === 0) {
                throw new Error("Property name cannot be empty!");
            }

            if (body.description === undefined || body.description === null || body.description.length === 0) {
                throw new Error("Property description cannot be empty!");
            }

            let vendorId = Number(body.vendorId);
            let vendorToProductId = Number(body.vendorToProductId);
            let unitPriceEuro = Number(body.unitPriceEuro);
            let inventoryLevel = Number(body.inventoryLevel);
            let name = String(body.name);
            let description = String(body.description);
            let result = { vendorId: vendorId, vendorToProductId: vendorToProductId, unitPriceEuro: unitPriceEuro, inventoryLevel: inventoryLevel, name: name, description: description } as UpdateVendorProductRequestBody;
            return result;
        }
        catch (err) {
            throw err;
        }
    }
}