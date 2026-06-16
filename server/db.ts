import { MongoClient, Db } from "mongodb";

let client: MongoClient | null = null;
let db: Db | null = null;

export async function connectToDatabase(): Promise<Db> {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI is required. Set it in your .env file.");
  }

  // Try Atlas connection first, fallback to local MongoDB
  const atlasUri = uri;
  const localUri = "mongodb://localhost:27017";

  for (const mongoUri of [atlasUri, localUri]) {
    try {
      client = new MongoClient(mongoUri, {
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 5000,
      });

      await client.connect();
      db = client.db(process.env.MONGODB_DB_NAME || "clance_vms");
      console.log(
        "[MongoDB] Connected to database:",
        db.databaseName,
        mongoUri === localUri ? "(local)" : "(Atlas)",
      );

      return db;
    } catch (err: any) {
      console.error(
        `[MongoDB] Failed to connect to ${mongoUri === localUri ? "local" : "Atlas"}:`,
        err.message,
      );
      if (client) {
        await client.close();
        client = null;
      }
    }
  }

  throw new Error(
    "Failed to connect to MongoDB. Please check your MONGODB_URI or ensure MongoDB is running locally.",
  );
}

export function getDb(): Db {
  if (!db) {
    throw new Error("Database not connected. Call connectToDatabase() first.");
  }
  return db;
}

export async function closeDatabase(): Promise<void> {
  if (client) {
    await client.close();
    client = null;
    db = null;
  }
}
