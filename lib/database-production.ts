// Production için gerçek veritabanı bağlantısı
// Bu kod gerçek Next.js projesinde çalışacak

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
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
}

let pool: sql.ConnectionPool | null = null

export async function getProductionConnection() {
  if (!pool) {
    pool = new sql.ConnectionPool(config)
    await pool.connect()
  }
  return pool
}

export async function searchWalmartProductsProduction(query: string, limit = 5) {
  try {
    const connection = await getProductionConnection()

    const result = await connection
      .request()
      .input("searchQuery", sql.NVarChar, `%${query}%`)
      .input("limit", sql.Int, limit)
      .query(`
        SELECT TOP (@limit) *
        FROM [dbo].[walmart_ecommerce_products]
        WHERE 
          (product_name LIKE @searchQuery OR
           category LIKE @searchQuery OR
           brand LIKE @searchQuery OR
           description LIKE @searchQuery OR
           title LIKE @searchQuery)
        ORDER BY 
          CASE 
            WHEN product_name LIKE @searchQuery OR title LIKE @searchQuery THEN 1
            WHEN category LIKE @searchQuery THEN 2
            WHEN brand LIKE @searchQuery THEN 3
            ELSE 4
          END,
          price ASC
      `)

    return result.recordset
  } catch (error) {
    console.error("Production database error:", error)
    return []
  }
}
