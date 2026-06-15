import { Db } from "mongodb";
import { seedSampleDocuments } from "./uploads.js";

export async function seedDatabase(db: Db): Promise<void> {
  console.log("[MongoDB] Seeding initial data...");

  // Drop or clear collections to ensure fresh schema and test users are always loaded
  await db.collection("vendors").deleteMany({});
  await db.collection("invoices").deleteMany({});
  await db.collection("bills").deleteMany({});
  await db.collection("registrations").deleteMany({});
  await db.collection("users").deleteMany({});
  await db.collection("purchases").deleteMany({});
  await db.collection("notifications").deleteMany({});
  await db.collection("otps").deleteMany({});

  await db.collection("vendors").insertMany([
    {
      id: "techflow",
      name: "TechFlow Solutions Inc.",
      category: "Cloud Services",
      accountManager: "Sarah J. Montgomery",
      email: "sarah.m@techflow.com",
      phone: "+1 (555) 012-3456",
      address: "450 Innovation Way, Austin, TX 78701",
      items: [
        {
          name: "Cloud Migrations Package",
          price: 2499.0,
          description: "Full stack lift-and-shift to AWS/GCP",
        },
        {
          name: "Managed Kubernetes Support (Monthly)",
          price: 850.0,
          description: "24/7 cluster monitoring and updates",
        },
        {
          name: "Security Compliance Audit",
          price: 1200.0,
          description: "Detailed report on ISO27001/SOC2 compliance gaps",
        },
      ],
    },
    {
      id: "aws",
      name: "AWS",
      category: "Cloud Services",
      accountManager: "James Davidson",
      email: "j.davidson@aws.amazon.com",
      phone: "+1 (800) 280-4852",
      address: "410 Terry Ave N, Seattle, WA 98109",
      items: [
        {
          name: "EC2 Reserved Instance (t3.xlarge)",
          price: 85.0,
          description: "1-year upfront reserved compute instance",
        },
        {
          name: "Enterprise Support Subscription",
          price: 1500.0,
          description: "Direct access to AWS solutions architects",
        },
        {
          name: "Amazon S3 Bulk Storage (10TB)",
          price: 220.0,
          description: "S3 Standard object storage tier",
        },
      ],
    },
    {
      id: "dishome",
      name: "Dishome Fibernet",
      category: "ISP / Network",
      accountManager: "Sujan Chhetri",
      email: "sujan.c@dishome.com.np",
      phone: "+977 (1) 421-5588",
      address: "Bakhundole, Lalitpur, Nepal",
      items: [
        {
          name: "Corporate Direct Fiber 200Mbps",
          price: 180.0,
          description: "Dedicated leased line with 99.9% SLA",
        },
        {
          name: "Static IP Pool (/28 subnet)",
          price: 25.0,
          description: "13 usable static public IP addresses",
        },
        {
          name: "NetTV Commercial Connection",
          price: 12.0,
          description: "IPTV stream package for lobby displays",
        },
      ],
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

  const nexusDocuments = await seedSampleDocuments("REG-001");

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
      documents: {
        license: nexusDocuments.license,
        w9: nexusDocuments.w9,
      },
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
      email: "finance2@clance.com",
      password: "financepassword",
      name: "Alex Rivera",
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
    {
      email: "supplier@dishome.com.np",
      password: "vendorpassword",
      name: "Sujan Chhetri",
      role: "Vendor",
      department: "Dishome Fibernet",
      vendorId: "dishome",
    },
    {
      email: "kushalthapa759@gmail.com",
      password: "testpassword",
      name: "Kushal Thapa",
      role: "Vendor",
      department: "Test Vendor",
      vendorId: "testvendor",
    },
  ]);

  await db.collection("purchases").insertMany([
    {
      id: "PRQ-001",
      vendorId: "techflow",
      vendorName: "TechFlow Solutions Inc.",
      date: "2023-11-01",
      items: [
        {
          name: "Managed Kubernetes Support (Monthly)",
          price: 850.0,
          quantity: 2,
        },
      ],
      totalAmount: 1700.0,
      status: "Approved",
    },
    {
      id: "PRQ-002",
      vendorId: "dishome",
      vendorName: "Dishome Fibernet",
      date: "2023-11-05",
      items: [
        { name: "Corporate Direct Fiber 200Mbps", price: 180.0, quantity: 1 },
        { name: "Static IP Pool (/28 subnet)", price: 25.0, quantity: 2 },
      ],
      totalAmount: 230.0,
      status: "Pending",
    },
  ]);

  console.log("[MongoDB] Seed complete.");
}
