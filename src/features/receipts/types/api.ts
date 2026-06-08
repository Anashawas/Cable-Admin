export interface UtilityInvoiceRequest {
  email: string;
  phone: string;
  customerName: string;
  serviceName: string;
  totalAmount: number;
  paymentDate: string;
  durationFrom: string;
  durationTo: string;
  invoiceName: string;
  titleName: string;
  privacyName: string;
  year: number;
}
