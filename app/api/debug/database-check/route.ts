import sql from "mssql"

// Node.js runtime kullan
export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const config = {
  server: "mysqlserver4488.database.windows.net",
  database: "mySampleDatabase",
  user: "azureuser",
  password: "Onatazure4488",
  port: 1433,
  options: {
    encrypt: true,
    trustServerCertificate: false,
    enableArithAbort: true,
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
  connectionTimeout: 30000,
  requestTimeout: 30000,
}

export async function GET() {
  let pool
  try {
    console.log("=== Real Database Check ===")
    console.log("Connecting to:", config.server)
    console.log("Database:", config.database)

    pool = new sql.ConnectionPool(config)
    await pool.connect()
    console.log("✅ Database connection successful!")

    // 1. Tüm tabloları listele
    const tablesResult = await pool.request().query(`
      SELECT TABLE_NAME, TABLE_SCHEMA
      FROM INFORMATION_SCHEMA.TABLES
      WHERE TABLE_TYPE = 'BASE TABLE'
      ORDER BY TABLE_NAME
    `)

    console.log("📋 Available tables:", tablesResult.recordset.length)

    // 2. Walmart ile ilgili tabloları ara
    const walmartTables = tablesResult.recordset.filter(
      (table) =>
        table.TABLE_NAME.toLowerCase().includes("walmart") ||
        table.TABLE_NAME.toLowerCase().includes("product") ||
        table.TABLE_NAME.toLowerCase().includes("embedding"),
    )

    console.log("🛒 Walmart related tables:", walmartTables.length)

    let tableStructure = null
    let sampleData = null
    let actualTableName = null

    // 3. Walmart tablosunu bul ve yapısını kontrol et
    if (walmartTables.length > 0) {
      actualTableName = walmartTables[0].TABLE_NAME
      console.log("🎯 Using table:", actualTableName)

      // Tablo yapısını al
      const columnsResult = await pool
        .request()
        .input("tableName", sql.NVarChar, actualTableName)
        .query(`
          SELECT 
            COLUMN_NAME,
            DATA_TYPE,
            IS_NULLABLE,
            CHARACTER_MAXIMUM_LENGTH
          FROM INFORMATION_SCHEMA.COLUMNS
          WHERE TABLE_NAME = @tableName
          ORDER BY ORDINAL_POSITION
        `)

      tableStructure = columnsResult.recordset

      // Örnek veri al
      const sampleResult = await pool.request().query(`
        SELECT TOP 3 * FROM [dbo].[${actualTableName}]
      `)
      sampleData = sampleResult.recordset

      // Toplam kayıt sayısı
      const countResult = await pool.request().query(`
        SELECT COUNT(*) as total_count FROM [dbo].[${actualTableName}]
      `)

      console.log("📊 Total records:", countResult.recordset[0].total_count)
    }

    return Response.json({
      success: true,
      connection: {
        server: config.server,
        database: config.database,
        status: "Connected ✅",
      },
      tables: {
        total: tablesResult.recordset.length,
        all: tablesResult.recordset.map((t) => t.TABLE_NAME),
        walmart_related: walmartTables.map((t) => t.TABLE_NAME),
      },
      walmart_table: {
        name: actualTableName,
        structure: tableStructure,
        sample_data: sampleData,
        total_records: sampleData
          ? await pool
              .request()
              .query(`SELECT COUNT(*) as count FROM [dbo].[${actualTableName}]`)
              .then((r) => r.recordset[0].count)
          : 0,
      },
      csv_info: {
        expected_file: "walmart-product-with-embeddings-dataset-usa.csv",
        note: "CSV dosyası SQL tablosuna import edilmiş olmalı",
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("❌ Database check error:", error)
    return Response.json(
      {
        success: false,
        error: {
          message: error.message,
          code: error.code,
          state: error.state,
        },
        connection_attempted: {
          server: config.server,
          database: config.database,
        },
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  } finally {
    if (pool) {
      await pool.close()
    }
  }
}
