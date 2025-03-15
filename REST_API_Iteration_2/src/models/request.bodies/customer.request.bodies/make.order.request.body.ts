/**
 * The make order request body.
 */
export interface MakeOrderRequestBody {
    customerId: number;
    shoppingCartId: number;
    billingAddressId: number;
    courierCompanyId: number;
}