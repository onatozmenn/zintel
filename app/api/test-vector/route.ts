import { searchProductsByVector, checkVectorTable, createEmbedding } from "@/lib/database-vector"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 30

export async function GET(req: Request) {
  try {
    console.log("=== Vector Search Test ===")

    const url = new URL(req.url)
    const query = url.searchParams.get("q") || "gaming laptop"

    console.log("🔍 Test query:", query)

    // 1. Embedding tablosunu kontrol et
    const hasEmbeddings = await checkVectorTable()
    console.log("📊 Has embeddings:", hasEmbeddings)

    if (!hasEmbeddings) {
      return Response.json({
        success: false,
        error: "No embeddings found in database",
        message: "Please ensure embeddings are loaded in walmart_ecommerce_product_details table",
        timestamp: new Date().toISOString(),
      })
    }

    // 2. Test embedding oluşturma
    console.log("🧠 Testing embedding creation...")
    const testEmbedding = await createEmbedding("test query")
    console.log("✅ Test embedding created, length:", testEmbedding.length)

    // 3. Vector search test
    console.log("🔍 Testing vector search...")
    const results = await searchProductsByVector(query, 3)
    console.log("✅ Vector search completed, found:", results.length)

    // 4. Sonuçları formatla
    const formattedResults = results.map((product, index) => ({
      rank: index + 1,
      id: product.id,
      name: product.product_name,
      price: product.list_price || product.sale_price,
      brand: product.brand,
      category: product.category,
      similarity: product.similarity_score ? (product.similarity_score * 100).toFixed(2) + "%" : "N/A",
      url: product.product_url,
    }))

    return Response.json({
      success: true,
      query: query,
      embedding_test: {
        created: true,
        length: testEmbedding.length,
      },
      vector_search: {
        results_count: results.length,
        results: formattedResults,
      },
      database: {
        server: "mysqlserver4488.database.windows.net",
        table: "walmart_ecommerce_product_details",
        has_embeddings: hasEmbeddings,
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("=== Vector Search Test Error ===")
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

export async function POST(req: Request) {
  try {
    console.log("=== Vector Search Test POST ===")

    const body = await req.json()
    const { query, limit = 5 } = body

    if (!query) {
      return Response.json(
        {
          success: false,
          error: "Query parameter is required",
        },
        { status: 400 },
      )
    }

    console.log("🔍 POST test query:", query)

    // Vector search yap
    const results = await searchProductsByVector(query, limit)

    return Response.json({
      success: true,
      query: query,
      limit: limit,
      results_count: results.length,
      results: results,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("=== Vector Search Test POST Error ===")
    console.error("Error:", error.message)

    return Response.json(
      {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
} 