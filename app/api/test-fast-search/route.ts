import { searchProductsByVector } from "@/lib/database-vector"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 10 // Çok kısa timeout

export async function POST(req: Request) {
  console.log("=== Hızlı Vector Search Test ===")

  try {
    const body = await req.json()
    const { query } = body

    if (!query) {
      return new Response(JSON.stringify({ error: "Query is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }

    console.log("🔍 Fast search for:", query)
    
    const startTime = Date.now()
    
    // Hızlı arama - sadece 3 sonuç
    const products = await searchProductsByVector(query, 3)
    
    const endTime = Date.now()
    const duration = endTime - startTime
    
    console.log(`⚡ Search completed in ${duration}ms`)
    console.log(`📦 Found ${products.length} products`)

    return new Response(
      JSON.stringify({
        query,
        products,
        duration: `${duration}ms`,
        count: products.length,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { "Content-Type": "application/json" },
      }
    )
  } catch (error) {
    console.error("❌ Fast search error:", error)
    
    return new Response(
      JSON.stringify({
        error: "Fast search failed",
        message: error.message,
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    )
  }
} 