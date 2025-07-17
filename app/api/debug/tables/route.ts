import sql from "mssql"

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
}

export async function GET() {
  try {
    console.log("🔍 Debug: Tablo analizi başlıyor...")
    
    const pool = new sql.ConnectionPool(config)
    await pool.connect()
    
    // Toplam ürün sayısı
    const totalResult = await pool.request()
      .query("SELECT COUNT(*) as total FROM walmart_ecommerce_product_details")
    
    // Kategorileri analiz et
    const categoriesResult = await pool.request()
      .query(`
        SELECT 
          category,
          COUNT(*) as count,
          AVG(list_price) as avg_price,
          MIN(list_price) as min_price,
          MAX(list_price) as max_price
        FROM walmart_ecommerce_product_details 
        WHERE category IS NOT NULL AND category != ''
        GROUP BY category 
        ORDER BY count DESC
      `)
    
    // Beauty/Cosmetics kategorisini detaylı incele
    const beautyResult = await pool.request()
      .query(`
        SELECT 
          product_name,
          category,
          list_price,
          brand,
          description
        FROM walmart_ecommerce_product_details 
        WHERE category LIKE '%beauty%' 
           OR category LIKE '%cosmetic%'
           OR category LIKE '%makeup%'
           OR category LIKE '%skincare%'
           OR product_name LIKE '%lipstick%'
           OR product_name LIKE '%mascara%'
           OR product_name LIKE '%foundation%'
           OR product_name LIKE '%perfume%'
        ORDER BY list_price DESC
        OFFSET 0 ROWS FETCH NEXT 20 ROWS ONLY
      `)
    
    // Diş ipi ve ağız bakımı ürünlerini ara
    const dentalResult = await pool.request()
      .query(`
        SELECT 
          product_name,
          category,
          list_price,
          brand
        FROM walmart_ecommerce_product_details 
        WHERE product_name LIKE '%floss%'
           OR product_name LIKE '%dental%'
           OR product_name LIKE '%tooth%'
        ORDER BY list_price DESC
        OFFSET 0 ROWS FETCH NEXT 20 ROWS ONLY
      `)
    
    // Fiyat aralıklarını analiz et
    const priceRangesResult = await pool.request()
      .query(`
        SELECT 
          CASE 
            WHEN list_price < 10 THEN '0-10$'
            WHEN list_price < 25 THEN '10-25$'
            WHEN list_price < 50 THEN '25-50$'
            WHEN list_price < 100 THEN '50-100$'
            ELSE '100$+'
          END as price_range,
          COUNT(*) as count
        FROM walmart_ecommerce_product_details 
        WHERE list_price IS NOT NULL
        GROUP BY 
          CASE 
            WHEN list_price < 10 THEN '0-10$'
            WHEN list_price < 25 THEN '10-25$'
            WHEN list_price < 50 THEN '25-50$'
            WHEN list_price < 100 THEN '50-100$'
            ELSE '100$+'
          END
        ORDER BY price_range
      `)
    
    await pool.close()
    
    const analysis = {
      total_products: totalResult.recordset[0].total,
      categories: categoriesResult.recordset,
      beauty_products: beautyResult.recordset,
      dental_products: dentalResult.recordset,
      price_ranges: priceRangesResult.recordset,
      summary: {
        total_categories: categoriesResult.recordset.length,
        beauty_count: beautyResult.recordset.length,
        dental_count: dentalResult.recordset.length,
        avg_price: categoriesResult.recordset.reduce((sum, cat) => sum + (cat.avg_price || 0), 0) / categoriesResult.recordset.length
      }
    }
    
    return new Response(JSON.stringify(analysis, null, 2), {
      headers: { "Content-Type": "application/json" },
    })
    
  } catch (error) {
    console.error("❌ Debug error:", error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}
