import { markdownToHtml, sanitizeHtml } from "@/lib/utils"

// Node.js runtime kullan
export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 30

export async function POST(req: Request) {
  console.log("=== General Chat API Started ===")

  try {
    // 1. Request body kontrolü
    const body = await req.json()
    const { messages } = body

    console.log("Messages received:", messages?.length || 0)
    console.log("First message:", messages?.[0])

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      console.error("Invalid messages array")
      return new Response(JSON.stringify({ error: "Messages array is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }

    // 2. Environment variables kontrolü
    const apiKey = process.env.OPENAI_API_KEY
    const baseURL = process.env.OPENAI_URL
    const deployment = process.env.OPENAI_DEPLOYMENT_NAME
    const apiVersion = process.env.OPENAI_API_VERSION

    console.log("Environment check:", {
      hasApiKey: !!apiKey,
      apiKeyLength: apiKey?.length || 0,
      hasBaseURL: !!baseURL,
      baseURL: baseURL,
      hasDeployment: !!deployment,
      deployment: deployment,
      hasApiVersion: !!apiVersion,
      apiVersion: apiVersion,
    })

    if (!apiKey || !baseURL || !deployment || !apiVersion) {
      const missingVars = {
        apiKey: !apiKey,
        baseURL: !baseURL,
        deployment: !deployment,
        apiVersion: !apiVersion,
      }
      console.error("Missing environment variables:", missingVars)
      return new Response(
        JSON.stringify({
          error: "Missing environment variables",
          missing: missingVars,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      )
    }

    // 3. Manuel Azure OpenAI API çağrısı (AI SDK kullanmadan)
    console.log("Making direct Azure OpenAI API call...")

    const azureUrl = `${baseURL}/openai/deployments/${deployment}/chat/completions?api-version=${apiVersion}`
    console.log("Azure URL:", azureUrl)

    const requestBody = {
      messages: messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
      max_tokens: 2000,
      temperature: 0.7,
      stream: false, // Önce stream olmadan deneyelim
    }

    console.log("Request body:", JSON.stringify(requestBody, null, 2))

    const azureResponse = await fetch(azureUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": apiKey,
      },
      body: JSON.stringify(requestBody),
    })

    console.log("Azure API Response Status:", azureResponse.status)
    console.log("Azure API Response Headers:", Object.fromEntries(azureResponse.headers.entries()))

    if (!azureResponse.ok) {
      const errorText = await azureResponse.text()
      console.error("Azure API Error Response:", errorText)
      return new Response(
        JSON.stringify({
          error: "Azure API Error",
          status: azureResponse.status,
          statusText: azureResponse.statusText,
          response: errorText,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      )
    }

    const azureData = await azureResponse.json()
    console.log("Azure API Success Response:", azureData)

    // Markdown'ı HTML'e çevir
    const assistantMessage = azureData.choices?.[0]?.message?.content || "Yanıt alınamadı"
    const htmlResponse = markdownToHtml(assistantMessage)
    const sanitizedHtml = sanitizeHtml(htmlResponse)

    return new Response(sanitizedHtml, {
      headers: {
        "Content-Type": "text/html",
      },
    })
  } catch (error) {
    console.error("=== General Chat Error ===")
    console.error("Error type:", error.constructor.name)
    console.error("Error message:", error.message)
    console.error("Error stack:", error.stack)
    console.error("Error cause:", error.cause)

    return new Response(
      JSON.stringify({
        error: error.message || "Internal server error",
        type: error.constructor.name,
        stack: error.stack,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    )
  }
}
