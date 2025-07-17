export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET() {
  try {
    console.log("=== Runtime Test ===")

    const runtimeInfo = {
      nodeVersion: process.versions?.node || "Not available",
      platform: process.platform || "Unknown",
      arch: process.arch || "Unknown",
      isNode: !!process.versions?.node,
      isEdge: !process.versions?.node,
      env: process.env.NODE_ENV,
      timestamp: new Date().toISOString(),
    }

    console.log("Runtime info:", runtimeInfo)

    // DNS test
    let dnsTest = "Not tested"
    try {
      const dns = await import("dns")
      dnsTest = "DNS module available"
    } catch (error) {
      dnsTest = `DNS error: ${error.message}`
    }

    return Response.json({
      success: true,
      runtime: runtimeInfo,
      dnsTest,
      message: runtimeInfo.isNode ? "Node.js runtime active" : "Edge runtime active",
    })
  } catch (error) {
    return Response.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 },
    )
  }
}
