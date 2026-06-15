import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { connectToDatabase, getDb } from "./server/db.js";
import {
  saveRegistrationDocument,
  readRegistrationDocument,
} from "./server/uploads.js";
import {
  Vendor,
  Invoice,
  Registration,
  Notification,
  NotificationType,
} from "./src/types.js";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

function slugId(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function formatDate(): string {
  return new Date().toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// Auth
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password, role } = req.body;
    const user = await getDb()
      .collection("users")
      .findOne({ email, password, role });
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials or role." });
    }
    const { password: _, _id, ...safeUser } = user;
    res.json({ user: safeUser });
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
  const vendor = await getDb()
    .collection<Vendor>("vendors")
    .findOne({ id: req.params.id });
  if (vendor) res.json({ vendor });
  else res.status(404).json({ error: "Vendor not found" });
});

app.post("/api/vendors", async (req, res) => {
  const newVendor: Vendor = {
    id: slugId(req.body.name || "vendor"),
    name: req.body.name,
    category: req.body.category || "General",
    accountManager: req.body.accountManager || "Assigned Manager",
    email: req.body.email || "contact@vendor.com",
    phone: req.body.phone || "+1 (555) 000-0000",
    address: req.body.address || "Main Headquarters",
  };
  await getDb().collection("vendors").insertOne(newVendor);
  res.status(201).json({ vendor: newVendor });
});

app.put("/api/vendors/:id", async (req, res) => {
  const result = await getDb()
    .collection<Vendor>("vendors")
    .findOneAndUpdate(
      { id: req.params.id },
      { $set: req.body },
      { returnDocument: "after" },
    );
  if (!result) return res.status(404).json({ error: "Vendor not found" });
  res.json({ vendor: result });
});

app.delete("/api/vendors/:id", async (req, res) => {
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
  const vendor = await getDb()
    .collection<Vendor>("vendors")
    .findOne({ id: req.body.vendorId });
  const newInvoice: Invoice = {
    id: req.body.id || `INV-${Date.now().toString().slice(-6)}`,
    vendorId: req.body.vendorId,
    vendorName: vendor?.name || req.body.vendorName || "Unknown",
    amount: parseFloat(req.body.amount),
    date: req.body.date || new Date().toISOString().split("T")[0],
    status: req.body.status || "Pending",
  };
  await getDb().collection("invoices").insertOne(newInvoice);

  // Create notification for specific vendor user
  if (vendor) {
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
  }

  res.status(201).json({ invoice: newInvoice });
});

app.put("/api/invoices/:id", async (req, res) => {
  const result = await getDb()
    .collection<Invoice>("invoices")
    .findOneAndUpdate(
      { id: req.params.id },
      { $set: req.body },
      { returnDocument: "after" },
    );
  if (!result) return res.status(404).json({ error: "Invoice not found" });
  res.json({ invoice: result });
});

app.delete("/api/invoices/:id", async (req, res) => {
  const result = await getDb()
    .collection("invoices")
    .deleteOne({ id: req.params.id });
  if (result.deletedCount === 0)
    return res.status(404).json({ error: "Invoice not found" });
  res.json({ success: true });
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
  const count = await getDb().collection("registrations").countDocuments();
  const regId = `REG-${String(count + 1).padStart(3, "0")}`;

  const documents: Registration["documents"] = {};
  const { documentsBase64, ...registrationBody } = req.body;

  if (documentsBase64?.license?.data) {
    const saved = await saveRegistrationDocument(
      regId,
      "license",
      documentsBase64.license,
    );
    documents.license = saved.filename;
  } else if (registrationBody.documents?.license) {
    documents.license = registrationBody.documents.license;
  }

  if (documentsBase64?.w9?.data) {
    const saved = await saveRegistrationDocument(
      regId,
      "w9",
      documentsBase64.w9,
    );
    documents.w9 = saved.filename;
  } else if (registrationBody.documents?.w9) {
    documents.w9 = registrationBody.documents.w9;
  }

  const newReg: Registration = {
    id: regId,
    companyName: registrationBody.companyName || "Unknown Vendor",
    category: registrationBody.category || "General",
    contactName: registrationBody.contactName || "John Doe",
    contactEmail: registrationBody.contactEmail || "contact@vendor.com",
    contactPhone: registrationBody.contactPhone || "None",
    address: registrationBody.address || "Not provided",
    registeredDate: formatDate(),
    status: "Pending",
    documents,
  };
  await getDb().collection("registrations").insertOne(newReg);

  // Create notification for admins
  await createNotificationsForRole(
    "Admin",
    "registration_submitted",
    `New vendor registration: ${registrationBody.companyName || "Unknown Vendor"}`,
    { companyName: registrationBody.companyName },
  );

  res.status(201).json({ registration: newReg });
});

app.get("/api/registrations/:id/documents/:type", async (req, res) => {
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
  const count = await getDb().collection("purchases").countDocuments();
  const newPurchase = {
    id: `PRQ-${String(count + 1).padStart(3, "0")}`,
    vendorId: req.body.vendorId,
    vendorName: req.body.vendorName,
    date: req.body.date || new Date().toISOString().split("T")[0],
    items: req.body.items || [],
    totalAmount: parseFloat(req.body.totalAmount || 0),
    status: req.body.status || "Pending",
    createdBy: req.body.createdBy,
  };
  await getDb().collection("purchases").insertOne(newPurchase);

  // Create notification for specific vendor user
  const vendorUser = await getDb()
    .collection("users")
    .findOne({ vendorId: req.body.vendorId });
  if (vendorUser) {
    const notification: Notification = {
      id: `NOTIF-${Date.now().toString().slice(-6)}-${Math.random().toString(36).slice(2, 5)}`,
      userId: vendorUser.email,
      type: "purchase_request_created",
      message: `New purchase request #${newPurchase.id} from CLance Solutions`,
      read: false,
      createdAt: new Date().toISOString(),
      metadata: {
        vendorName: req.body.vendorName,
        purchaseRequestId: newPurchase.id,
      },
    };
    await getDb().collection("notifications").insertOne(notification);
  }

  res.status(201).json({ purchase: newPurchase });
});

app.put("/api/purchases/:id", async (req, res) => {
  const existing = await getDb()
    .collection("purchases")
    .findOne({ id: req.params.id });
  const result = await getDb()
    .collection("purchases")
    .findOneAndUpdate(
      { id: req.params.id },
      { $set: req.body },
      { returnDocument: "after" },
    );
  if (!result)
    return res.status(404).json({ error: "Purchase request not found" });

  // Create notification for status changes
  if (existing && req.body.status && existing.status !== req.body.status) {
    const status = req.body.status;
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
    } else if (status === "Delivered" && existing.createdBy) {
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
  }

  res.json({ purchase: result });
});

app.delete("/api/purchases/:id", async (req, res) => {
  const result = await getDb()
    .collection("purchases")
    .deleteOne({ id: req.params.id });
  if (result.deletedCount === 0)
    return res.status(404).json({ error: "Purchase request not found" });
  res.json({ success: true });
});

app.post("/api/registrations/approve", async (req, res) => {
  const reg = await getDb()
    .collection<Registration>("registrations")
    .findOne({ id: req.body.id });
  if (!reg) return res.status(404).json({ error: "Registration not found" });
  if (reg.status !== "Pending")
    return res.status(400).json({ error: "Registration already processed." });

  await getDb()
    .collection("registrations")
    .updateOne({ id: reg.id }, { $set: { status: "Approved" } });

  // Create notification for specific vendor user (if exists)
  const vendorUser = await getDb()
    .collection("users")
    .findOne({ email: reg.contactEmail });
  if (vendorUser) {
    const notification: Notification = {
      id: `NOTIF-${Date.now().toString().slice(-6)}-${Math.random().toString(36).slice(2, 5)}`,
      userId: vendorUser.email,
      type: "registration_approved",
      message: `Your registration for ${reg.companyName} has been approved`,
      read: false,
      createdAt: new Date().toISOString(),
      metadata: { companyName: reg.companyName },
    };
    await getDb().collection("notifications").insertOne(notification);
  }

  const vendorId = slugId(reg.companyName);
  const existing = await getDb()
    .collection("vendors")
    .findOne({ id: vendorId });
  if (!existing) {
    const onboardingVendor: Vendor = {
      id: vendorId,
      name: reg.companyName,
      category: reg.category,
      accountManager: reg.contactName,
      email: reg.contactEmail,
      phone: reg.contactPhone,
      address: reg.address,
    };
    await getDb().collection("vendors").insertOne(onboardingVendor);
    res.json({
      success: true,
      registration: { ...reg, status: "Approved" },
      vendor: onboardingVendor,
    });
  } else {
    res.json({
      success: true,
      registration: { ...reg, status: "Approved" },
      vendor: existing,
    });
  }
});

app.post("/api/registrations/reject", async (req, res) => {
  const reg = await getDb()
    .collection<Registration>("registrations")
    .findOne({ id: req.body.id });
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
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: "userId required" });

  const notifications = await getDb()
    .collection<Notification>("notifications")
    .find({ userId })
    .sort({ createdAt: -1 })
    .toArray();
  res.json({ notifications });
});

app.post("/api/notifications", async (req, res) => {
  const { userId, type, message, metadata } = req.body;
  if (!userId || !type || !message) {
    return res
      .status(400)
      .json({ error: "userId, type, and message required" });
  }

  const newNotification: Notification = {
    id: `NOTIF-${Date.now().toString().slice(-6)}`,
    userId,
    type,
    message,
    read: false,
    createdAt: new Date().toISOString(),
    metadata,
  };

  await getDb().collection("notifications").insertOne(newNotification);
  res.status(201).json({ notification: newNotification });
});

app.post("/api/notifications/read", async (req, res) => {
  const { userId, notificationIds } = req.body;
  if (!userId) return res.status(400).json({ error: "userId required" });

  const filter: any = { userId };
  if (notificationIds && notificationIds.length > 0) {
    filter.id = { $in: notificationIds };
  }

  await getDb()
    .collection("notifications")
    .updateMany(filter, { $set: { read: true } });
  res.json({ success: true });
});

app.delete("/api/notifications/:id", async (req, res) => {
  const result = await getDb()
    .collection("notifications")
    .deleteOne({ id: req.params.id });
  if (result.deletedCount === 0)
    return res.status(404).json({ error: "Notification not found" });
  res.json({ success: true });
});

// Helper to create notifications for user roles
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
