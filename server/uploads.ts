import { mkdir, writeFile, readFile, access } from "fs/promises";
import path from "path";

const UPLOADS_ROOT = path.join(process.cwd(), "uploads");

export function uploadsRoot() {
  return UPLOADS_ROOT;
}

export function registrationUploadDir(registrationId: string) {
  return path.join(UPLOADS_ROOT, "registrations", registrationId);
}

function sanitizeFilename(name: string) {
  return path.basename(name).replace(/[^a-zA-Z0-9._-]/g, "_");
}

export async function saveRegistrationDocument(
  registrationId: string,
  docType: "license" | "w9",
  file: { name: string; data: string; mimeType?: string }
) {
  const dir = registrationUploadDir(registrationId);
  await mkdir(dir, { recursive: true });

  const filename = sanitizeFilename(file.name || `${docType}.pdf`);
  const storedName = `${docType}-${filename}`;
  const storedPath = path.join(dir, storedName);

  await writeFile(storedPath, Buffer.from(file.data, "base64"));

  return {
    filename: file.name || filename,
    storedName,
    mimeType: file.mimeType || "application/octet-stream",
  };
}

export async function readRegistrationDocument(registrationId: string, docType: "license" | "w9") {
  const dir = registrationUploadDir(registrationId);
  const prefix = `${docType}-`;

  const { readdir } = await import("fs/promises");
  const entries = await readdir(dir).catch(() => [] as string[]);
  const match = entries.find((entry) => entry.startsWith(prefix));

  if (!match) {
    throw new Error("Document not found");
  }

  const storedPath = path.join(dir, match);
  const data = await readFile(storedPath);
  const originalName = match.slice(prefix.length);

  return { data, originalName, storedPath };
}

export async function seedSampleDocuments(registrationId: string) {
  const dir = registrationUploadDir(registrationId);
  await mkdir(dir, { recursive: true });

  const samples = [
    {
      docType: "license" as const,
      storedName: "license-Nexus_Business_License.pdf",
      originalName: "Nexus_Business_License.pdf",
      content: "Sample business license document for Nexus IT Solutions.",
    },
    {
      docType: "w9" as const,
      storedName: "w9-Nexus_W9_2023.pdf",
      originalName: "Nexus_W9_2023.pdf",
      content: "Sample W-9 tax document for Nexus IT Solutions.",
    },
  ];

  for (const sample of samples) {
    const storedPath = path.join(dir, sample.storedName);
    try {
      await access(storedPath);
    } catch {
      await writeFile(storedPath, sample.content, "utf8");
    }
  }

  return {
    license: samples[0].originalName,
    w9: samples[1].originalName,
    licenseStoredName: samples[0].storedName,
    w9StoredName: samples[1].storedName,
  };
}
