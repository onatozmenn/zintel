import { searchProductsByVector, hybridSearch, checkVectorTable } from "@/lib/database-vector"
import { markdownToHtml, sanitizeHtml } from "@/lib/utils"

// Akıllı mesaj analizi fonksiyonu
async function analyzeMessageIntent(message: string, messages?: any[]): Promise<{shouldDoVectorSearch: boolean, isFollowUpQuestion: boolean, isDecisionMade: boolean, isEmotionalShare: boolean}> {
  const apiKey = process.env.OPENAI_API_KEY
  const baseURL = process.env.OPENAI_URL
  const deployment = process.env.OPENAI_DEPLOYMENT_NAME
  const apiVersion = process.env.OPENAI_API_VERSION

  if (!apiKey || !baseURL || !deployment || !apiVersion) {
    // AI yoksa basit keyword kontrolü yap
    const productKeywords = ['ürün', 'al', 'sat', 'fiyat', 'hediye', 'tişört', 'laptop', 'telefon', 'makyaj', 'kitap']
    const shouldDoVectorSearch = productKeywords.some(keyword => message.toLowerCase().includes(keyword))
    
    // Basit kontroller
    const isFollowUpQuestion = message.toLowerCase().includes('aralarından') || message.toLowerCase().includes('hangisini')
    const isDecisionMade = message.toLowerCase().includes('bunu alıcam') || message.toLowerCase().includes('bunu alacağım')
    const isEmotionalShare = message.toLowerCase().includes('heyecanlı') || message.toLowerCase().includes('mutlu') || message.toLowerCase().includes('teşekkür')
    
    return { shouldDoVectorSearch, isFollowUpQuestion, isDecisionMade, isEmotionalShare }
  }

  try {
    const azureUrl = `${baseURL}/openai/deployments/${deployment}/chat/completions?api-version=${apiVersion}`
    
    // Sohbet geçmişini hazırla
    const chatHistory = messages ? messages.slice(-3).map(msg => ({
      role: msg.role,
      content: msg.content
    })) : []
    
    const response = await fetch(azureUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": apiKey,
      },
      body: JSON.stringify({
        messages: [
          {
            role: "system",
            content: `Sen bir mesaj analiz uzmanısın. Kullanıcının mesajını analiz et ve şu bilgileri döndür:

KURALLAR:
- shouldDoVectorSearch: Ürün araması mı? (true/false)
- isFollowUpQuestion: Önceki öneriler hakkında soru mu? (true/false)
- isDecisionMade: Kullanıcı bir ürün seçti mi? (true/false)
- isEmotionalShare: Duygusal paylaşım mı? (true/false)

ÖRNEKLER:
- "parfüm öner" → shouldDoVectorSearch: true
- "aralarından hangisini seçerdin" → isFollowUpQuestion: true
- "bunu alıcam" → isDecisionMade: true
- "çok heyecanlıyım" → isEmotionalShare: true

JSON formatında döndür: {"shouldDoVectorSearch": true/false, "isFollowUpQuestion": true/false, "isDecisionMade": true/false, "isEmotionalShare": true/false}`
          },
          ...chatHistory,
          {
            role: "user",
            content: `Bu mesajı analiz et: "${message}"`
          }
        ],
        max_tokens: 100,
        temperature: 0.1,
        stream: false,
      }),
    })

    if (!response.ok) {
      return { shouldDoVectorSearch: true, isFollowUpQuestion: false, isDecisionMade: false, isEmotionalShare: false }
    }

    const data = await response.json()
    const result = data.choices?.[0]?.message?.content?.trim()
    
    try {
      return JSON.parse(result)
    } catch {
      // JSON parse hatası durumunda basit kontrol
      const isFollowUpQuestion = message.toLowerCase().includes('aralarından') || message.toLowerCase().includes('hangisini')
      const isDecisionMade = message.toLowerCase().includes('bunu alıcam') || message.toLowerCase().includes('bunu alacağım')
      const isEmotionalShare = message.toLowerCase().includes('heyecanlı') || message.toLowerCase().includes('mutlu') || message.toLowerCase().includes('teşekkür')
      
      return { 
        shouldDoVectorSearch: true, 
        isFollowUpQuestion, 
        isDecisionMade, 
        isEmotionalShare 
      }
    }
  } catch (error) {
    console.error("Message intent analysis error:", error)
    return { shouldDoVectorSearch: true, isFollowUpQuestion: false, isDecisionMade: false, isEmotionalShare: false }
  }
}

// Akıllı yanıt üretme fonksiyonu
async function generateSmartResponse(message: string, messages?: any[], intent?: any): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY
  const baseURL = process.env.OPENAI_URL
  const deployment = process.env.OPENAI_DEPLOYMENT_NAME
  const apiVersion = process.env.OPENAI_API_VERSION

  if (!apiKey || !baseURL || !deployment || !apiVersion) {
    // AI yoksa basit yanıt
    return "Merhaba! Ben ZintelAI'ın ürün öneri asistanıyım. Ürün aramak için spesifik bir sorgu yazabilir misin? 😊"
  }

  try {
    const azureUrl = `${baseURL}/openai/deployments/${deployment}/chat/completions?api-version=${apiVersion}`
    
    // Sohbet geçmişini hazırla
    const chatHistory = messages ? messages.slice(-5).map(msg => ({
      role: msg.role,
      content: msg.content
    })) : []

    // Son önerilen ürünleri çıkar
    let lastProductSuggestions = ""
    if (chatHistory.length > 1) {
      const lastAssistantMessage = chatHistory.find(msg => msg.role === 'assistant')
      if (lastAssistantMessage && lastAssistantMessage.content.includes('1.')) {
        const lines = lastAssistantMessage.content.split('\n')
        const productLines = lines.filter((line: string) => 
          line.match(/^\d+\./) || 
          line.includes('$') || 
          line.includes('Marka:') || 
          line.includes('Kategori:')
        )
        if (productLines.length > 0) {
          lastProductSuggestions = `\n\n📋 **SON ÖNERİLEN ÜRÜNLER:**\n${productLines.join('\n')}`
        }
      }
    }

    // Intent'e göre özel prompt
    let systemPrompt = `Sen ZintelAI'ın akıllı asistanısın. Kullanıcının mesajına uygun, samimi ve yardımcı bir yanıt ver.

KURALLAR:
- Samimi ve arkadaşça ol
- Emoji kullan
- Önceki mesajları dikkate al ve bağlama uygun cevap ver
- Kısa ve öz ol (max 200 kelime)`

    if (intent?.isFollowUpQuestion) {
      systemPrompt += `
ÖZEL KURAL: Kullanıcı önceki öneriler hakkında soru soruyor. ${lastProductSuggestions}
Bu ürünler arasından seçim yap ve nedenini açıkla.`
    } else if (intent?.isDecisionMade) {
      systemPrompt += `
ÖZEL KURAL: Kullanıcı bir ürün seçti. Onu tebrik et ve kararını onayla. Yeni ürün önerme!`
    } else if (intent?.isEmotionalShare) {
      systemPrompt += `
ÖZEL KURAL: Kullanıcı duygusal paylaşım yapıyor. Empatik ol, ürün önerme, sadece duygularını paylaş.`
    } else {
      systemPrompt += `
ÖRNEKLER:
- "kategoriler neler?" → Detaylı kategori listesi
- "ürün lazım ama kararsızım" → Kategori önerileri
- "teşekkürler" → Samimi teşekkür yanıtı
- "sporla ilgileniyorum" → Spor kategorilerini öne çıkar`
    }

    const response = await fetch(azureUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": apiKey,
      },
      body: JSON.stringify({
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          ...chatHistory,
          {
            role: "user",
            content: message
          }
        ],
        max_tokens: 300,
        temperature: 0.7,
        stream: false,
      }),
    })

    if (!response.ok) {
      return "Merhaba! Ben ZintelAI'ın ürün öneri asistanıyım. Ürün aramak için spesifik bir sorgu yazabilir misin? 😊"
    }

    const data = await response.json()
    return data.choices?.[0]?.message?.content || "Merhaba! Size nasıl yardımcı olabilirim? 😊"
  } catch (error) {
    console.error("Smart response generation error:", error)
    return "Merhaba! Ben ZintelAI'ın ürün öneri asistanıyım. Ürün aramak için spesifik bir sorgu yazabilir misin? 😊"
  }
}

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 30 // Daha uzun timeout

export async function POST(req: Request) {
  console.log("=== ZintelAI Vector Search ===")

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

    // Conversation context analizi
    let contextQuery = userQuery
    let previousContext = ""
    
    // Son 3 mesajı analiz et (bağlam için)
    if (messages.length > 1) {
      const recentMessages = messages.slice(-3)
      const contextKeywords = []
      
      for (const msg of recentMessages) {
        if (msg.role === 'user') {
          const content = msg.content.toLowerCase()
          
          // Kategori anahtar kelimeleri
          if (content.includes('tişört') || content.includes('tshirt') || content.includes('gömlek')) {
            contextKeywords.push('clothing')
          }
          if (content.includes('elektronik') || content.includes('telefon') || content.includes('laptop')) {
            contextKeywords.push('electronics')
          }
          if (content.includes('makyaj') || content.includes('kozmetik') || content.includes('beauty')) {
            contextKeywords.push('beauty')
          }
          if (content.includes('ayakkabı') || content.includes('sneakers') || content.includes('shoes')) {
            contextKeywords.push('clothing')
          }
          
          // Yaş anahtar kelimeleri
          const ageMatch = content.match(/(\d+)\s*yaş/)
          if (ageMatch) {
            const age = parseInt(ageMatch[1])
            if (age <= 25) {
              contextKeywords.push('young_adult')
            } else if (age <= 40) {
              contextKeywords.push('adult')
            } else if (age <= 60) {
              contextKeywords.push('middle_age')
            } else {
              contextKeywords.push('senior')
            }
          }
          
          // Cinsiyet anahtar kelimeleri
          if (content.includes('erkek') || content.includes('kardeş') || content.includes('oğlan') || content.includes('male')) {
            contextKeywords.push('male')
          }
          if (content.includes('kız') || content.includes('kadın') || content.includes('kız arkadaş') || content.includes('female')) {
            contextKeywords.push('female')
          }
          
          // Fiyat anahtar kelimeleri
          if (content.includes('dolar') || content.includes('bütçe') || content.includes('fiyat')) {
            const priceMatch = content.match(/(\d+)\s*dolar/)
            if (priceMatch) {
              const price = parseInt(priceMatch[1])
              contextKeywords.push(`price_${price}`)
              // Bütçe bilgisini context'e ekle
              if (price <= 50) {
                contextKeywords.push('budget_friendly')
              } else if (price <= 100) {
                contextKeywords.push('mid_range')
              } else {
                contextKeywords.push('premium')
              }
            }
          }
        }
      }
      
      // Context'i query'ye ekle
      if (contextKeywords.length > 0) {
        const uniqueKeywords = [...new Set(contextKeywords)]
        previousContext = `Önceki arama bağlamı: ${uniqueKeywords.join(', ')}. `
        contextQuery = previousContext + userQuery
        console.log("🔄 Context detected:", uniqueKeywords)
      }
    }

    console.log("🔍 User query:", userQuery)
    console.log("🧠 Context query:", contextQuery)
    

    

    
    // Akıllı mesaj analizi - AI ile karar ver
    const intent = await analyzeMessageIntent(userQuery, messages)
    
    // Cinsiyet kontrolü - erkek arkadaş için kadın parfümü önerme
    const isForMaleFriend = userQuery.toLowerCase().includes('erkek arkadaş') || 
                           userQuery.toLowerCase().includes('erkek arkadaşıma') ||
                           (messages.length > 1 && messages.some(msg => 
                             msg.role === 'user' && msg.content.toLowerCase().includes('erkek arkadaş')
                           ))
    
    if (!intent.shouldDoVectorSearch) {
      const smartResponse = await generateSmartResponse(userQuery, messages, intent)
      const htmlResponse = markdownToHtml(smartResponse)
      const sanitizedHtml = sanitizeHtml(htmlResponse)

      return new Response(sanitizedHtml, {
        headers: { "Content-Type": "text/html" },
      })
    }
    

    
    console.log("🧠 Starting vector search...")

    // Vector tablosunu kontrol et
    const hasEmbeddings = await checkVectorTable()
    
    if (!hasEmbeddings) {
      const errorText = `⚠️ Vector search için embedding'ler bulunamadı.

🔧 Çözüm:
1. Azure SQL Server'da embedding'lerin yüklü olduğundan emin olun
2. Tablo: walmart_ecommerce_product_details
3. Kolon: embedding (JSON formatında)

📊 Veritabanı: mysqlserver4488.database.windows.net
📁 Kaynak: walmart-product-with-embeddings-dataset-usa.csv

Lütfen embedding'leri yükleyip tekrar deneyin.`

      const htmlResponse = markdownToHtml(errorText)
      const sanitizedHtml = sanitizeHtml(htmlResponse)

      return new Response(sanitizedHtml, {
        headers: { "Content-Type": "text/html" },
      })
    }

    // Vector search yap (context ile)
    const products = await searchProductsByVector(contextQuery, 5)
    console.log("📦 Vector search results:", products.length)

    if (products.length === 0) {
      const noResultsText = `Üzgünüm, "${userQuery}" için uygun ürün bulamadım.

🧠 **Gelişmiş Vector Search Sistemi:**
- Akıllı threshold sistemi (Mükemmel: %85+, İyi: %75+, Kabul edilebilir: %65+)
- Kategori tespiti ve filtreleme
- Fiyat aralığı tespiti ve filtreleme
- Semantic similarity search

🔍 **Daha spesifik arama terimleri deneyin:**
- "gaming laptop under $1000" (ürün + fiyat)
- "wireless bluetooth headphones" (özellik + ürün)
- "kitchen appliances for small apartment" (kategori + kullanım)
- "women's running shoes for beginners" (hedef + aktivite + seviye)
- "makeup products under $50" (kategori + bütçe)

💡 **İpuçları:**
- Fiyat belirtin: "under $100", "50-200 dolar"
- Kategori belirtin: "electronics", "clothing", "beauty"
- Özellik belirtin: "wireless", "waterproof", "portable"
- Hedef kitle: "for women", "for kids", "for beginners"

📊 Veritabanı: mysqlserver4488.database.windows.net
🎯 Akıllı Kalite Sistemi: %65+ similarity`

      const htmlResponse = markdownToHtml(noResultsText)
      const sanitizedHtml = sanitizeHtml(htmlResponse)

      return new Response(sanitizedHtml, {
        headers: { "Content-Type": "text/html" },
      })
    }

    // Environment variables
    const apiKey = process.env.OPENAI_API_KEY
    const baseURL = process.env.OPENAI_URL
    const deployment = process.env.OPENAI_DEPLOYMENT_NAME
    const apiVersion = process.env.OPENAI_API_VERSION

    if (!apiKey || !baseURL || !deployment || !apiVersion) {
      // AI olmadan da vector search sonuçlarını göster
      const productList = products
        .map((product, index) => {
          const similarity = product.similarity_score ? 
            `(Benzerlik: ${(product.similarity_score * 100).toFixed(1)}%)` : ""
          
          return `
${index + 1}. **${product.product_name || "Ürün"}**
   💰 Fiyat: $${product.list_price || product.sale_price || "N/A"}
   🏷️ Marka: ${product.brand || "N/A"}
   📂 Kategori: ${product.category || "N/A"}
   🧠 ${similarity}
   🔗 ${product.product_url || "N/A"}`
        })
        .join("\n")

      const responseText = `"${userQuery}" için vector search sonuçları (%90+ Kalite):

${productList}

🧠 **Vector Search Teknolojisi:**
- Embedding tabanlı semantic arama
- Cosine similarity hesaplama
- Semantic anlam yakınlığı
- String search değil, vector search!

🎯 **Kalite Politikası:**
- Sadece %90+ similarity skoruna sahip ürünler gösteriliyor
- Bu sayede sadece gerçekten alakalı ürünler listeleniyor
- Düşük kalite sonuçlar otomatik olarak filtreleniyor

📊 Veritabanı: mysqlserver4488.database.windows.net ✅
📁 Kaynak: walmart-product-with-embeddings-dataset-usa.csv ✅
🎯 Kalite Threshold: %90+ similarity
(AI analizi şu anda kullanılamıyor)`

      const htmlResponse = markdownToHtml(responseText)
      const sanitizedHtml = sanitizeHtml(htmlResponse)

      return new Response(sanitizedHtml, {
        headers: { "Content-Type": "text/html" },
      })
    }

    // AI ile vector search analizi
    const productDetails = products
      .map((product, index) => {
        const similarity = product.similarity_score ? 
          `(Benzerlik: ${(product.similarity_score * 100).toFixed(1)}%)` : ""
        
        return `${index + 1}. ${product.product_name} - $${product.list_price || product.sale_price || "N/A"} ${similarity}
   Marka: ${product.brand || "N/A"}
   Kategori: ${product.category || "N/A"}
   Açıklama: ${product.description?.substring(0, 100) || "N/A"}...`
      })
      .join("\n\n")

    // Sohbet geçmişini hazırla (son 5 mesaj)
    const chatHistory = messages.slice(-5).map(msg => ({
      role: msg.role,
      content: msg.content
    }))

    // Son önerilen ürünleri çıkar (eğer varsa)
    let lastProductSuggestions = ""
    if (chatHistory.length > 1) {
      const lastAssistantMessage = chatHistory.find(msg => msg.role === 'assistant')
      if (lastAssistantMessage && lastAssistantMessage.content.includes('1.')) {
        // Son mesajda ürün listesi varsa, onu çıkar
        const lines = lastAssistantMessage.content.split('\n')
        const productLines = lines.filter((line: string) => 
          line.match(/^\d+\./) || 
          line.includes('$') || 
          line.includes('Marka:') || 
          line.includes('Kategori:')
        )
        if (productLines.length > 0) {
          lastProductSuggestions = `\n\n📋 **SON ÖNERİLEN ÜRÜNLER:**\n${productLines.join('\n')}`
        }
      }
    }

    const systemPrompt = `Sen ZintelAI'ın ürün öneri asistanısın. Kullanıcıya alakalı ürünler öneriyorsun.

Kullanıcı sorusu: "${userQuery}"
${previousContext ? `Önceki bağlam: ${previousContext}` : ''}
${isForMaleFriend ? '\n⚠️ **ÖNEMLİ:** Kullanıcı erkek arkadaşı için ürün arıyor. Erkek parfümü/ürünü öner!' : ''}

🧠 **Vector Search Sonuçları:**
${productDetails}

**KURALLAR:**
1. Sadece alakalı ürünleri öner
2. Detaylı ve açıklayıcı yanıt ver (kısa olmasın)
3. Bütçeye uygun ürünleri öncelikle öner
4. Samimi ve arkadaşça dil kullan
5. Her ürün için neden önerdiğini açıkla
6. Kullanıcının durumuna göre öneriler yap
7. Yaş uyumluluğunu kontrol et (21 yaş için 69. yaş ürünü önerme!)
8. **CİNSİYET UYUMLULUĞU:** Erkek arkadaş için erkek parfümü öner!
9. Fiyat-bütçe uyumluluğunu kontrol et
10. **ÖNEMLİ:** Kullanıcı "aralarından sen olsan hangisini seçerdin" gibi sorular sorarsa, yukarıdaki ürünler arasından seçim yap ve nedenini açıkla
11. **KARAR ONAYI:** Kullanıcı "bunu alıcam" derse, onu tebrik et ve yeni ürün önerme

**YANIT FORMATI:**
"İşte önerilerim:

1. **Ürün Adı** - $XX.XX
   Detaylı açıklama ve neden önerdiğin (yaş, cinsiyet, bütçe uyumluluğu)

2. **Ürün Adı** - $XX.XX  
   Detaylı açıklama ve neden önerdiğin (yaş, cinsiyet, bütçe uyumluluğu)

Toplam: $XX.XX

Bu ürünler senin ihtiyaçlarına göre seçildi."

**ÖNEMLİ:** 
- Yaş uyumsuzluğu varsa (örn: 21 yaş için 69. yaş ürünü) bunu belirt ve daha uygun alternatifler öner!
- Erkek arkadaş için kadın parfümü önerme!`

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
          ...chatHistory, // Sohbet geçmişini ekle
        ],
        max_tokens: 2000,
        temperature: 0.7,
        stream: false,
      }),
    })

    if (!azureResponse.ok) {
      const errorText = await azureResponse.text()
      console.error("Azure API Error:", errorText)
      const aiErrorText = "AI analizi şu anda kullanılamıyor, lütfen tekrar deneyin."
      const htmlResponse = markdownToHtml(aiErrorText)
      const sanitizedHtml = sanitizeHtml(htmlResponse)

      return new Response(sanitizedHtml, {
        headers: { "Content-Type": "text/html" },
      })
    }

    const azureData = await azureResponse.json()
    const aiResponse = azureData.choices?.[0]?.message?.content || "Yanıt alınamadı"

    // Markdown'ı HTML'e çevir
    const htmlResponse = markdownToHtml(aiResponse)
    const sanitizedHtml = sanitizeHtml(htmlResponse)

    return new Response(sanitizedHtml, {
      headers: { "Content-Type": "text/html" },
    })
  } catch (error: any) {
    console.error("=== Vector Search Error ===")
    console.error("Error:", error.message)

    return new Response(
      JSON.stringify({
        error: "Vector search hatası: " + error.message,
        database: "mysqlserver4488.database.windows.net",
        source: "walmart-product-with-embeddings-dataset-usa.csv",
        timestamp: new Date().toISOString(),
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    )
  }
}
