// Node.js runtime kullan
export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(req: Request) {
  try {
    console.log("=== Manual Chat Test ===")

    const body = await req.json()
    console.log("Request body:", body)

    // Environment variables
    const apiKey = process.env.OPENAI_API_KEY
    const baseURL = process.env.OPENAI_URL
    const deployment = process.env.OPENAI_DEPLOYMENT_NAME
    const apiVersion = process.env.OPENAI_API_VERSION

    console.log("Environment variables:", {
      hasApiKey: !!apiKey,
      baseURL,
      deployment,
      apiVersion,
    })

    if (!apiKey || !baseURL || !deployment || !apiVersion) {
      return Response.json({ error: "Missing environment variables" }, { status: 500 })
    }

    // Direct Azure OpenAI call
    const azureUrl = `${baseURL}/openai/deployments/${deployment}/chat/completions?api-version=${apiVersion}`
    console.log("Calling Azure URL:", azureUrl)

    const response = await fetch(azureUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": apiKey,
      },
      body: JSON.stringify({
        messages: [
          {
            role: "user",
            content: "Merhaba, nasılsın?",
          },
        ],
        max_tokens: 100,
        temperature: 0.7,
      }),
    })

    console.log("Azure response status:", response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Azure error:", errorText)
      return Response.json({ error: errorText }, { status: response.status })
    }

    const data = await response.json()
    console.log("Azure success:", data)

    return Response.json({
      success: true,
      message: data.choices?.[0]?.message?.content || "No response",
      fullResponse: data,
    })
  } catch (error) {
    console.error("Manual chat test error:", error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}
