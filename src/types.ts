export type UserRole = 'Admin' | 'FinancialManager' | 'Vendor';

export interface Vendor {
  id: string;
  name: string;
  category: string;
  accountManager: string;
  email: string;
  phone: string;
  address: string;
}

export interface Invoice {
  id: string;
  vendorId: string;
  vendorName: string;
  amount: number;
  date: string;
  status: 'Paid' | 'Pending' | 'Overdue';
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
  status: 'Pending' | 'Approved' | 'Rejected';
}

export interface UserInfo {
  name: string;
  role: UserRole;
  email: string;
  department: string;
  vendorId?: string;
}
