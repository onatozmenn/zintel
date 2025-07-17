import { searchProductsWithFetch } from "@/lib/database-alt"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 30

export async function POST(req: Request) {
  console.log("=== Alternative Products Chat API ===")

  try {
    const body = await req.json()
    const { messages } = body

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: "Messages array is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }

    const lastMessage = messages[messages.length - 1]
    const userQuery = lastMessage.content

    console.log("Searching products for:", userQuery)

    // Use alternative search method
    const products = await searchProductsWithFetch(userQuery)
    console.log("Found products:", products.length)

    if (products.length === 0) {
      return new Response(
        `Üzgünüm, "${userQuery}" için ürün bulamadım. 

Şu anda test modundayız. Deneyin:
- "Nike" 
- "Adidas"
- "ayakkabı"
- "spor"`,
        {
          headers: { "Content-Type": "text/plain" },
        },
      )
    }

    // Environment variables
    const apiKey = process.env.OPENAI_API_KEY
    const baseURL = process.env.OPENAI_URL
    const deployment = process.env.OPENAI_DEPLOYMENT_NAME
    const apiVersion = process.env.OPENAI_API_VERSION

    if (!apiKey || !baseURL || !deployment || !apiVersion) {
      const productList = products
        .map(
          (product, index) => `
${index + 1}. **${product.product_name}**
   💰 Fiyat: $${product.price}
   🏷️ Kategori: ${product.category}
   🏢 Marka: ${product.brand}
   📝 ${product.description}
`,
        )
        .join("\n")

      return new Response(
        `"${userQuery}" için bulunan ürünler:

${productList}

(Test modu - AI analizi kullanılamıyor)`,
        {
          headers: { "Content-Type": "text/plain" },
        },
      )
    }

    // RAG prompt
    const systemPrompt = `Sen bir alışveriş asistanısın. 

Kullanıcı sorusu: "${userQuery}"

Bulunan ürünler:
${products
  .map(
    (product, index) => `
${index + 1}. **${product.product_name}**
   - Fiyat: $${product.price}
   - Kategori: ${product.category}
   - Marka: ${product.brand}
   - Açıklama: ${product.description}
`,
  )
  .join("\n")}

Bu ürünleri kullanıcıya öner ve hangisinin neden iyi olduğunu açıkla. 
Türkçe cevap ver ve samimi bir dil kullan.`

    // Azure OpenAI call
    const azureUrl = `${baseURL}/openai/deployments/${deployment}/chat/completions?api-version=${apiVersion}`

    const azureResponse = await fetch(azureUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": apiKey,
      },
      body: JSON.stringify({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userQuery },
        ],
        max_tokens: 800,
        temperature: 0.7,
        stream: false,
      }),
    })

    if (!azureResponse.ok) {
      const errorText = await azureResponse.text()
      console.error("Azure API Error:", errorText)

      const productList = products
        .map(
          (product, index) => `
${index + 1}. **${product.product_name}**
   💰 Fiyat: $${product.price}
   🏷️ Kategori: ${product.category}
   🏢 Marka: ${product.brand}
`,
        )
        .join("\n")

      return new Response(
        `"${userQuery}" için bulunan ürünler:

${productList}

(AI analizi kullanılamıyor, ürün listesi gösteriliyor)`,
        {
          headers: { "Content-Type": "text/plain" },
        },
      )
    }

    const azureData = await azureResponse.json()
    const aiResponse = azureData.choices?.[0]?.message?.content || "Yanıt alınamadı"

    return new Response(aiResponse, {
      headers: { "Content-Type": "text/plain" },
    })
  } catch (error) {
    console.error("Alternative products chat error:", error)
    return new Response(
      JSON.stringify({
        error: error.message,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    )
  }
}
