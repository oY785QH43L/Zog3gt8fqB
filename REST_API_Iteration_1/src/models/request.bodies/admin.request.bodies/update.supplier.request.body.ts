/**
 * The update supplier request body.
 */
export interface UpdateSupplierRequestBody {
    adminId: number,
    supplierId: number,
    name: string,
    email: string,
    phoneNumber: string,
}