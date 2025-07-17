import sql from "mssql"

const config = {
  server: process.env.DB_SERVER || "mysqlserver4488.database.windows.net",
  database: process.env.DB_NAME || "mySampleDatabase",
  user: process.env.DB_USER || "azureuser",
  password: process.env.DB_PASSWORD || "Onatazure4488",
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
    console.log("Creating new database connection pool...")
    pool = new sql.ConnectionPool(config)
    await pool.connect()
    console.log("Database connection pool created successfully")
  }
  return pool
}

export async function closeConnection() {
  if (pool) {
    await pool.close()
    pool = null
    console.log("Database connection closed")
  }
}

// Gelişmiş Walmart ürün arama fonksiyonu
export async function searchWalmartProducts(query: string, limit = 5) {
  let connection: sql.ConnectionPool | null = null

  try {
    console.log("=== Real Walmart Database Search ===")
    console.log("Search query:", query)
    console.log("Limit:", limit)

    connection = await getConnection()
    console.log("Database connection established")

    // Gelişmiş arama sorgusu - tüm önemli alanları tarar
    const result = await connection
      .request()
      .input("searchQuery", sql.NVarChar, `%${query}%`)
      .input("limit", sql.Int, limit)
      .query(`
        SELECT TOP (@limit) 
          product_id,
          product_name,
          title,
          price,
          category,
          brand,
          rating,
          description,
          image_url,
          availability
        FROM [dbo].[walmart_ecommerce_products]
        WHERE 
          (product_name LIKE @searchQuery OR
           title LIKE @searchQuery OR
           category LIKE @searchQuery OR
           brand LIKE @searchQuery OR
           description LIKE @searchQuery)
        ORDER BY 
          CASE 
            WHEN product_name LIKE @searchQuery THEN 1
            WHEN title LIKE @searchQuery THEN 2
            WHEN brand LIKE @searchQuery THEN 3
            WHEN category LIKE @searchQuery THEN 4
            ELSE 5
          END,
          CASE 
            WHEN rating IS NOT NULL THEN CAST(rating AS FLOAT)
            ELSE 0
          END DESC,
          price ASC
      `)

    console.log("=== Database Query Results ===")
    console.log("Total products found:", result.recordset.length)

    if (result.recordset.length > 0) {
      console.log("Sample product:", {
        name: result.recordset[0].product_name,
        price: result.recordset[0].price,
        category: result.recordset[0].category,
        brand: result.recordset[0].brand,
      })
    }

    return result.recordset
  } catch (error) {
    console.error("=== Database Search Error ===")
    console.error("Error type:", error.constructor.name)
    console.error("Error message:", error.message)
    console.error("Error code:", error.code)
    console.error("Error state:", error.state)
    console.error("Full error:", error)

    // Bağlantı hatası durumunda pool'u sıfırla
    if (error.code === "ENOTFOUND" || error.code === "ETIMEOUT") {
      console.log("Resetting connection pool due to network error...")
      pool = null
    }

    return []
  }
}

// Veritabanı durumu kontrol fonksiyonu
export async function testDatabaseConnection() {
  try {
    console.log("=== Testing Real Database Connection ===")
    const connection = await getConnection()

    const result = await connection.request().query(`
      SELECT 
        COUNT(*) as total_products,
        COUNT(DISTINCT category) as total_categories,
        COUNT(DISTINCT brand) as total_brands,
        MIN(price) as min_price,
        MAX(price) as max_price,
        AVG(CAST(price AS FLOAT)) as avg_price
      FROM [dbo].[walmart_ecommerce_products]
    `)

    const stats = result.recordset[0]
    console.log("=== Database Statistics ===")
    console.log("Total products:", stats.total_products)
    console.log("Total categories:", stats.total_categories)
    console.log("Total brands:", stats.total_brands)
    console.log("Price range: $", stats.min_price, "- $", stats.max_price)
    console.log("Average price: $", stats.avg_price?.toFixed(2))

    return {
      success: true,
      stats: stats,
      message: "Real Walmart database connection successful!",
    }
  } catch (error) {
    console.error("=== Database Test Error ===")
    console.error("Error:", error.message)
    return {
      success: false,
      error: error.message,
      message: "Database connection failed",
    }
  }
}

// Popüler kategorileri getir
export async function getPopularCategories(limit = 10) {
  try {
    const connection = await getConnection()

    const result = await connection
      .request()
      .input("limit", sql.Int, limit)
      .query(`
        SELECT TOP (@limit)
          category,
          COUNT(*) as product_count,
          AVG(CAST(price AS FLOAT)) as avg_price
        FROM [dbo].[walmart_ecommerce_products]
        WHERE category IS NOT NULL AND category != ''
        GROUP BY category
        ORDER BY COUNT(*) DESC
      `)

    return result.recordset
  } catch (error) {
    console.error("Error getting popular categories:", error)
    return []
  }
}

export async function checkTables() {
  try {
    const connection = await getConnection()

    const tables = await connection.request().query(`
      SELECT TABLE_NAME
      FROM INFORMATION_SCHEMA.TABLES
      WHERE TABLE_TYPE = 'BASE TABLE' AND TABLE_CATALOG='mySampleDatabase'
    `)

    return tables.recordset.map((table) => table.TABLE_NAME)
  } catch (error) {
    console.error("Error checking tables:", error)
    throw error
  }
}
