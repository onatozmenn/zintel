// Node.js runtime kullan
export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET() {
  try {
    console.log("=== API Test Started ===")

    const envCheck = {
      hasApiKey: !!process.env.OPENAI_API_KEY,
      apiKeyLength: process.env.OPENAI_API_KEY?.length || 0,
      apiKeyStart: process.env.OPENAI_API_KEY?.substring(0, 10) + "...",
      url: process.env.OPENAI_URL,
      deployment: process.env.OPENAI_DEPLOYMENT_NAME,
      version: process.env.OPENAI_API_VERSION,
      nodeEnv: process.env.NODE_ENV,
      appEnv: process.env.NEXT_PUBLIC_APP_ENV,
      runtime: "nodejs",
      isProduction: process.env.NODE_ENV === "production",
      timestamp: new Date().toISOString(),
    }

    console.log("Environment variables check:", envCheck)

    return Response.json({
      message: "API çalışıyor! Production ready 🚀",
      timestamp: new Date().toISOString(),
      env: envCheck,
      status: "success",
      mode: envCheck.isProduction ? "Production" : "Development",
    })
  } catch (error) {
    console.error("Test API error:", error)
    return Response.json(
      {
        message: "API test hatası",
        error: error.message,
        timestamp: new Date().toISOString(),
        status: "error",
      },
      { status: 500 },
    )
  }
}
