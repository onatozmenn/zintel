export async function POST(req: Request) {
  try {
    console.log("=== Simple Test API ===")

    const body = await req.json()
    console.log("Request body:", body)

    // Basit text response
    return new Response("Merhaba! Bu basit bir test mesajıdır.", {
      headers: {
        "Content-Type": "text/plain",
      },
    })
  } catch (error) {
    console.error("Simple test error:", error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}
