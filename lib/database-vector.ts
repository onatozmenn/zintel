import sql from "mssql"

// Hızlı cache sistemi
const searchCache = new Map<string, { results: any[], timestamp: number }>()
const CACHE_DURATION = 30 * 60 * 1000 // 30 dakika - çok daha uzun cache

const config = {
  server: "mysqlserver4488.database.windows.net",
  database: "mySampleDatabase",
  user: "azureuser",
  password: "Onatazure4488",
  port: 1433,
  options: {
    encrypt: true,
    trustServerCertificate: false,
    enableArithAbort: true,
  },
  pool: {
    max: 20,
    min: 0,
    idleTimeoutMillis: 30000,
  },
  connectionTimeout: 30000,
  requestTimeout: 30000,
}

let pool: sql.ConnectionPool | null = null

export async function getConnection() {
  if (!pool) {
    console.log("🔌 Creating new database connection to mysqlserver4488...")
    pool = new sql.ConnectionPool(config)
    await pool.connect()
    console.log("✅ Connected to mysqlserver4488.database.windows.net")
  }
  return pool
}

// Embedding oluşturma fonksiyonu
export async function createEmbedding(text: string): Promise<number[]> {
  try {
    console.log("🧠 Creating embedding for:", text.substring(0, 50) + "...")

    const apiKey = process.env.OPENAI_API_KEY
    const baseURL = process.env.OPENAI_URL
    const deploymentName = process.env.EMBEDDINGS_DEPLOYMENT_NAME || "embeddings"
    const apiVersion = process.env.OPENAI_API_VERSION || "2023-05-15"

    if (!apiKey || !baseURL) {
      throw new Error("Missing OpenAI API key or base URL")
    }

    const embeddingsUrl = `${baseURL}/openai/deployments/${deploymentName}/embeddings?api-version=${apiVersion}`

    const response = await fetch(embeddingsUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": apiKey,
      },
      body: JSON.stringify({
        input: text,
        model: "text-embedding-ada-002",
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Embedding API error: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    const embedding = data.data[0].embedding

    console.log("✅ Embedding created, length:", embedding.length)
    return embedding
  } catch (error) {
    console.error("❌ Error creating embedding:", error)
    throw error
  }
}

// Cosine similarity hesaplama fonksiyonu (optimized)
function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0, normA = 0, normB = 0
  const len = Math.min(a.length, b.length)
  for (let i = 0; i < len; i++) {
    const ai = a[i], bi = b[i]
    dot += ai * bi
    normA += ai * ai
    normB += bi * bi
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB))
}

// Gelişmiş kategori tespiti
function detectCategory(query: string): string[] {
  const queryLower = query.toLowerCase()
  
  // Daha detaylı kategori mapping
  const categories = {
    'electronics': [
      'laptop', 'computer', 'phone', 'smartphone', 'tablet', 'gaming', 'electronic', 'elektronik',
      'headphone', 'earphone', 'speaker', 'camera', 'tv', 'television', 'monitor',
      'keyboard', 'mouse', 'printer', 'scanner', 'router', 'modem', 'cable',
      'charger', 'battery', 'power', 'wireless', 'bluetooth', 'wifi', 'usb'
    ],
    'clothing': [
      'shirt', 'dress', 'pants', 'jeans', 'shoes', 'sneakers', 'footwear', 'clothing',
      'jacket', 'coat', 'sweater', 'hoodie', 't-shirt', 'blouse', 'skirt', 'shorts',
      'socks', 'underwear', 'bra', 'lingerie', 'suit', 'tie', 'belt', 'hat', 'cap',
      'scarf', 'gloves', 'mittens', 'boots', 'sandals', 'flip-flops', 'heels',
      'tişört', 'tshirt', 't-shirt', 'gömlek', 'elbise', 'pantolon', 'ayakkabı'
    ],
    'beauty': [
      'makeup', 'cosmetic', 'beauty', 'skincare', 'perfume', 'lipstick', 'foundation',
      'mascara', 'eyeliner', 'eyeshadow', 'blush', 'bronzer', 'concealer', 'powder',
      'nail polish', 'nail care', 'hair care', 'shampoo', 'conditioner', 'hair dryer',
      'straightener', 'curler', 'brush', 'comb', 'mirror', 'tweezers', 'razor',
      'kozmetik', 'makyaj', 'cilt bakımı', 'parfüm', 'ruj', 'fondöten', 'maskara',
      'göz farı', 'allık', 'oje', 'saç bakımı', 'şampuan', 'saç kremi', 'saç kurutma',
      'saç düzleştirici', 'saç maşası', 'fırça', 'tarak', 'ayna', 'cımbız'
    ],
    'home': [
      'kitchen', 'appliance', 'furniture', 'home', 'decor', 'garden', 'bedroom',
      'living room', 'dining', 'bathroom', 'laundry', 'cleaning', 'storage',
      'lighting', 'cookware', 'utensil', 'dish', 'cup', 'glass', 'mug', 'plate',
      'bowl', 'pot', 'pan', 'knife', 'fork', 'spoon', 'towel', 'bedding', 'pillow'
    ],
    'sports': [
      'sport', 'fitness', 'exercise', 'gym', 'running', 'basketball', 'football',
      'soccer', 'tennis', 'golf', 'swimming', 'yoga', 'pilates', 'weight', 'dumbbell',
      'treadmill', 'bicycle', 'bike', 'helmet', 'gloves', 'bag', 'water bottle',
      'protein', 'supplement', 'vitamin', 'nutrition'
    ],
    'toys': [
      'toy', 'game', 'play', 'children', 'kids', 'baby', 'doll', 'car', 'truck',
      'puzzle', 'board game', 'card game', 'video game', 'console', 'controller',
      'stuffed animal', 'teddy bear', 'building block', 'lego', 'art', 'craft',
      'coloring', 'book', 'educational', 'learning'
    ],
    'books': [
      'book', 'reading', 'novel', 'textbook', 'magazine', 'journal', 'newspaper',
      'fiction', 'non-fiction', 'romance', 'mystery', 'thriller', 'science fiction',
      'fantasy', 'biography', 'autobiography', 'history', 'science', 'math',
      'literature', 'poetry', 'dictionary', 'encyclopedia', 'manual', 'guide'
    ],
    'automotive': [
      'car', 'automotive', 'vehicle', 'tire', 'oil', 'filter', 'battery', 'brake',
      'engine', 'transmission', 'exhaust', 'muffler', 'radiator', 'coolant',
      'windshield', 'wiper', 'mirror', 'seat', 'steering wheel', 'dashboard'
    ],
    'outdoor': [
      'camping', 'hiking', 'fishing', 'hunting', 'backpack', 'tent', 'sleeping bag',
      'flashlight', 'lantern', 'compass', 'map', 'binoculars', 'telescope',
      'grill', 'bbq', 'picnic', 'beach', 'pool', 'umbrella', 'chair', 'table'
    ]
  }
  
  // Ağırlıklı kategori tespiti
  const categoryScores = {}
  
  for (const [category, keywords] of Object.entries(categories)) {
    let score = 0
    for (const keyword of keywords) {
      if (queryLower.includes(keyword)) {
        // Daha uzun keyword'ler daha yüksek ağırlık alır
        score += keyword.length * 0.1
      }
    }
    if (score > 0) {
      categoryScores[category] = score
    }
  }
  
  // En yüksek skorlu kategorileri döndür (minimum 0.5 skor)
  const detected = Object.entries(categoryScores)
    .filter(([_, score]) => score >= 0.5)
    .sort(([_, a], [__, b]) => b - a)
    .map(([category, _]) => category)
  
  return detected
}

// Fiyat aralığı tespiti
function detectPriceRange(query: string): { min?: number, max?: number } {
  const queryLower = query.toLowerCase()
  
  // Fiyat pattern'leri
  const pricePatterns = [
    { pattern: /(\d+)\s*dolar\s*altı/i, max: (match) => parseInt(match[1]) },
    { pattern: /(\d+)\s*dolar\s*üstü/i, min: (match) => parseInt(match[1]) },
    { pattern: /(\d+)\s*-\s*(\d+)\s*dolar/i, min: (match) => parseInt(match[1]), max: (match) => parseInt(match[2]) },
    { pattern: /under\s*\$?(\d+)/i, max: (match) => parseInt(match[1]) },
    { pattern: /over\s*\$?(\d+)/i, min: (match) => parseInt(match[1]) },
    { pattern: /\$?(\d+)\s*-\s*\$?(\d+)/i, min: (match) => parseInt(match[1]), max: (match) => parseInt(match[2]) },
    { pattern: /cheap|ucuz|düşük\s*fiyat/i, max: 50 },
    { pattern: /expensive|pahalı|yüksek\s*fiyat/i, min: 200 },
    { pattern: /budget|bütçe/i, max: 100 }
  ]
  
  for (const { pattern, min, max } of pricePatterns) {
    const match = queryLower.match(pattern)
    if (match) {
      return {
        min: typeof min === 'function' ? min(match) : min,
        max: typeof max === 'function' ? max(match) : max
      }
    }
  }
  
  return {}
}

// Vector similarity search fonksiyonu (Node.js tarafında cosine similarity)
export async function searchProductsByVector(query: string, limit = 5): Promise<any[]> {
  try {
    console.log("🔍 Starting vector search for:", query)
    
    // Cache kontrolü (context dahil)
    const cacheKey = `${query.toLowerCase()}_${limit}`
    const cached = searchCache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log("⚡ Cache hit! Returning cached results")
      return cached.results
    }

    // 1. Query için embedding oluştur
    const queryEmbedding = await createEmbedding(query)
    console.log("📊 Query embedding created")

    // 2. Veritabanı bağlantısı
    const connection = await getConnection()

    // 3. Kategori ve fiyat tespiti yap
    const detectedCategories = detectCategory(query)
    const priceRange = detectPriceRange(query)
    
    console.log(`🎯 Tespit edilen kategoriler:`, detectedCategories)
    console.log(`💰 Fiyat aralığı:`, priceRange)
    
    // 4. HIZLI ürün çekme - PERFORMANS ODAKLI
    let productLimit = 300 // Çok daha az ürün çek - performans için
    let sqlQuery = `
      SELECT TOP (${productLimit})
        id,
        product_name,
        description,
        list_price,
        sale_price,
        brand,
        category,
        product_url,
        embedding
      FROM [dbo].[walmart_ecommerce_product_details]
      WHERE embedding IS NOT NULL
    `
    
    const conditions = []
    
    // Kategori filtresi - sadece güçlü eşleşmeler
    if (detectedCategories.length > 0) {
      const categoryConditions = detectedCategories.map(cat => 
        `category LIKE '%${cat}%'`
      ).join(' OR ')
      conditions.push(`(${categoryConditions})`)
      
      // Kategori varsa biraz daha çek
      productLimit = 500
    }
    
    // Fiyat filtresi
    if (priceRange.min !== undefined || priceRange.max !== undefined) {
      let priceCondition = ''
      if (priceRange.min !== undefined && priceRange.max !== undefined) {
        priceCondition = `(list_price >= ${priceRange.min} AND list_price <= ${priceRange.max})`
      } else if (priceRange.min !== undefined) {
        priceCondition = `list_price >= ${priceRange.min}`
      } else if (priceRange.max !== undefined) {
        priceCondition = `list_price <= ${priceRange.max}`
      }
      conditions.push(priceCondition)
    }
    
    // Koşulları birleştir
    if (conditions.length > 0) {
      sqlQuery += ` AND ${conditions.join(' AND ')}`
    }
    
    // Hızlı sıralama
    sqlQuery += ` ORDER BY NEWID()`
    
    const result = await connection.request().query(sqlQuery)
    const products = result.recordset
    console.log(`✅ ${products.length} ürün embedding ile çekildi`)

    // 5. ÇOK HIZLI similarity hesaplama - TEK SEFERDE
    const scored = []
    
    // Tüm ürünleri tek seferde işle (paralel)
    const similarityPromises = products.map(async (product) => {
      let emb = product.embedding
      
      // Hızlı embedding parse
      if (typeof emb === "string") {
        try {
          emb = JSON.parse(emb)
        } catch (e) {
          return null
        }
      }
      
      if (!Array.isArray(emb) || emb.length !== queryEmbedding.length) return null
      
      const score = cosineSimilarity(queryEmbedding, emb)
      
      // Sadece yüksek skorlu ürünleri döndür (performans için)
      if (score >= 0.5) {
        return { ...product, similarity_score: score }
      }
      return null
    })
    
    // Tüm similarity hesaplamalarını bekle
    const allResults = await Promise.all(similarityPromises)
    scored.push(...allResults.filter(result => result !== null))
    
    console.log(`⚡ ${scored.length} yüksek kalite ürün bulundu`)

    // 5. Akıllı sonuç sıralama
    scored.sort((a, b) => {
      // Ana kriter: similarity score
      const scoreDiff = b.similarity_score - a.similarity_score
      if (Math.abs(scoreDiff) > 0.05) return scoreDiff
      
      // İkincil kriter: fiyat (varsa fiyat aralığına uygunluk)
      if (priceRange.min !== undefined || priceRange.max !== undefined) {
        const aPrice = a.list_price || a.sale_price || 0
        const bPrice = b.list_price || b.sale_price || 0
        
        // Fiyat aralığına daha yakın olanı öncelikle
        if (priceRange.max !== undefined) {
          const aDistance = Math.abs(aPrice - priceRange.max)
          const bDistance = Math.abs(bPrice - priceRange.max)
          if (Math.abs(aDistance - bDistance) > 10) {
            return aDistance - bDistance
          }
        }
      }
      
      // Üçüncül kriter: kategori uygunluğu
      if (detectedCategories.length > 0) {
        const aCategory = (a.category || '').toLowerCase()
        const bCategory = (b.category || '').toLowerCase()
        const aMatch = detectedCategories.some(cat => aCategory.includes(cat))
        const bMatch = detectedCategories.some(cat => bCategory.includes(cat))
        
        if (aMatch && !bMatch) return -1
        if (!aMatch && bMatch) return 1
      }
      
      return scoreDiff
    })
    
    console.log("📊 Top similarity scores:", scored.slice(0, 5).map(x => x.similarity_score.toFixed(4)))
    
    // BASİT threshold sistemi - ÇOK HIZLI
    // Zaten 0.5+ skorlu ürünler filtrelendi, sadece sırala
    scored.sort((a, b) => b.similarity_score - a.similarity_score)
    
    console.log("📊 Top similarity scores:", scored.slice(0, 5).map(x => x.similarity_score.toFixed(4)))
    
    // En yüksek skorlu ürünleri döndür
    const finalResults = scored.slice(0, limit)
    console.log(`✅ ${finalResults.length} yüksek kalite ürün döndürülüyor`)
    
    // Cache'e kaydet
    searchCache.set(cacheKey, { results: finalResults, timestamp: Date.now() })
    console.log("💾 Results cached for future use")
    
    return finalResults
  } catch (error) {
    console.error("❌ Vector search error:", error)
    throw error
  }
}

// Hybrid search: Vector + Text (fallback için)
export async function hybridSearch(query: string, limit = 5): Promise<any[]> {
  try {
    console.log("🔍 Starting hybrid search for:", query)

    // Önce vector search dene
    try {
      const vectorResults = await searchProductsByVector(query, limit)
      if (vectorResults.length > 0) {
        console.log("✅ Vector search successful")
        return vectorResults
      }
    } catch (vectorError) {
      console.warn("⚠️ Vector search failed, falling back to text search:", vectorError)
    }

    // Vector search başarısız olursa text search kullan
    console.log("🔄 Falling back to text search...")
    const connection = await getConnection()

    const textQuery = `
      SELECT TOP (@limit)
        id,
        product_name,
        description,
        list_price,
        sale_price,
        brand,
        category,
        product_url
      FROM [dbo].[walmart_ecommerce_product_details]
      WHERE 
        product_name LIKE @searchQuery OR
        description LIKE @searchQuery OR
        brand LIKE @searchQuery OR
        category LIKE @searchQuery
      ORDER BY 
        CASE 
          WHEN product_name LIKE @searchQuery THEN 1
          WHEN brand LIKE @searchQuery THEN 2
          WHEN category LIKE @searchQuery THEN 3
          ELSE 4
        END
    `

    const result = await connection
      .request()
      .input("searchQuery", sql.NVarChar, `%${query}%`)
      .input("limit", sql.Int, limit)
      .query(textQuery)

    console.log("✅ Text search completed, found", result.recordset.length, "products")
    return result.recordset
  } catch (error) {
    console.error("❌ Hybrid search error:", error)
    throw error
  }
}

// Tablo kontrolü
export async function checkVectorTable(): Promise<boolean> {
  try {
    const connection = await getConnection()
    
    const result = await connection.request().query(`
      SELECT COUNT(*) as count 
      FROM [dbo].[walmart_ecommerce_product_details] 
      WHERE embedding IS NOT NULL
    `)

    const count = result.recordset[0].count
    console.log("📊 Products with embeddings:", count)
    
    return count > 0
  } catch (error) {
    console.error("❌ Error checking vector table:", error)
    return false
  }
}

// Embedding güncelleme (gerekirse)
export async function updateProductEmbedding(productId: number, text: string): Promise<void> {
  try {
    console.log("🔄 Updating embedding for product:", productId)
    
    const embedding = await createEmbedding(text)
    
    const connection = await getConnection()
    
    await connection
      .request()
      .input("productId", sql.Int, productId)
      .input("embedding", sql.NVarChar, JSON.stringify(embedding))
      .query(`
        UPDATE [dbo].[walmart_ecommerce_product_details]
        SET embedding = @embedding
        WHERE id = @productId
      `)
    
    console.log("✅ Embedding updated for product:", productId)
  } catch (error) {
    console.error("❌ Error updating embedding:", error)
    throw error
  }
} 

// Gelişmiş arama fonksiyonu - çoklu kriter
export async function advancedSearch(params: {
  query: string
  categories?: string[]
  priceRange?: { min?: number; max?: number }
  brands?: string[]
  limit?: number
}): Promise<any[]> {
  try {
    console.log("🔍 Starting advanced search with params:", params)
    
    const { query, categories, priceRange, brands, limit = 5 } = params
    
    // Query embedding oluştur
    const queryEmbedding = await createEmbedding(query)
    
    // Veritabanı bağlantısı
    const connection = await getConnection()
    
    // SQL query oluştur
    let sqlQuery = `
      SELECT TOP (1500)
        id,
        product_name,
        description,
        list_price,
        sale_price,
        brand,
        category,
        product_url,
        embedding
      FROM [dbo].[walmart_ecommerce_product_details]
      WHERE embedding IS NOT NULL
    `
    
    const conditions = []
    
    // Kategori filtresi
    if (categories && categories.length > 0) {
      const categoryConditions = categories.map(cat => 
        `category LIKE '%${cat}%' OR product_name LIKE '%${cat}%'`
      ).join(' OR ')
      conditions.push(`(${categoryConditions})`)
    }
    
    // Fiyat filtresi
    if (priceRange) {
      if (priceRange.min !== undefined && priceRange.max !== undefined) {
        conditions.push(`(list_price >= ${priceRange.min} AND list_price <= ${priceRange.max})`)
      } else if (priceRange.min !== undefined) {
        conditions.push(`list_price >= ${priceRange.min}`)
      } else if (priceRange.max !== undefined) {
        conditions.push(`list_price <= ${priceRange.max}`)
      }
    }
    
    // Marka filtresi
    if (brands && brands.length > 0) {
      const brandConditions = brands.map(brand => 
        `brand LIKE '%${brand}%'`
      ).join(' OR ')
      conditions.push(`(${brandConditions})`)
    }
    
    // Koşulları birleştir
    if (conditions.length > 0) {
      sqlQuery += ` AND ${conditions.join(' AND ')}`
    }
    
    sqlQuery += ` ORDER BY NEWID()`
    
    const result = await connection.request().query(sqlQuery)
    const products = result.recordset
    
    // Vector similarity hesapla
    const scored = []
    for (const product of products) {
      let emb = product.embedding
      if (typeof emb === "string") {
        try {
          emb = JSON.parse(emb)
        } catch (e) {
          continue
        }
      }
      if (!Array.isArray(emb) || emb.length !== queryEmbedding.length) continue
      
      const score = cosineSimilarity(queryEmbedding, emb)
      scored.push({ ...product, similarity_score: score })
    }
    
    // Akıllı sıralama
    scored.sort((a, b) => {
      // Ana kriter: similarity score
      const scoreDiff = b.similarity_score - a.similarity_score
      if (Math.abs(scoreDiff) > 0.05) return scoreDiff
      
      // İkincil kriter: fiyat (varsa)
      if (priceRange && priceRange.max !== undefined) {
        const aPrice = a.list_price || a.sale_price || 0
        const bPrice = b.list_price || b.sale_price || 0
        const aDistance = Math.abs(aPrice - priceRange.max)
        const bDistance = Math.abs(bPrice - priceRange.max)
        if (Math.abs(aDistance - bDistance) > 10) {
          return aDistance - bDistance
        }
      }
      
      return scoreDiff
    })
    
    // Threshold filtreleme
    const thresholds = {
      excellent: 0.85,
      good: 0.75,
      acceptable: 0.65
    }
    
    const excellentResults = scored.filter(x => x.similarity_score >= thresholds.excellent)
    const goodResults = scored.filter(x => x.similarity_score >= thresholds.good)
    const acceptableResults = scored.filter(x => x.similarity_score >= thresholds.acceptable)
    
    let finalResults
    if (excellentResults.length > 0) {
      finalResults = excellentResults.slice(0, limit)
    } else if (goodResults.length > 0) {
      finalResults = goodResults.slice(0, limit)
    } else if (acceptableResults.length > 0) {
      finalResults = acceptableResults.slice(0, limit)
    } else {
      finalResults = []
    }
    
    console.log(`✅ Advanced search completed: ${finalResults.length} results`)
    return finalResults
    
  } catch (error) {
    console.error("❌ Advanced search error:", error)
    throw error
  }
}

// Kategori bazlı ürün listesi
export async function getProductsByCategory(category: string, limit = 10): Promise<any[]> {
  try {
    console.log(`📂 Getting products for category: ${category}`)
    
    const connection = await getConnection()
    
    const result = await connection.request()
      .input("category", sql.NVarChar, `%${category}%`)
      .input("limit", sql.Int, limit)
      .query(`
        SELECT TOP (@limit)
          id,
          product_name,
          description,
          list_price,
          sale_price,
          brand,
          category,
          product_url
        FROM [dbo].[walmart_ecommerce_product_details]
        WHERE category LIKE @category
        ORDER BY NEWID()
      `)
    
    console.log(`✅ Found ${result.recordset.length} products for category: ${category}`)
    return result.recordset
    
  } catch (error) {
    console.error("❌ Error getting products by category:", error)
    throw error
  }
}

// Fiyat aralığı bazlı ürün listesi
export async function getProductsByPriceRange(minPrice: number, maxPrice: number, limit = 10): Promise<any[]> {
  try {
    console.log(`💰 Getting products in price range: $${minPrice} - $${maxPrice}`)
    
    const connection = await getConnection()
    
    const result = await connection.request()
      .input("minPrice", sql.Decimal(10, 2), minPrice)
      .input("maxPrice", sql.Decimal(10, 2), maxPrice)
      .input("limit", sql.Int, limit)
      .query(`
        SELECT TOP (@limit)
          id,
          product_name,
          description,
          list_price,
          sale_price,
          brand,
          category,
          product_url
        FROM [dbo].[walmart_ecommerce_product_details]
        WHERE list_price >= @minPrice AND list_price <= @maxPrice
        ORDER BY list_price ASC
      `)
    
    console.log(`✅ Found ${result.recordset.length} products in price range`)
    return result.recordset
    
  } catch (error) {
    console.error("❌ Error getting products by price range:", error)
    throw error
  }
}

// Benzer ürün önerisi
export async function getSimilarProducts(productId: number, limit = 5): Promise<any[]> {
  try {
    console.log(`🔄 Getting similar products for product ID: ${productId}`)
    
    // Önce ürünün embedding'ini al
    const connection = await getConnection()
    
    const productResult = await connection.request()
      .input("productId", sql.Int, productId)
      .query(`
        SELECT embedding, category, brand
        FROM [dbo].[walmart_ecommerce_product_details]
        WHERE id = @productId AND embedding IS NOT NULL
      `)
    
    if (productResult.recordset.length === 0) {
      throw new Error("Product not found or no embedding available")
    }
    
    const product = productResult.recordset[0]
    let productEmbedding = product.embedding
    
    if (typeof productEmbedding === "string") {
      productEmbedding = JSON.parse(productEmbedding)
    }
    
    // Benzer ürünleri bul
    const similarResult = await connection.request()
      .input("productId", sql.Int, productId)
      .input("category", sql.NVarChar, product.category)
      .input("brand", sql.NVarChar, product.brand)
      .input("limit", sql.Int, limit * 3) // Daha fazla çek, sonra filtrele
      .query(`
        SELECT TOP (@limit)
          id,
          product_name,
          description,
          list_price,
          sale_price,
          brand,
          category,
          product_url,
          embedding
        FROM [dbo].[walmart_ecommerce_product_details]
        WHERE id != @productId 
          AND embedding IS NOT NULL
          AND (category = @category OR brand = @brand)
        ORDER BY NEWID()
      `)
    
    // Similarity hesapla
    const scored = []
    for (const similarProduct of similarResult.recordset) {
      let emb = similarProduct.embedding
      if (typeof emb === "string") {
        emb = JSON.parse(emb)
      }
      
      if (Array.isArray(emb) && emb.length === productEmbedding.length) {
        const score = cosineSimilarity(productEmbedding, emb)
        scored.push({ ...similarProduct, similarity_score: score })
      }
    }
    
    // En benzer ürünleri döndür
    scored.sort((a, b) => b.similarity_score - a.similarity_score)
    const finalResults = scored.slice(0, limit)
    
    console.log(`✅ Found ${finalResults.length} similar products`)
    return finalResults
    
  } catch (error) {
    console.error("❌ Error getting similar products:", error)
    throw error
  }
} 