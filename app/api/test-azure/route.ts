// Node.js runtime kullan
export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(req: Request) {
  try {
    console.log("=== Azure OpenAI Test ===")

    const apiKey = process.env.OPENAI_API_KEY
    const baseURL = process.env.OPENAI_URL
    const deployment = process.env.OPENAI_DEPLOYMENT_NAME
    const apiVersion = process.env.OPENAI_API_VERSION

    console.log("Testing Azure OpenAI connection...")
    console.log("Base URL:", baseURL)
    console.log("Deployment:", deployment)
    console.log("API Version:", apiVersion)

    // Manuel Azure OpenAI API çağrısı
    const azureUrl = `${baseURL}/openai/deployments/${deployment}/chat/completions?api-version=${apiVersion}`
    console.log("Full URL:", azureUrl)

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
            content: "Merhaba, bu bir test mesajıdır.",
          },
        ],
        max_tokens: 100,
        temperature: 0.7,
      }),
    })

    console.log("Azure API Response Status:", response.status)
    console.log("Azure API Response Headers:", Object.fromEntries(response.headers.entries()))

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Azure API Error Response:", errorText)
      return Response.json(
        {
          error: "Azure API Error",
          status: response.status,
          statusText: response.statusText,
          response: errorText,
        },
        { status: 500 },
      )
    }

    const data = await response.json()
    console.log("Azure API Success Response:", data)

    return Response.json({
      success: true,
      message: "Azure OpenAI bağlantısı başarılı!",
      response: data,
      config: {
        baseURL,
        deployment,
        apiVersion,
        hasApiKey: !!apiKey,
      },
    })
  } catch (error) {
    console.error("Azure test error:", error)
    return Response.json(
      {
        error: error.message,
        stack: error.stack,
      },
      { status: 500 },
    )
  }
}
