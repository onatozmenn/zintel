import { searchWalmartProducts, testDatabaseConnection } from "@/lib/database"

// Node.js runtime kullan
export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(req: Request) {
  try {
    console.log("=== Products Test API ===")

    const body = await req.json()
    const testQuery = body.query || "ayakkabı"

    console.log("Testing product search for:", testQuery)

    // 1. Database connection test
    const connectionTest = await testDatabaseConnection()
    console.log("Connection test result:", connectionTest)

    if (!connectionTest.success) {
      return Response.json({
        success: false,
        error: "Database connection failed",
        details: connectionTest.error,
      })
    }

    // 2. Product search test
    const products = await searchWalmartProducts(testQuery, 3)

    console.log("Found products:", products.length)

    return Response.json({
      success: true,
      query: testQuery,
      productsFound: products.length,
      totalProductsInDB: connectionTest.count,
      products: products.map((p) => ({
        name: p.product_name || p.title,
        price: p.price,
        category: p.category,
        brand: p.brand,
      })),
      message: `${testQuery} için ${products.length} ürün bulundu (Toplam DB'de ${connectionTest.count} ürün var)`,
    })
  } catch (error) {
    console.error("Products test error:", error)
    return Response.json(
      {
        success: false,
        error: error.message,
        stack: error.stack,
      },
      { status: 500 },
    )
  }
}
