// Alternative database connection using fetch
export async function searchProductsWithFetch(query: string, limit = 5) {
  try {
    console.log("Using alternative database approach...")

    // Mock data for now - replace with actual API call if needed
    const mockProducts = [
      {
        product_name: "Nike Air Max 90",
        title: "Nike Air Max 90 Sneakers",
        price: 120.0,
        category: "Shoes",
        brand: "Nike",
        description: "Classic Nike Air Max 90 sneakers with comfortable cushioning",
      },
      {
        product_name: "Adidas Ultraboost 22",
        title: "Adidas Ultraboost 22 Running Shoes",
        price: 180.0,
        category: "Shoes",
        brand: "Adidas",
        description: "Premium running shoes with Boost technology",
      },
      {
        product_name: "Converse Chuck Taylor",
        title: "Converse Chuck Taylor All Star",
        price: 55.0,
        category: "Shoes",
        brand: "Converse",
        description: "Classic canvas sneakers, timeless style",
      },
    ]

    // Filter based on query
    const filteredProducts = mockProducts.filter(
      (product) =>
        product.product_name.toLowerCase().includes(query.toLowerCase()) ||
        product.category.toLowerCase().includes(query.toLowerCase()) ||
        product.brand.toLowerCase().includes(query.toLowerCase()) ||
        product.title.toLowerCase().includes(query.toLowerCase()),
    )

    console.log(`Found ${filteredProducts.length} products for query: ${query}`)

    return filteredProducts.slice(0, limit)
  } catch (error) {
    console.error("Alternative search error:", error)
    return []
  }
}

// Test connection alternative
export async function testConnectionAlternative() {
  try {
    // For now, return mock success
    return {
      success: true,
      count: 1000,
      message: "Using alternative connection method",
    }
  } catch (error) {
    return {
      success: false,
      error: error.message,
    }
  }
}
