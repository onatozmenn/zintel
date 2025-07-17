import { checkVectorTable, createEmbedding, searchProductsByVector } from "@/lib/database-vector"
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
}

export async function GET() {
  try {
    console.log("=== Vector Search Debug ===")

    // 1. Veritabanı bağlantısı
    const pool = await sql.connect(config)
    console.log("✅ Database connected")

    // 2. Tablo yapısını kontrol et
    const tableStructure = await pool.request().query(`
      SELECT 
        COLUMN_NAME,
        DATA_TYPE,
        IS_NULLABLE
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = 'walmart_ecommerce_product_details'
      ORDER BY ORDINAL_POSITION
    `)

    console.log("📋 Table structure:", tableStructure.recordset.length, "columns")

    // 3. Embedding kolonunu kontrol et
    const embeddingColumn = tableStructure.recordset.find(col => col.COLUMN_NAME === 'embedding')
    console.log("🧠 Embedding column:", embeddingColumn)

    // 4. Embedding'li ürün sayısını kontrol et
    const embeddingCount = await pool.request().query(`
      SELECT 
        COUNT(*) as total_products,
        COUNT(embedding) as products_with_embeddings,
        COUNT(CASE WHEN embedding IS NOT NULL AND embedding != '' THEN 1 END) as non_empty_embeddings
      FROM [dbo].[walmart_ecommerce_product_details]
    `)

    console.log("📊 Embedding statistics:", embeddingCount.recordset[0])

    // 5. Örnek embedding kontrol et
    const sampleEmbedding = await pool.request().query(`
      SELECT TOP 1 
        id,
        product_name,
        LEN(embedding) as embedding_length,
        LEFT(embedding, 100) as embedding_preview
      FROM [dbo].[walmart_ecommerce_product_details]
      WHERE embedding IS NOT NULL AND embedding != ''
    `)

    console.log("🔍 Sample embedding:", sampleEmbedding.recordset[0])

    // 6. Vector search test
    let vectorSearchTest = null
    try {
      const testResults = await searchProductsByVector("test query", 1)
      vectorSearchTest = {
        success: true,
        results_count: testResults.length,
        sample_result: testResults[0] ? {
          id: testResults[0].id,
          name: testResults[0].product_name,
          similarity: testResults[0].similarity_score
        } : null
      }
    } catch (error) {
      vectorSearchTest = {
        success: false,
        error: error.message
      }
    }

    // 7. Environment variables kontrol
    const envCheck = {
      hasOpenAIKey: !!process.env.OPENAI_API_KEY,
      openAIKeyLength: process.env.OPENAI_API_KEY?.length || 0,
      hasEmbeddingsUrl: !!process.env.EMBEDDINGS_URL,
      embeddingsUrl: process.env.EMBEDDINGS_URL,
    }

    await pool.close()

    return Response.json({
      success: true,
      timestamp: new Date().toISOString(),
      
      database: {
        server: config.server,
        database: config.database,
        connected: true,
      },
      
      table_structure: {
        total_columns: tableStructure.recordset.length,
        columns: tableStructure.recordset,
        has_embedding_column: !!embeddingColumn,
        embedding_column_type: embeddingColumn?.DATA_TYPE,
      },
      
      embeddings: {
        total_products: embeddingCount.recordset[0].total_products,
        products_with_embeddings: embeddingCount.recordset[0].products_with_embeddings,
        non_empty_embeddings: embeddingCount.recordset[0].non_empty_embeddings,
        sample_embedding: sampleEmbedding.recordset[0],
      },
      
      vector_search_test: vectorSearchTest,
      
      environment: envCheck,
      
      recommendations: {
        has_embeddings: embeddingCount.recordset[0].products_with_embeddings > 0,
        embedding_coverage: `${((embeddingCount.recordset[0].products_with_embeddings / embeddingCount.recordset[0].total_products) * 100).toFixed(1)}%`,
        vector_search_working: vectorSearchTest?.success || false,
      }
    })
  } catch (error) {
    console.error("=== Vector Search Debug Error ===")
    console.error("Error:", error.message)

    return Response.json(
      {
        success: false,
        error: error.message,
        type: error.constructor.name,
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
} 