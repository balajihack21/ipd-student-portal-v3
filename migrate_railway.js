import "dotenv/config";
import mysql from "mysql2/promise";

async function migrate() {
  // Source MySQL (old Railway account)
  const source = await mysql.createConnection({
    host: process.env.MYSQL_HOST,
    port: process.env.MYSQL_PORT,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    ssl: { rejectUnauthorized: false },
    connectTimeout: 10000,
  });

  // Target MySQL (new Railway account)
  const target = await mysql.createConnection({
    host: process.env.NEW_MYSQL_HOST,
    port: process.env.NEW_MYSQL_PORT,
    user: process.env.NEW_MYSQL_USER,
    password: process.env.NEW_MYSQL_PASSWORD,
    database: process.env.NEW_MYSQL_DATABASE,
    ssl: { rejectUnauthorized: false },
    connectTimeout: 10000,
  });

  console.log("✅ Connected to source & target MySQL databases");

  // Get all tables from source
  const [tables] = await source.query("SHOW TABLES");
  const tableNames = tables.map((row) => Object.values(row)[0]);

  for (const table of tableNames) {
    console.log(`\n📌 Migrating table: ${table}`);

       // Get schema from source
    const [columns] = await source.query(`SHOW CREATE TABLE \`${table}\``);
    let createSQL = columns[0]["Create Table"];

    // 🚨 Strip out FOREIGN KEY constraints
    createSQL = createSQL
      .split("\n")
      .filter(
        (line) =>
          !line.trim().startsWith("CONSTRAINT") &&
          !line.trim().startsWith("FOREIGN KEY")
      )
      .join("\n");

    // 🚨 Fix dangling commas before closing parenthesis
    createSQL = createSQL.replace(/,\n\)/g, "\n)");


    // Drop & recreate in target
    await target.query(`DROP TABLE IF EXISTS \`${table}\``);
    await target.query(createSQL);

    // Copy rows
    const [rows] = await source.query(`SELECT * FROM \`${table}\``);

    if (rows.length > 0) {
      const cols = Object.keys(rows[0]);
      const placeholders = cols.map(() => "?").join(", ");

      for (const row of rows) {
  const cleanValues = Object.values(row).map((val) => {
    // Skip nulls
    if (val === null || val === undefined) return null;

    // If value is a Date object, convert to MySQL DATETIME string
    if (val instanceof Date) return val.toISOString().slice(0, 19).replace('T', ' ');

    // Only stringify non-Date objects and arrays
    if (typeof val === "object") return JSON.stringify(val);

    return val; // keep as-is for normal strings, numbers, etc.
  });

  await target.query(
    `INSERT INTO \`${table}\` (${cols.map((c) => `\`${c}\``).join(", ")}) VALUES (${placeholders})`,
    cleanValues
  );
}

    }

    console.log(`✅ Migrated ${rows.length} rows`);
  }

  await source.end();
  await target.end();
  console.log("\n🎉 Migration complete!");
}

migrate().catch((err) => console.error("❌ Error:", err));
