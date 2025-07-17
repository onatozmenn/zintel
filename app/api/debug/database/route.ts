import sql from "mssql"

const connectionString =
  "Server=tcp:mysqlserver4488.database.windows.net,1433;Initial Catalog=mySampleDatabase;Persist Security Info=False;User ID=azureuser;Password=Onatazure4488;MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;"

export async function GET() {
  let pool
  try {
    pool = await sql.connect(connectionString)

    // Walmart tablosu kontrol
    const walmartCheck = await pool.request().query(`
      SELECT COUNT(*) as count 
      FROM [dbo].[walmart_ecommerce_products]
    `)

    // SalesLT tablosu kontrol
    const salesltCheck = await pool.request().query(`
      SELECT COUNT(*) as count 
      FROM [SalesLT].[Product]
    `)

    // Örnek Walmart ürünleri
    const walmartSample = await pool.request().query(`
      SELECT TOP 3 * FROM [dbo].[walmart_ecommerce_products]
    `)

    // Örnek SalesLT ürünleri
    const salesltSample = await pool.request().query(`
      SELECT TOP 3 
        p.ProductID,
        p.Name as ProductName,
        p.ListPrice,
        pc.Name as CategoryName
      FROM [SalesLT].[Product] p
      LEFT JOIN [SalesLT].[ProductCategory] pc ON p.ProductCategoryID = pc.ProductCategoryID
    `)

    return Response.json({
      success: true,
      walmart: {
        count: walmartCheck.recordset[0].count,
        sample: walmartSample.recordset,
      },
      saleslt: {
        count: salesltCheck.recordset[0].count,
        sample: salesltSample.recordset,
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Database debug error:", error)
    return Response.json(
      {
        success: false,
        error: error.message,
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
