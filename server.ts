import "./server/env.js";

import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import {
  hashPassword,
  type PasswordRecord,
  verifyPassword,
  withoutPassword,
} from "./server/auth.js";
import { connectToDatabase, getDb } from "./server/db.js";
import {
  saveRegistrationDocument,
  readRegistrationDocument,
} from "./server/uploads.js";
import {
  Vendor,
  Invoice,
  Bill,
  PurchaseRequest,
  Registration,
  Notification,
  NotificationType,
} from "./src/types.js";
import {
  buildBillFromPurchase,
  buildBillPaidUpdate,
  buildInvoiceFromBill,
} from "./server/billing.js";
import { simulateStripePayment } from "./server/stripe.js";
import {
  generateOTP,
  sendCredentialsEmail,
  sendResetPasswordEmail,
} from "./server/email.js";
import {
  badRequest,
  billStatuses,
  firstError,
  getBody,
  invoiceStatuses,
  notificationTypes,
  purchaseStatuses,
  validateOtp,
  validatePurchaseItems,
  validateRegistrationContact,
  validateVendorItems,
  validateSearch,
  validateStatus,
  validateTodayOrFutureDate,
} from "./server/apiValidation.js";
import { validateStrongPassword } from "./src/utils/password.js";
import {
  documentMimeTypes,
  isRecord,
  parseMoney,
  todayIsoDate,
  validateBase64Document,
  validateDate,
  validateEmail,
  validateFilename,
  validateId,
  validateMimeType,
  validateMoney,
  validateOptionalText,
  validatePassword,
  validatePhone,
  validateQuantity,
  validateRequiredText,
} from "./src/utils/validation.js";

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

function slugId(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 80);
}

function formatDate(): string {
  return new Date().toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function generatePassword(): string {
  return Math.random()
    .toString(36)
    .slice(2, 10)
    .replace(/[^a-zA-Z0-9]/g, "a");
}

// Auth
app.post("/api/auth/login", async (req, res) => {
  try {
    const body = getBody(req);
    const { email, password } = body;
    if (typeof email !== "string" || typeof password !== "string") {
      return badRequest(res, "Email and password are required");
    }

    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);
    if (emailError || passwordError) {
      return badRequest(res, emailError || passwordError || "Invalid request");
    }

    const user = await getDb().collection("users").findOne({ email });
    if (!user || !verifyPassword(user as PasswordRecord, password)) {
      return res.status(401).json({ error: "Invalid credentials." });
    }

    res.json({ user: withoutPassword(user) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Login failed." });
  }
});

// Vendors
app.get("/api/vendors", async (_req, res) => {
  const vendors = await getDb().collection<Vendor>("vendors").find().toArray();
  res.json({ vendors });
});

app.get("/api/vendors/:id", async (req, res) => {
  const idError = validateId(req.params.id, "Vendor ID");
  if (idError) return badRequest(res, idError);

  const vendor = await getDb()
    .collection<Vendor>("vendors")
    .findOne({ id: req.params.id });
  if (vendor) res.json({ vendor });
  else res.status(404).json({ error: "Vendor not found" });
});

app.post("/api/vendors", async (req, res) => {
  const body = getBody(req);
  const name = validateRequiredText(body.name, "Company legal name", {
    max: 120,
  });
  const category = validateRequiredText(body.category, "Business category", {
    max: 80,
  });
  const accountManager = validateRequiredText(
    body.accountManager,
    "Account manager",
    { max: 120 },
  );
  const email = validateEmail(body.email, "Corporate billing email");
  const phone = validatePhone(body.phone, true);
  const address = validateRequiredText(body.address, "Office address", {
    max: 300,
  });
  const error = firstError(
    name,
    category,
    accountManager,
    email,
    phone,
    address,
  );
  if (error) return badRequest(res, error);

  const newVendor: Vendor = {
    id: slugId(name as string),
    name: name as string,
    category: category as string,
    accountManager: accountManager as string,
    email: String(body.email).trim(),
    phone: String(body.phone).trim(),
    address: address as string,
  };
  await getDb().collection("vendors").insertOne(newVendor);
  res.status(201).json({ vendor: newVendor });
});

app.put("/api/vendors/:id", async (req, res) => {
  const idError = validateId(req.params.id, "Vendor ID");
  if (idError) return badRequest(res, idError);

  const body = getBody(req);
  const updates: Partial<Vendor> = {};
  if (body.name !== undefined) {
    const name = validateRequiredText(body.name, "Company legal name", {
      max: 120,
    });
    if (name) return badRequest(res, name);
    updates.name = String(body.name).trim();
  }
  if (body.category !== undefined) {
    const category = validateRequiredText(body.category, "Business category", {
      max: 80,
    });
    if (category) return badRequest(res, category);
    updates.category = String(body.category).trim();
  }
  if (body.accountManager !== undefined) {
    const accountManager = validateRequiredText(
      body.accountManager,
      "Account manager",
      { max: 120 },
    );
    if (accountManager) return badRequest(res, accountManager);
    updates.accountManager = String(body.accountManager).trim();
  }
  if (body.email !== undefined) {
    const email = validateEmail(body.email, "Corporate billing email");
    if (email) return badRequest(res, email);
    updates.email = String(body.email).trim();
  }
  if (body.phone !== undefined) {
    const phone = validatePhone(body.phone, true);
    if (phone) return badRequest(res, phone);
    updates.phone = String(body.phone).trim();
  }
  if (body.address !== undefined) {
    const address = validateRequiredText(body.address, "Office address", {
      max: 300,
    });
    if (address) return badRequest(res, address);
    updates.address = String(body.address).trim();
  }
  if (body.items !== undefined) {
    const itemsResult = validateVendorItems(body.items);
    if (typeof itemsResult === "string") return badRequest(res, itemsResult);
    updates.items = itemsResult.items;
  }

  const result = await getDb()
    .collection<Vendor>("vendors")
    .findOneAndUpdate(
      { id: req.params.id },
      { $set: updates },
      { returnDocument: "after" },
    );
  if (!result) return res.status(404).json({ error: "Vendor not found" });
  res.json({ vendor: result });
});

app.delete("/api/vendors/:id", async (req, res) => {
  const idError = validateId(req.params.id, "Vendor ID");
  if (idError) return badRequest(res, idError);

  const result = await getDb()
    .collection("vendors")
    .deleteOne({ id: req.params.id });
  if (result.deletedCount === 0)
    return res.status(404).json({ error: "Vendor not found" });
  res.json({ success: true });
});

// Invoices
app.get("/api/payments", async (_req, res) => {
  const invoices = await getDb()
    .collection<Invoice>("invoices")
    .find()
    .sort({ date: -1 })
    .toArray();
  res.json({ invoices });
});

app.post("/api/invoices", async (req, res) => {
  const body = getBody(req);
  const vendorId = validateId(body.vendorId, "Vendor ID");
  const amountError = validateMoney(body.amount);
  const date = validateTodayOrFutureDate(body.date, "Invoice date");
  const status = validateStatus(
    body.status ?? "Pending",
    invoiceStatuses,
    "Invoice status",
  );
  const invoiceStatusError = status ? null : `Invalid invoice status`;
  const error = firstError(vendorId, amountError, date, invoiceStatusError);
  if (error) return badRequest(res, error);

  const vendor = await getDb()
    .collection<Vendor>("vendors")
    .findOne({ id: String(body.vendorId).trim() });
  if (!vendor) return res.status(404).json({ error: "Vendor not found" });

  const invoiceId = body.id
    ? validateId(body.id, "Invoice ID")
    : `INV-${Date.now().toString().slice(-6)}`;
  if (body.id && !invoiceId) return badRequest(res, "Invalid invoice ID");

  const newInvoice: Invoice = {
    id: invoiceId as string,
    vendorId: String(body.vendorId).trim(),
    vendorName: vendor.name,
    amount: parseMoney(body.amount) as number,
    date: String(body.date ?? todayIsoDate()).trim(),
    status: status as Invoice["status"],
  };
  await getDb().collection("invoices").insertOne(newInvoice);

  const vendorUser = await getDb()
    .collection("users")
    .findOne({ vendorId: vendor.id });
  if (vendorUser) {
    const notification: Notification = {
      id: `NOTIF-${Date.now().toString().slice(-6)}-${Math.random().toString(36).slice(2, 5)}`,
      userId: vendorUser.email,
      type: "invoice_created",
      message: `New invoice #${newInvoice.id} created for $${newInvoice.amount.toFixed(2)}`,
      read: false,
      createdAt: new Date().toISOString(),
      metadata: {
        vendorName: vendor.name,
        invoiceId: newInvoice.id,
        invoiceAmount: newInvoice.amount,
      },
    };
    await getDb().collection("notifications").insertOne(notification);
  }

  res.status(201).json({ invoice: newInvoice });
});

app.put("/api/invoices/:id", async (req, res) => {
  const idError = validateId(req.params.id, "Invoice ID");
  if (idError) return badRequest(res, idError);

  const body = getBody(req);
  const updates: Partial<Invoice> = {};
  if (body.vendorId !== undefined) {
    const vendorId = validateId(body.vendorId, "Vendor ID");
    if (vendorId) return badRequest(res, vendorId);
    const vendor = await getDb()
      .collection<Vendor>("vendors")
      .findOne({ id: String(body.vendorId).trim() });
    if (!vendor) return res.status(404).json({ error: "Vendor not found" });
    updates.vendorId = String(body.vendorId).trim();
    updates.vendorName = vendor.name;
  }
  if (body.amount !== undefined) {
    const amountError = validateMoney(body.amount);
    if (amountError) return badRequest(res, amountError);
    updates.amount = parseMoney(body.amount) as number;
  }
  if (body.date !== undefined) {
    const date = validateDate(body.date, { allowPast: false });
    if (date) return badRequest(res, date);
    updates.date = String(body.date).trim();
  }
  if (body.status !== undefined) {
    const status = validateStatus(
      body.status,
      invoiceStatuses,
      "Invoice status",
    );
    if (!status) return badRequest(res, "Invalid invoice status");
    updates.status = status;
  }

  const result = await getDb()
    .collection<Invoice>("invoices")
    .findOneAndUpdate(
      { id: req.params.id },
      { $set: updates },
      { returnDocument: "after" },
    );
  if (!result) return res.status(404).json({ error: "Invoice not found" });
  res.json({ invoice: result });
});

app.delete("/api/invoices/:id", async (req, res) => {
  const idError = validateId(req.params.id, "Invoice ID");
  if (idError) return badRequest(res, idError);

  const result = await getDb()
    .collection("invoices")
    .deleteOne({ id: req.params.id });
  if (result.deletedCount === 0)
    return res.status(404).json({ error: "Invoice not found" });
  res.json({ success: true });
});

// Bills
app.get("/api/bills", async (_req, res) => {
  const bills = await getDb()
    .collection<Bill>("bills")
    .find()
    .sort({ date: -1 })
    .toArray();
  res.json({ bills });
});

app.post("/api/bills/:id/pay", async (req, res) => {
  const idError = validateId(req.params.id, "Bill ID");
  if (idError) return badRequest(res, idError);

  const bill = await getDb()
    .collection<Bill>("bills")
    .findOne({ id: req.params.id });

  if (!bill) return res.status(404).json({ error: "Bill not found" });
  if (bill.status === "Paid") {
    return res.status(400).json({ error: "Bill already paid" });
  }
  if (!validateStatus(bill.status, billStatuses, "Bill status")) {
    return res.status(400).json({ error: "Invalid bill status" });
  }
  const amountError = validateMoney(bill.amount);
  if (amountError) return badRequest(res, amountError);

  const payment = await simulateStripePayment(bill.amount);
  if (!payment.success) {
    return res.status(402).json({ error: payment.error || "Payment failed" });
  }

  const invoiceId = `INV-${Date.now().toString().slice(-6)}`;
  const invoice = buildInvoiceFromBill(bill, invoiceId);
  const billUpdate = buildBillPaidUpdate(
    bill,
    invoiceId,
    payment.paymentIntentId,
  );

  await getDb().collection("invoices").insertOne(invoice);
  await getDb()
    .collection("bills")
    .updateOne({ id: bill.id }, { $set: billUpdate });

  const vendorUser = await getDb()
    .collection("users")
    .findOne({ vendorId: bill.vendorId });
  if (vendorUser) {
    const notification: Notification = {
      id: `NOTIF-${Date.now().toString().slice(-6)}-${Math.random().toString(36).slice(2, 5)}`,
      userId: vendorUser.email,
      type: "payment_completed",
      message: `Payment of $${bill.amount.toFixed(2)} received for ${bill.vendorName}. Invoice #${invoiceId} issued.`,
      read: false,
      createdAt: new Date().toISOString(),
      metadata: {
        vendorName: bill.vendorName,
        invoiceId,
        invoiceAmount: bill.amount,
        billId: bill.id,
        purchaseRequestId: bill.purchaseRequestId,
      },
    };
    await getDb().collection("notifications").insertOne(notification);
  }

  res.json({ bill: { ...bill, ...billUpdate }, invoice, payment });
});

// Registrations
app.get("/api/registrations", async (_req, res) => {
  const registrations = await getDb()
    .collection<Registration>("registrations")
    .find()
    .sort({ registeredDate: -1 })
    .toArray();
  res.json({ registrations });
});

app.post("/api/registrations", async (req, res) => {
  const body = getBody(req);
  const registrationContact = validateRegistrationContact(body);
  if (registrationContact.error)
    return badRequest(res, registrationContact.error);

  const count = await getDb().collection("registrations").countDocuments();
  const regId = `REG-${String(count + 1).padStart(3, "0")}`;
  const documentsBase64 = isRecord(body.documentsBase64)
    ? body.documentsBase64
    : {};
  const license = isRecord(documentsBase64.license)
    ? documentsBase64.license
    : {};
  const w9 = isRecord(documentsBase64.w9) ? documentsBase64.w9 : {};

  const licenseData = validateBase64Document(license.data, "Business license");
  const licenseName = validateFilename(
    license.name,
    "Business license filename",
  );
  const licenseMime = validateMimeType(
    license.mimeType,
    documentMimeTypes,
    "Business license",
  );
  const w9Data = validateBase64Document(w9.data, "W-9 document");
  const w9Name = validateFilename(w9.name, "W-9 filename");
  const w9Mime = validateMimeType(
    w9.mimeType,
    documentMimeTypes,
    "W-9 document",
  );
  const documentError = firstError(
    licenseData,
    licenseName,
    licenseMime,
    w9Data,
    w9Name,
    w9Mime,
  );
  if (documentError) return badRequest(res, documentError);

  const documents: Registration["documents"] = {};
  try {
    const savedLicense = await saveRegistrationDocument(regId, "license", {
      name: String(license.name).trim(),
      data: String(license.data).trim(),
      mimeType: String(license.mimeType).trim(),
    });
    const savedW9 = await saveRegistrationDocument(regId, "w9", {
      name: String(w9.name).trim(),
      data: String(w9.data).trim(),
      mimeType: String(w9.mimeType).trim(),
    });
    documents.license = savedLicense.filename;
    documents.w9 = savedW9.filename;
  } catch (err) {
    console.error("Failed to save registration documents:", err);
    return res
      .status(500)
      .json({ error: "Failed to save registration documents" });
  }

  const newReg: Registration = {
    id: regId,
    companyName: registrationContact.companyName,
    category: registrationContact.category,
    contactName: registrationContact.contactName,
    contactEmail: registrationContact.contactEmail,
    contactPhone: registrationContact.contactPhone,
    address: registrationContact.address || "Not provided",
    registeredDate: formatDate(),
    status: "Pending",
    documents,
  };
  await getDb().collection("registrations").insertOne(newReg);

  await createNotificationsForRole(
    "Admin",
    "registration_submitted",
    `New vendor registration: ${newReg.companyName}`,
    { companyName: newReg.companyName },
  );

  res.status(201).json({ registration: newReg });
});

app.get("/api/registrations/:id/documents/:type", async (req, res) => {
  const idError = validateId(req.params.id, "Registration ID");
  if (idError) return badRequest(res, idError);

  const docType = req.params.type;
  if (docType !== "license" && docType !== "w9") {
    return res.status(400).json({ error: "Invalid document type." });
  }

  try {
    const reg = await getDb()
      .collection<Registration>("registrations")
      .findOne({ id: req.params.id });
    if (!reg) return res.status(404).json({ error: "Registration not found" });

    const { data, originalName } = await readRegistrationDocument(
      req.params.id,
      docType,
    );
    const displayName =
      docType === "license"
        ? reg.documents?.license || originalName
        : reg.documents?.w9 || originalName;
    const ext = path.extname(displayName).toLowerCase();
    const mimeTypes: Record<string, string> = {
      ".pdf": "application/pdf",
      ".png": "image/png",
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".webp": "image/webp",
    };

    res.setHeader("Content-Type", mimeTypes[ext] || "application/octet-stream");
    res.setHeader(
      "Content-Disposition",
      `inline; filename="${displayName.replace(/"/g, "")}"`,
    );
    res.send(data);
  } catch {
    res.status(404).json({ error: "Document not found" });
  }
});

// Purchases
app.get("/api/purchases", async (_req, res) => {
  const purchases = await getDb()
    .collection("purchases")
    .find()
    .sort({ date: -1 })
    .toArray();
  res.json({ purchases });
});

app.post("/api/purchases", async (req, res) => {
  const body = getBody(req);
  const vendorId = validateId(body.vendorId, "Vendor ID");
  const date = validateTodayOrFutureDate(body.date, "Purchase date");
  const createdBy = body.createdBy
    ? validateEmail(body.createdBy, "Created by")
    : null;
  const purchaseItems = validatePurchaseItems(body.items);
  if (typeof purchaseItems === "string") return badRequest(res, purchaseItems);

  const purchaseError = firstError(vendorId, date, createdBy);
  if (purchaseError) return badRequest(res, purchaseError);

  const vendor = await getDb()
    .collection<Vendor>("vendors")
    .findOne({ id: String(body.vendorId).trim() });
  if (!vendor) return res.status(404).json({ error: "Vendor not found" });

  const count = await getDb().collection("purchases").countDocuments();
  const newPurchase: PurchaseRequest = {
    id: `PRQ-${String(count + 1).padStart(3, "0")}`,
    vendorId: String(body.vendorId).trim(),
    vendorName: vendor.name,
    date: String(body.date ?? todayIsoDate()).trim(),
    items: purchaseItems.items,
    totalAmount: purchaseItems.totalAmount,
    status: "Pending",
    createdBy: body.createdBy ? String(body.createdBy).trim() : undefined,
  };
  await getDb().collection("purchases").insertOne(newPurchase);

  // Create notification for specific vendor user
  const vendorUser = await getDb()
    .collection("users")
    .findOne({ vendorId: newPurchase.vendorId });
  if (vendorUser) {
    const notification: Notification = {
      id: `NOTIF-${Date.now().toString().slice(-6)}-${Math.random().toString(36).slice(2, 5)}`,
      userId: vendorUser.email,
      type: "purchase_request_created",
      message: `New purchase request #${newPurchase.id} from CLance Solutions`,
      read: false,
      createdAt: new Date().toISOString(),
      metadata: {
        vendorName: newPurchase.vendorName,
        purchaseRequestId: newPurchase.id,
      },
    };
    await getDb().collection("notifications").insertOne(notification);
  }

  res.status(201).json({ purchase: newPurchase });
});

app.put("/api/purchases/:id", async (req, res) => {
  const idError = validateId(req.params.id, "Purchase request ID");
  if (idError) return badRequest(res, idError);

  const existing = await getDb()
    .collection<PurchaseRequest>("purchases")
    .findOne({ id: req.params.id });
  if (!existing)
    return res.status(404).json({ error: "Purchase request not found" });

  const body = getBody(req);
  if (body.status === undefined) {
    return badRequest(res, "Only purchase request status updates are allowed");
  }
  const status = validateStatus(
    body.status,
    purchaseStatuses,
    "Purchase request status",
  );
  if (!status) return badRequest(res, "Invalid purchase request status");

  const result = await getDb()
    .collection("purchases")
    .findOneAndUpdate(
      { id: req.params.id },
      { $set: { status } },
      { returnDocument: "after" },
    );
  if (!result)
    return res.status(404).json({ error: "Purchase request not found" });

  // Create notification for status changes
  if (existing.status !== status) {
    if (status === "Approved" && existing.createdBy) {
      const notification: Notification = {
        id: `NOTIF-${Date.now().toString().slice(-6)}-${Math.random().toString(36).slice(2, 5)}`,
        userId: existing.createdBy,
        type: "purchase_request_accepted",
        message: `Purchase request #${existing.id} accepted by ${existing.vendorName}`,
        read: false,
        createdAt: new Date().toISOString(),
        metadata: {
          vendorName: existing.vendorName,
          purchaseRequestId: existing.id,
        },
      };
      await getDb().collection("notifications").insertOne(notification);
    } else if (status === "Delivered") {
      if (existing.createdBy) {
        const notification: Notification = {
          id: `NOTIF-${Date.now().toString().slice(-6)}-${Math.random().toString(36).slice(2, 5)}`,
          userId: existing.createdBy,
          type: "purchase_request_delivered",
          message: `Purchase request #${existing.id} delivered by ${existing.vendorName}`,
          read: false,
          createdAt: new Date().toISOString(),
          metadata: {
            vendorName: existing.vendorName,
            purchaseRequestId: existing.id,
          },
        };
        await getDb().collection("notifications").insertOne(notification);
      }

      await createBillForDeliveredPurchase(existing);
    }
  }

  res.json({ purchase: result });
});

app.delete("/api/purchases/:id", async (req, res) => {
  const idError = validateId(req.params.id, "Purchase request ID");
  if (idError) return badRequest(res, idError);

  const result = await getDb()
    .collection("purchases")
    .deleteOne({ id: req.params.id });
  if (result.deletedCount === 0)
    return res.status(404).json({ error: "Purchase request not found" });
  res.json({ success: true });
});

app.post("/api/registrations/approve", async (req, res) => {
  const body = getBody(req);
  const idError = validateId(body.id, "Registration ID");
  if (idError) return badRequest(res, idError);

  const reg = await getDb()
    .collection<Registration>("registrations")
    .findOne({ id: String(body.id).trim() });
  if (!reg) return res.status(404).json({ error: "Registration not found" });
  if (reg.status !== "Pending")
    return res.status(400).json({ error: "Registration already processed." });

  await getDb()
    .collection("registrations")
    .updateOne({ id: reg.id }, { $set: { status: "Approved" } });

  const vendorId = slugId(reg.companyName);
  const existing = await getDb()
    .collection("vendors")
    .findOne({ id: vendorId });

  let vendor: Vendor;
  if (!existing) {
    vendor = {
      id: vendorId,
      name: reg.companyName,
      category: reg.category,
      accountManager: reg.contactName,
      email: reg.contactEmail,
      phone: reg.contactPhone,
      address: reg.address,
    };
    await getDb().collection("vendors").insertOne(vendor);
  } else {
    vendor = {
      id: existing.id,
      name: existing.name,
      category: existing.category,
      accountManager: existing.accountManager,
      email: existing.email,
      phone: existing.phone,
      address: existing.address,
    };
  }

  // Generate OTP for vendor login
  const otp = generateOTP();
  const otpExpiry = new Date(Date.now() + 15 * 60000); // 15 minutes

  // Store OTP in database
  await getDb().collection("otps").insertOne({
    email: reg.contactEmail,
    otp,
    expiresAt: otpExpiry,
    used: false,
  });

  // Create vendor user account (password will be set on first login)
  const passwordHash = hashPassword(otp);
  const vendorUser = {
    email: reg.contactEmail,
    ...passwordHash,
    name: reg.contactName,
    role: "Vendor" as const,
    department: reg.companyName,
    vendorId: vendorId,
  };
  const existingVendorUser = await getDb()
    .collection("users")
    .findOne({ email: reg.contactEmail });
  if (existingVendorUser) {
    await getDb()
      .collection("users")
      .updateOne(
        { email: reg.contactEmail },
        {
          $set: {
            ...passwordHash,
            name: reg.contactName,
            role: "Vendor",
            department: reg.companyName,
            vendorId,
          },
        },
      );
  } else {
    await getDb().collection("users").insertOne(vendorUser);
  }

  // Send credentials email
  try {
    await sendCredentialsEmail(reg.contactEmail, reg.contactName, otp);
  } catch (err) {
    console.error("Failed to send email:", err);
  }

  // Create notification for vendor
  const notification: Notification = {
    id: `NOTIF-${Date.now().toString().slice(-6)}-${Math.random().toString(36).slice(2, 5)}`,
    userId: reg.contactEmail,
    type: "registration_approved",
    message: `Your registration for ${reg.companyName} has been approved. Check your email for your one-time login code.`,
    read: false,
    createdAt: new Date().toISOString(),
    metadata: { companyName: reg.companyName },
  };
  await getDb().collection("notifications").insertOne(notification);

  res.json({
    success: true,
    registration: { ...reg, status: "Approved" },
    vendor,
    credentials: { email: reg.contactEmail },
  });
});

app.post("/api/registrations/reject", async (req, res) => {
  const body = getBody(req);
  const idError = validateId(body.id, "Registration ID");
  if (idError) return badRequest(res, idError);

  const reg = await getDb()
    .collection<Registration>("registrations")
    .findOne({ id: String(body.id).trim() });
  if (!reg) return res.status(404).json({ error: "Registration not found" });
  if (reg.status !== "Pending")
    return res.status(400).json({ error: "Registration already processed." });

  await getDb()
    .collection("registrations")
    .updateOne({ id: reg.id }, { $set: { status: "Rejected" } });

  // Create notification for specific vendor user (if exists)
  const vendorUser = await getDb()
    .collection("users")
    .findOne({ email: reg.contactEmail });
  if (vendorUser) {
    const notification: Notification = {
      id: `NOTIF-${Date.now().toString().slice(-6)}-${Math.random().toString(36).slice(2, 5)}`,
      userId: vendorUser.email,
      type: "registration_rejected",
      message: `Your registration for ${reg.companyName} has been rejected`,
      read: false,
      createdAt: new Date().toISOString(),
      metadata: { companyName: reg.companyName },
    };
    await getDb().collection("notifications").insertOne(notification);
  }

  res.json({ success: true, registration: { ...reg, status: "Rejected" } });
});

// Notifications
app.get("/api/notifications", async (req, res) => {
  const userId = Array.isArray(req.query.userId)
    ? req.query.userId[0]
    : req.query.userId;
  if (!userId) return res.status(400).json({ error: "userId required" });
  const userIdError = validateEmail(userId, "User ID");
  if (userIdError) return badRequest(res, userIdError);

  const notifications = await getDb()
    .collection<Notification>("notifications")
    .find({ userId })
    .sort({ createdAt: -1 })
    .toArray();
  res.json({ notifications });
});

app.post("/api/notifications", async (req, res) => {
  const body = getBody(req);
  const userId = validateEmail(body.userId, "User ID");
  const type = validateStatus(
    body.type,
    notificationTypes,
    "Notification type",
  );
  if (!type) return badRequest(res, "Invalid notification type");
  const message = validateRequiredText(body.message, "Message", { max: 240 });
  const notificationError = firstError(userId, message);
  if (notificationError) return badRequest(res, notificationError);

  const newNotification: Notification = {
    id: `NOTIF-${Date.now().toString().slice(-6)}`,
    userId: String(body.userId).trim(),
    type,
    message: String(body.message).trim(),
    read: false,
    createdAt: new Date().toISOString(),
    metadata: isRecord(body.metadata) ? body.metadata : undefined,
  };

  await getDb().collection("notifications").insertOne(newNotification);
  res.status(201).json({ notification: newNotification });
});

app.post("/api/notifications/read", async (req, res) => {
  const body = getBody(req);
  const userId = validateEmail(body.userId, "User ID");
  if (userId) return badRequest(res, userId);
  const notificationIds = Array.isArray(body.notificationIds)
    ? body.notificationIds
    : [];
  if (notificationIds.length > 0) {
    const invalidId = notificationIds.find((id) =>
      validateId(id, "Notification ID"),
    );
    if (invalidId)
      return badRequest(
        res,
        validateId(invalidId, "Notification ID") as string,
      );
  }

  const filter: any = { userId: String(body.userId).trim() };
  if (notificationIds.length > 0) {
    filter.id = { $in: notificationIds.map(String) };
  }

  await getDb().collection("notifications").deleteMany(filter);
  res.json({ success: true });
});

app.delete("/api/notifications/:id", async (req, res) => {
  const idError = validateId(req.params.id, "Notification ID");
  if (idError) return badRequest(res, idError);

  const result = await getDb()
    .collection("notifications")
    .deleteOne({ id: req.params.id });
  if (result.deletedCount === 0)
    return res.status(404).json({ error: "Notification not found" });
  res.json({ success: true });
});

// Change password
app.post("/api/users/password", async (req, res) => {
  const body = getBody(req);
  const email = validateEmail(body.email, "Email");
  const currentPassword = validatePassword(
    body.currentPassword,
    "Current password",
  );
  const newPassword = validateStrongPassword(
    String(body.newPassword ?? ""),
    "New password",
  );
  const passwordError = firstError(email, currentPassword, newPassword);
  if (passwordError) return badRequest(res, passwordError);

  const user = await getDb()
    .collection("users")
    .findOne({ email: String(body.email).trim() });
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  if (!verifyPassword(user as PasswordRecord, String(body.currentPassword))) {
    return res.status(401).json({ error: "Current password is incorrect" });
  }

  if (verifyPassword(user as PasswordRecord, String(body.newPassword))) {
    return res.status(400).json({
      error: "New password must be different from your current password",
    });
  }

  const passwordHash = hashPassword(String(body.newPassword));
  await getDb()
    .collection("users")
    .updateOne(
      { email: String(body.email).trim() },
      { $set: passwordHash, $unset: { password: "" } },
    );

  res.json({ success: true });
});

// Forgot password - send OTP
app.post("/api/auth/forgot-password", async (req, res) => {
  const body = getBody(req);
  const email = validateEmail(body.email, "Email");
  if (email) return badRequest(res, email);

  const user = await getDb()
    .collection("users")
    .findOne({ email: String(body.email).trim() });
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  if (user.role === "Admin") {
    return res.status(403).json({ error: "Admin password reset not allowed" });
  }

  const otp = generateOTP();
  const otpExpiry = new Date(Date.now() + 15 * 60000); // 15 minutes

  // Store or update OTP
  await getDb()
    .collection("otps")
    .updateOne(
      { email: String(body.email).trim() },
      {
        $set: {
          email: String(body.email).trim(),
          otp,
          expiresAt: otpExpiry,
          used: false,
        },
      },
      { upsert: true },
    );

  // Send reset email
  try {
    await sendResetPasswordEmail(String(body.email).trim(), user.name, otp);
    res.json({ success: true });
  } catch (err) {
    console.error("Failed to send reset email:", err);
    res.status(500).json({ error: "Failed to send reset email" });
  }
});

// Verify OTP and reset password
app.post("/api/auth/reset-password", async (req, res) => {
  const body = getBody(req);
  const email = validateEmail(body.email, "Email");
  const otpError = validateOtp(body.otp);
  const newPassword = validateStrongPassword(
    String(body.newPassword ?? ""),
    "New password",
  );
  const resetError = firstError(email, otpError, newPassword);
  if (resetError) return badRequest(res, resetError);

  const trimmedEmail = String(body.email).trim();
  const user = await getDb()
    .collection("users")
    .findOne({ email: trimmedEmail });
  if (!user || user.role === "Admin") {
    return res.status(404).json({ error: "User not found" });
  }

  const otpRecord = await getDb()
    .collection("otps")
    .findOne({
      email: trimmedEmail,
      otp: String(body.otp).trim(),
      used: false,
    });

  if (!otpRecord) {
    return res.status(400).json({ error: "Invalid OTP" });
  }

  if (otpRecord.expiresAt < new Date()) {
    return res.status(400).json({ error: "OTP expired" });
  }

  if (verifyPassword(user as PasswordRecord, String(body.newPassword))) {
    return res.status(400).json({
      error: "New password must be different from your current password",
    });
  }

  // Update password and mark OTP as used
  const passwordHash = hashPassword(String(body.newPassword));
  await getDb()
    .collection("users")
    .updateOne(
      { email: trimmedEmail },
      { $set: passwordHash, $unset: { password: "" } },
    );

  await getDb()
    .collection("otps")
    .updateOne(
      { email: trimmedEmail, otp: String(body.otp).trim() },
      { $set: { used: true } },
    );

  res.json({ success: true });
});

// Helper to create notifications for user roles
async function createBillForDeliveredPurchase(purchase: PurchaseRequest) {
  const existingBill = await getDb()
    .collection<Bill>("bills")
    .findOne({ purchaseRequestId: purchase.id });
  if (existingBill) return existingBill;

  const count = await getDb().collection("bills").countDocuments();
  const bill = buildBillFromPurchase(
    purchase,
    `BILL-${String(count + 1).padStart(3, "0")}`,
  );
  await getDb().collection("bills").insertOne(bill);

  await createNotificationsForRole(
    "FinancialManager",
    "bill_created",
    `Bill #${bill.id} due for ${bill.vendorName}: $${bill.amount.toFixed(2)}`,
    {
      vendorName: bill.vendorName,
      billId: bill.id,
      invoiceAmount: bill.amount,
      purchaseRequestId: bill.purchaseRequestId,
    },
  );

  return bill;
}

async function createNotificationsForRole(
  role: "Admin" | "FinancialManager" | "Vendor",
  type: NotificationType,
  message: string,
  metadata?: any,
) {
  const users = await getDb().collection("users").find({ role }).toArray();
  for (const user of users) {
    const notification: Notification = {
      id: `NOTIF-${Date.now().toString().slice(-6)}-${Math.random().toString(36).slice(2, 5)}`,
      userId: user.email,
      type,
      message,
      read: false,
      createdAt: new Date().toISOString(),
      metadata,
    };
    await getDb().collection("notifications").insertOne(notification);
  }
}

app.get("/api/health", async (_req, res) => {
  try {
    const db = getDb();
    const collections = await db.listCollections().toArray();
    res.json({
      status: "ok",
      database: db.databaseName,
      collections: collections.map((c) => c.name),
    });
  } catch {
    res.status(503).json({ status: "error", database: "disconnected" });
  }
});

async function startServer() {
  await connectToDatabase();

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[VMS] Server running at http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("[VMS] Failed to start:", err.message);
  process.exit(1);
});
