import { Db } from "mongodb";

export async function seedDatabase(db: Db): Promise<void> {
  const vendors = db.collection("vendors");
  const count = await vendors.countDocuments();
  if (count > 0) return;

  console.log("[MongoDB] Seeding initial data...");

  await vendors.insertMany([
    {
      id: "techflow",
      name: "TechFlow Solutions Inc.",
      category: "Cloud Services",
      accountManager: "Sarah J. Montgomery",
      email: "sarah.m@techflow.com",
      phone: "+1 (555) 012-3456",
      address: "450 Innovation Way, Austin, TX 78701",
    },
    {
      id: "aws",
      name: "AWS",
      category: "Cloud Services",
      accountManager: "James Davidson",
      email: "j.davidson@aws.amazon.com",
      phone: "+1 (800) 280-4852",
      address: "410 Terry Ave N, Seattle, WA 98109",
    },
    {
      id: "dishome",
      name: "Dishome Fibernet",
      category: "ISP / Network",
      accountManager: "Sujan Chhetri",
      email: "sujan.c@dishome.com.np",
      phone: "+977 (1) 421-5588",
      address: "Bakhundole, Lalitpur, Nepal",
    },
  ]);

  await db.collection("invoices").insertMany([
    {
      id: "INV-2024-089",
      vendorId: "techflow",
      vendorName: "TechFlow Solutions Inc.",
      amount: 4250.0,
      date: "2023-10-24",
      status: "Paid",
    },
    {
      id: "INV-2024-092",
      vendorId: "dishome",
      vendorName: "Dishome Fibernet",
      amount: 12800.0,
      date: "2023-10-27",
      status: "Pending",
    },
    {
      id: "INV-2024-077",
      vendorId: "techflow",
      vendorName: "TechFlow Solutions Inc.",
      amount: 890.15,
      date: "2023-10-12",
      status: "Overdue",
    },
  ]);

  await db.collection("registrations").insertMany([
    {
      id: "REG-001",
      companyName: "Nexus IT Solutions",
      category: "Cloud Infrastructure",
      contactName: "Alex Mercer",
      contactEmail: "alex@nexusits.com",
      contactPhone: "+1 (555) 791-0023",
      address: "100 Tech Park, San Jose, CA",
      registeredDate: "Oct 24, 2023",
      status: "Pending",
    },
  ]);

  await db.collection("users").insertMany([
    {
      email: "admin@clance.com",
      password: "admin123",
      name: "Admin",
      role: "Admin",
      department: "Administration",
    },
    {
      email: "finance@clance.com",
      password: "finance123",
      name: "Maria Chen",
      role: "FinancialManager",
      department: "Finance",
    },
    {
      email: "partner@techflow.com",
      password: "vendor123",
      name: "Sarah J. Montgomery",
      role: "Vendor",
      department: "TechFlow Solutions",
      vendorId: "techflow",
    },
  ]);

  console.log("[MongoDB] Seed complete.");
}
