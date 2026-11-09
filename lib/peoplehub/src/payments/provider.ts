/**
 * Phase 1 intentionally does not process or simulate payments.
 * A real provider must return a verified external order, not an active status.
 *
 * Razorpay integration:
 * - create orders server-side using an authenticated provider SDK.
 * - verify checkout signature with timing-safe HMAC.
 * - verify raw webhook signature before parsing and enforce event idempotency.
 * - match order, amount, currency and tenant before activating a subscription.
 */
export const paymentProvider = {
  name:"stub",
  async createOrder(_input:{organisation_id:string,plan_key:string,billing_cycle:string}) {
    return {provider:"stub",status:"pending_payment",payment_enabled:false,message:"Online payments are not connected yet. Your request is pending payment. Please contact the PeopleHub team to arrange activation."};
  },
};
