export type UserRole = "Admin" | "FinancialManager" | "Vendor";

export interface VendorItem {
  name: string;
  price: number;
  description?: string;
}

export interface Vendor {
  id: string;
  name: string;
  category: string;
  accountManager: string;
  email: string;
  phone: string;
  address: string;
  items?: VendorItem[];
}

export interface Invoice {
  id: string;
  vendorId: string;
  vendorName: string;
  amount: number;
  date: string;
  status: "Paid" | "Pending" | "Overdue";
  purchaseRequestId?: string;
  billId?: string;
}

export interface Bill {
  id: string;
  purchaseRequestId: string;
  vendorId: string;
  vendorName: string;
  amount: number;
  date: string;
  status: "Due" | "Paid";
  invoiceId?: string;
  paidAt?: string;
  stripePaymentIntentId?: string;
}

export interface Registration {
  id: string;
  companyName: string;
  category: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  registeredDate: string;
  status: "Pending" | "Approved" | "Rejected";
  documents?: {
    license?: string;
    w9?: string;
  };
}

export interface PurchaseRequest {
  id: string;
  vendorId: string;
  vendorName: string;
  date: string;
  items: Array<{
    name: string;
    price: number;
    quantity: number;
  }>;
  totalAmount: number;
  status: "Pending" | "Approved" | "Rejected" | "Delivered";
  createdBy?: string;
}

export interface UserInfo {
  name: string;
  role: UserRole;
  email: string;
  department: string;
  vendorId?: string;
}

export type NotificationType =
  | "registration_submitted"
  | "registration_approved"
  | "registration_rejected"
  | "invoice_created"
  | "purchase_request_created"
  | "purchase_request_accepted"
  | "purchase_request_delivered"
  | "bill_created"
  | "payment_completed";

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  message: string;
  read: boolean;
  createdAt: string;
  metadata?: {
    vendorName?: string;
    invoiceId?: string;
    invoiceAmount?: number;
    purchaseRequestId?: string;
    billId?: string;
    companyName?: string;
  };
}
