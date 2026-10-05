import "dotenv/config";
import mysql from "mysql2/promise";
import pkg from "pg";
const { Client } = pkg;

async function migrate() {
  // CockroachDB (Postgres) connection (source)
  const pgClient = new Client({
    connectionString: process.env.COCKROACH_URL,
    ssl: { rejectUnauthorized: false },
  });
  await pgClient.connect();

  // Railway MySQL connection (destination)
//   const mysqlConn = await mysql.createConnection({
//     host: process.env.NEW_MYSQL_HOST,
//     port: process.env.NEW_MYSQL_PORT,
//     user: process.env.NEW_MYSQL_USER,
//     password: process.env.NEW_MYSQL_PASSWORD,
//     database: process.env.NEW_MYSQL_DATABASE,
//   });

const mysqlConn = await mysql.createConnection({
  host: "switchback.proxy.rlwy.net",
  port: 32519,
  user: "root",
  password: "bybOfhOTWvIWUhNTvpzPRNRhYJlIhTHp",
  database: "railway",
  ssl: { rejectUnauthorized: false }, // 🚨 required
});


  console.log("✅ Connected to Cockroach (Postgres) and Railway (MySQL)");

  // Fetch all tables in Cockroach
  const tablesRes = await pgClient.query(
    `SELECT table_name 
     FROM information_schema.tables 
     WHERE table_schema='public'`
  );
  const tableNames = tablesRes.rows.map((r) => r.table_name);

  for (const table of tableNames) {
    console.log(`\n📌 Migrating table: ${table}`);

    // Get schema (columns)
    const colsRes = await pgClient.query(
      `SELECT column_name, data_type 
       FROM information_schema.columns 
       WHERE table_schema='public' AND table_name=$1`,
      [table]
    );

    // Convert all to TEXT (safe default for MySQL import)
    const columnDefs = colsRes.rows
      .map((col) => `\`${col.column_name}\` TEXT`)
      .join(", ");

    // Drop + recreate table in MySQL
    await mysqlConn.query(`DROP TABLE IF EXISTS \`${table}\``);
    await mysqlConn.query(`CREATE TABLE \`${table}\` (${columnDefs})`);

    // Fetch rows from Cockroach
    const rowsRes = await pgClient.query(`SELECT * FROM "${table}"`);
    const rows = rowsRes.rows;

    if (rows.length > 0) {
      const cols = Object.keys(rows[0]);
      const placeholders = cols.map(() => `?`).join(", ");

      for (const row of rows) {
        const values = Object.values(row).map((v) =>
          v !== null ? v.toString() : null
        );

        await mysqlConn.query(
          `INSERT INTO \`${table}\` (${cols.map((c) => `\`${c}\``).join(", ")}) 
           VALUES (${placeholders})`,
          values
        );
      }
    }

    console.log(`✅ Migrated ${rows.length} rows from ${table}`);
  }

  await pgClient.end();
  await mysqlConn.end();
  console.log("\n🎉 Migration complete!");
}

migrate().catch((err) => console.error("❌ Error:", err));
