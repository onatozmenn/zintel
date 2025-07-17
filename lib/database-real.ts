import sql from "mssql"

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
    max: 20,
    min: 0,
    idleTimeoutMillis: 30000,
  },
  connectionTimeout: 30000,
  requestTimeout: 30000,
}

let pool: sql.ConnectionPool | null = null

export async function getConnection() {
  if (!pool) {
    console.log("🔌 Creating new database connection to mysqlserver4488...")
    pool = new sql.ConnectionPool(config)
    await pool.connect()
    console.log("✅ Connected to mysqlserver4488.database.windows.net")
  }
  return pool
}

// Gerçek tablo adını dinamik olarak bul
export async function findWalmartTable() {
  try {
    const connection = await getConnection()

    const result = await connection.request().query(`
      SELECT TABLE_NAME
      FROM INFORMATION_SCHEMA.TABLES
      WHERE TABLE_TYPE = 'BASE TABLE' 
      AND (
        TABLE_NAME LIKE '%walmart%' OR
        TABLE_NAME LIKE '%product%' OR
        TABLE_NAME LIKE '%embedding%'
      )
      ORDER BY TABLE_NAME
    `)

    if (result.recordset.length > 0) {
      const tableName = result.recordset[0].TABLE_NAME
      console.log("🎯 Found Walmart table:", tableName)
      return tableName
    }

    // Fallback - tüm tabloları listele
    const allTables = await connection.request().query(`
      SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE'
    `)

    console.log(
      "📋 Available tables:",
      allTables.recordset.map((t) => t.TABLE_NAME),
    )
    return null
  } catch (error) {
    console.error("❌ Error finding Walmart table:", error)
    return null
  }
}

// Tablo yapısını kontrol et
export async function getTableStructure(tableName: string) {
  try {
    const connection = await getConnection()

    const result = await connection
      .request()
      .input("tableName", sql.NVarChar, tableName)
      .query(`
        SELECT 
          COLUMN_NAME,
          DATA_TYPE,
          IS_NULLABLE
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_NAME = @tableName
        ORDER BY ORDINAL_POSITION
      `)

    return result.recordset.map((col) => col.COLUMN_NAME)
  } catch (error) {
    console.error("❌ Error getting table structure:", error)
    return []
  }
}

// Dinamik ürün arama - gerçek tablo yapısına göre
export async function searchRealWalmartProducts(query: string, limit = 5) {
  try {
    console.log("🔍 Searching real Walmart database for:", query)

    // Önce doğru tabloyu bul
    const tableName = await findWalmartTable()
    if (!tableName) {
      console.error("❌ No Walmart table found!")
      return []
    }

    console.log("📊 Using table:", tableName)

    // Tablo yapısını al
    const columns = await getTableStructure(tableName)
    console.log("📋 Available columns:", columns)

    const connection = await getConnection()

    // Dinamik sorgu oluştur - mevcut kolonlara göre
    const searchFields = []
    const possibleNameFields = ["product_name", "title", "name", "product_title"]
    const possibleCategoryFields = ["category", "product_category", "categories"]
    const possibleBrandFields = ["brand", "manufacturer", "brand_name"]
    const possibleDescFields = ["description", "product_description", "desc"]

    // Mevcut kolonları kontrol et
    possibleNameFields.forEach((field) => {
      if (columns.includes(field)) searchFields.push(`${field} LIKE @searchQuery`)
    })
    possibleCategoryFields.forEach((field) => {
      if (columns.includes(field)) searchFields.push(`${field} LIKE @searchQuery`)
    })
    possibleBrandFields.forEach((field) => {
      if (columns.includes(field)) searchFields.push(`${field} LIKE @searchQuery`)
    })
    possibleDescFields.forEach((field) => {
      if (columns.includes(field)) searchFields.push(`${field} LIKE @searchQuery`)
    })

    if (searchFields.length === 0) {
      console.error("❌ No searchable fields found!")
      return []
    }

    const whereClause = searchFields.join(" OR ")

    const sqlQuery = `
      SELECT TOP (@limit) *
      FROM [dbo].[${tableName}]
      WHERE ${whereClause}
      ORDER BY 
        CASE 
          WHEN ${possibleNameFields.find((f) => columns.includes(f)) || columns[0]} LIKE @searchQuery THEN 1
          ELSE 2
        END
    `

    console.log("🔍 Executing query:", sqlQuery)

    const result = await connection
      .request()
      .input("searchQuery", sql.NVarChar, `%${query}%`)
      .input("limit", sql.Int, limit)
      .query(sqlQuery)

    console.log("✅ Found", result.recordset.length, "products")

    if (result.recordset.length > 0) {
      console.log("📦 Sample product:", Object.keys(result.recordset[0]))
    }

    return result.recordset
  } catch (error) {
    console.error("❌ Real database search error:", error)
    return []
  }
}
