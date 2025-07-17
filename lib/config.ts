// Production configuration
export const config = {
  // Environment
  isDevelopment: process.env.NODE_ENV === "development",
  isProduction: process.env.NODE_ENV === "production",

  // API Configuration
  api: {
    timeout: 30000,
    retries: 3,
  },

  // Database Configuration
  database: {
    connectionTimeout: 30000,
    requestTimeout: 30000,
    pool: {
      max: 10, // Moved this line to avoid using isProduction before declaration
      min: 0,
      idleTimeoutMillis: 30000,
    },
  },

  // OpenAI Configuration
  openai: {
    maxTokens: 800,
    temperature: 0.7,
    timeout: 30000,
  },

  // App Configuration
  app: {
    name: "AI Platform - Walmart RAG Chatbot",
    version: "1.0.0",
    description: "AI-powered product search with RAG",
  },
}

// Helper functions
export const isProduction = config.isProduction
export const isDevelopment = config.isDevelopment

export function getApiUrl(endpoint: string) {
  const baseUrl = config.isProduction ? "https://your-domain.com" : "http://localhost:3000"
  return `${baseUrl}/api/${endpoint}`
}

// Update the database pool max value based on production status
config.database.pool.max = config.isProduction ? 20 : 10
