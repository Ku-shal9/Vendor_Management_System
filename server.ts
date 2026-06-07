import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { connectToDatabase, getDb } from "./server/db.js";
import { Vendor, Invoice, Registration } from "./src/types.js";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

function slugId(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function formatDate(): string {
  return new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// Auth
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password, role } = req.body;
    const user = await getDb().collection("users").findOne({ email, password, role });
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
  const vendor = await getDb().collection<Vendor>("vendors").findOne({ id: req.params.id });
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
  const result = await getDb().collection<Vendor>("vendors").findOneAndUpdate(
    { id: req.params.id },
    { $set: req.body },
    { returnDocument: "after" }
  );
  if (!result) return res.status(404).json({ error: "Vendor not found" });
  res.json({ vendor: result });
});

app.delete("/api/vendors/:id", async (req, res) => {
  const result = await getDb().collection("vendors").deleteOne({ id: req.params.id });
  if (result.deletedCount === 0) return res.status(404).json({ error: "Vendor not found" });
  res.json({ success: true });
});

// Invoices
app.get("/api/payments", async (_req, res) => {
  const invoices = await getDb().collection<Invoice>("invoices").find().sort({ date: -1 }).toArray();
  res.json({ invoices });
});

app.post("/api/invoices", async (req, res) => {
  const vendor = await getDb().collection<Vendor>("vendors").findOne({ id: req.body.vendorId });
  const newInvoice: Invoice = {
    id: req.body.id || `INV-${Date.now().toString().slice(-6)}`,
    vendorId: req.body.vendorId,
    vendorName: vendor?.name || req.body.vendorName || "Unknown",
    amount: parseFloat(req.body.amount),
    date: req.body.date || new Date().toISOString().split("T")[0],
    status: req.body.status || "Pending",
  };
  await getDb().collection("invoices").insertOne(newInvoice);
  res.status(201).json({ invoice: newInvoice });
});

app.put("/api/invoices/:id", async (req, res) => {
  const result = await getDb().collection<Invoice>("invoices").findOneAndUpdate(
    { id: req.params.id },
    { $set: req.body },
    { returnDocument: "after" }
  );
  if (!result) return res.status(404).json({ error: "Invoice not found" });
  res.json({ invoice: result });
});

app.delete("/api/invoices/:id", async (req, res) => {
  const result = await getDb().collection("invoices").deleteOne({ id: req.params.id });
  if (result.deletedCount === 0) return res.status(404).json({ error: "Invoice not found" });
  res.json({ success: true });
});

// Registrations
app.get("/api/registrations", async (_req, res) => {
  const registrations = await getDb().collection<Registration>("registrations").find().sort({ registeredDate: -1 }).toArray();
  res.json({ registrations });
});

app.post("/api/registrations", async (req, res) => {
  const count = await getDb().collection("registrations").countDocuments();
  const newReg: Registration = {
    id: `REG-${String(count + 1).padStart(3, "0")}`,
    companyName: req.body.companyName || "Unknown Vendor",
    category: req.body.category || "General",
    contactName: req.body.contactName || "John Doe",
    contactEmail: req.body.contactEmail || "contact@vendor.com",
    contactPhone: req.body.contactPhone || "None",
    address: req.body.address || "Not provided",
    registeredDate: formatDate(),
    status: "Pending",
  };
  await getDb().collection("registrations").insertOne(newReg);
  res.status(201).json({ registration: newReg });
});

app.post("/api/registrations/approve", async (req, res) => {
  const reg = await getDb().collection<Registration>("registrations").findOne({ id: req.body.id });
  if (!reg) return res.status(404).json({ error: "Registration not found" });
  if (reg.status !== "Pending") return res.status(400).json({ error: "Registration already processed." });

  await getDb().collection("registrations").updateOne({ id: reg.id }, { $set: { status: "Approved" } });

  const vendorId = slugId(reg.companyName);
  const existing = await getDb().collection("vendors").findOne({ id: vendorId });
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
    res.json({ success: true, registration: { ...reg, status: "Approved" }, vendor: onboardingVendor });
  } else {
    res.json({ success: true, registration: { ...reg, status: "Approved" }, vendor: existing });
  }
});

app.post("/api/registrations/reject", async (req, res) => {
  const reg = await getDb().collection<Registration>("registrations").findOne({ id: req.body.id });
  if (!reg) return res.status(404).json({ error: "Registration not found" });
  if (reg.status !== "Pending") return res.status(400).json({ error: "Registration already processed." });

  await getDb().collection("registrations").updateOne({ id: reg.id }, { $set: { status: "Rejected" } });
  res.json({ success: true, registration: { ...reg, status: "Rejected" } });
});

app.get("/api/health", async (_req, res) => {
  try {
    const db = getDb();
    const collections = await db.listCollections().toArray();
    res.json({ status: "ok", database: db.databaseName, collections: collections.map((c) => c.name) });
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
