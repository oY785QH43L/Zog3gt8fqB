import { Schema } from "mongoose";
import { ICustomerAction } from "../mongodb.interfaces/customer.action.mongodb.interface";

/**
 * The customer action schema (MongoDB).
 */
const customerActionSchema = new Schema<ICustomerAction>({
    customerActionId: { type: Number, required: true },
    customerId: { type: Number, required: true },
    vendorToProductId: { type: Number, required: true },
    actionType: { type: String, required: true },
    actionDate: { type: Date, required: true }
});

export default customerActionSchema;