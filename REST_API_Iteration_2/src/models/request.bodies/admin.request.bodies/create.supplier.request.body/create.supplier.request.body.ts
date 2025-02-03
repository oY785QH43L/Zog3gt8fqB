import { CreateSupplierAddressRequestBody } from "./create.supplier.address.request.body";

export interface CreateSupplierRequestBody{
    adminId: number;
    name: string;
    email: string;
    phoneNumber: string;
    addresses: CreateSupplierAddressRequestBody[];
}