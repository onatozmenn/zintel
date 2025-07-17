"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
  MessageCircle,
  Send,
  Bot,
  User,
  ShoppingCart,
  Sparkles,
  Zap,
  Search,
  Star,
  TrendingUp,
  Brain,
  Cpu,
} from "lucide-react"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
}

type ChatMode = "general" | "products"

// ZintelAI Logo Component
const ZintelAILogo = ({ size = "large" }: { size?: "small" | "large" }) => {
  const logoSize = size === "large" ? "w-16 h-16" : "w-8 h-8"
  const textSize = size === "large" ? "text-4xl" : "text-xl"

  return (
    <div className="flex items-center gap-3">
      <div className={`relative ${logoSize}`}>
        {/* Outer glow ring */}
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-500 rounded-full blur-md opacity-60 animate-pulse"></div>

        {/* Main logo circle */}
        <div className="relative w-full h-full bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-600 rounded-full flex items-center justify-center shadow-2xl">
          {/* Inner circuit pattern */}
          <div className="absolute inset-2 border border-white/20 rounded-full"></div>
          <div className="absolute inset-3 border border-white/10 rounded-full"></div>

          {/* Z letter with AI brain effect */}
          <div className="relative flex items-center justify-center">
            <span className="text-white font-bold text-2xl">Z</span>
            <div className="absolute -top-1 -right-1">
              <Brain className="w-3 h-3 text-cyan-300 animate-pulse" />
            </div>
          </div>
        </div>

        {/* Floating particles */}
        <div className="absolute -top-1 -left-1 w-2 h-2 bg-purple-400 rounded-full animate-bounce delay-100"></div>
        <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-cyan-400 rounded-full animate-bounce delay-300"></div>
      </div>

      <div className="flex flex-col">
        <h1
          className={`font-bold bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent ${textSize}`}
        >
          ZintelAI
        </h1>
        {size === "large" && <p className="text-gray-400 text-sm -mt-1 italic">everything you searched</p>}
      </div>
    </div>
  )
}

export default function AIChat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [chatMode, setChatMode] = useState<ChatMode>("products")
  const [isTyping, setIsTyping] = useState(false)

  // Typing animation effect
  useEffect(() => {
    if (isLoading) {
      setIsTyping(true)
      const timer = setTimeout(() => setIsTyping(false), 2000)
      return () => clearTimeout(timer)
    }
  }, [isLoading])

  const sendMessage = async () => {
    if (!input.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    try {
      const apiEndpoint = chatMode === "general" ? "/api/chat/general" : "/api/chat/products"

      const response = await fetch(apiEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((msg) => ({
            role: msg.role,
            content: msg.content,
          })),
        }),
      })

      if (response.ok) {
        const text = await response.text()
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: text,
        }
        setMessages((prev) => [...prev, assistantMessage])
      } else {
        const errorData = await response.json()
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: `Üzgünüm, bir hata oluştu: ${errorData.error}`,
        }
        setMessages((prev) => [...prev, errorMessage])
      }
    } catch (error) {
      console.error("Send message error:", error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Üzgünüm, bağlantı hatası oluştu. Lütfen tekrar deneyin.",
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const clearMessages = () => {
    setMessages([])
  }

  const switchMode = (mode: ChatMode) => {
    setChatMode(mode)
    clearMessages()
  }

  const popularQueries = [
    "Yapay zeka nedir?",
    "Python öğrenmek istiyorum",
    "En iyi programlama dilleri",
    "Teknoloji trendleri",
  ]

  const productQueries = [
    "gaming laptop for students",
    "wireless headphones with noise cancellation",
    "kitchen appliances for small apartment",
    "sports shoes for running",
    "smartphone with good camera",
    "home office desk setup",
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white">
      {/* Animated background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      <div className="relative z-10 container mx-auto max-w-6xl p-4 h-screen flex flex-col">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center mb-6">
            <ZintelAILogo size="large" />
          </div>

          <div className="flex items-center justify-center gap-2 mb-4">
            <Cpu className="w-5 h-5 text-purple-400 animate-pulse" />
            <span className="text-gray-400 text-lg">
              {chatMode === "general" ? "Akıllı AI Asistanınız" : "Vector Search & Semantic Arama"}
            </span>
            <Zap className="w-5 h-5 text-cyan-400 animate-pulse delay-300" />
          </div>

          <div className="flex items-center justify-center gap-2">
            <Star className="w-4 h-4 text-yellow-400" />
            <span className="text-sm text-gray-500">Powered by Azure OpenAI & Advanced AI Technology</span>
            <Star className="w-4 h-4 text-yellow-400" />
          </div>
        </div>

        {/* Mode Selector */}
        <div className="flex gap-4 mb-8 justify-center">
          <Button
            variant={chatMode === "general" ? "default" : "outline"}
            onClick={() => switchMode("general")}
            className={`flex items-center gap-3 px-6 py-3 rounded-full transition-all duration-300 ${
              chatMode === "general"
                ? "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg shadow-purple-500/25"
                : "border-gray-600 hover:border-purple-400 hover:bg-purple-500/10"
            }`}
          >
            <MessageCircle className="w-5 h-5" />
            <span className="font-medium">Genel Sohbet</span>
          </Button>
          <Button
            variant={chatMode === "products" ? "default" : "outline"}
            onClick={() => switchMode("products")}
            className={`flex items-center gap-3 px-6 py-3 rounded-full transition-all duration-300 ${
              chatMode === "products"
                ? "bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 shadow-lg shadow-blue-500/25"
                : "border-gray-600 hover:border-blue-400 hover:bg-blue-500/10"
            }`}
          >
            <ShoppingCart className="w-5 h-5" />
            <span className="font-medium">Vector Search</span>
            <Brain className="w-4 h-4" />
          </Button>
        </div>

        {/* Chat Area */}
        <Card className="flex-1 flex flex-col shadow-2xl border-gray-800 bg-gray-900/50 backdrop-blur-xl">
          <CardContent className="flex-1 flex flex-col p-0">
            {/* Messages */}
            <ScrollArea className="flex-1 p-6">
              {messages.length === 0 ? (
                <div className="text-center text-gray-400 mt-20">
                  <div className="relative w-24 h-24 mx-auto mb-6">
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-500 rounded-full animate-spin-slow opacity-20"></div>
                    <div className="absolute inset-2 bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 rounded-full flex items-center justify-center">
                      {chatMode === "general" ? (
                        <div className="relative">
                          <Bot className="w-8 h-8 text-white" />
                          <Brain className="w-4 h-4 text-cyan-300 absolute -top-1 -right-1 animate-pulse" />
                        </div>
                      ) : (
                        <div className="relative">
                          <ShoppingCart className="w-8 h-8 text-white" />
                          <Sparkles className="w-4 h-4 text-purple-300 absolute -top-1 -right-1 animate-pulse" />
                        </div>
                      )}
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold mb-4 bg-gradient-to-r from-gray-200 to-gray-400 bg-clip-text text-transparent">
                    {chatMode === "general" ? "ZintelAI Asistanınız Hazır" : "🧠 Vector Search Hazır"}
                  </h3>
                  <p className="text-gray-500 mb-8 max-w-md mx-auto leading-relaxed">
                    {chatMode === "general"
                      ? "Herhangi bir konuda soru sorabilir, bilgi alabilir ve ZintelAI ile sohbet edebilirsiniz."
                      : "Embedding tabanlı vector similarity search ile semantic anlam yakınlığına göre ürün arayabilirsiniz."}
                  </p>

                  <div className="space-y-4">
                    <div className="text-sm text-gray-600 mb-4">💡 Popüler Aramalar:</div>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {(chatMode === "general" ? popularQueries : productQueries).map((query, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          size="sm"
                          onClick={() => setInput(query)}
                          className="border-gray-700 hover:border-purple-400 hover:bg-purple-500/10 text-gray-300 hover:text-white transition-all duration-300"
                        >
                          <Search className="w-3 h-3 mr-2" />
                          {query}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="mt-8 flex items-center justify-center gap-4 text-xs text-gray-600">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span>ZintelAI Aktif</span>
                    </div>
                    <div className="w-1 h-1 bg-gray-600 rounded-full"></div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse delay-300"></div>
                      <span>AI Hazır</span>
                    </div>
                    <div className="w-1 h-1 bg-gray-600 rounded-full"></div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse delay-700"></div>
                      <span>Sistem Aktif</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {messages.map((message, index) => (
                    <div
                      key={message.id}
                      className={`flex gap-4 ${message.role === "user" ? "justify-end" : "justify-start"} animate-fade-in`}
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <div
                        className={`flex gap-4 max-w-[85%] ${
                          message.role === "user" ? "flex-row-reverse" : "flex-row"
                        }`}
                      >
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg ${
                            message.role === "user"
                              ? "bg-gradient-to-r from-blue-500 to-cyan-600"
                              : "bg-gradient-to-r from-purple-500 to-pink-600"
                          }`}
                        >
                          {message.role === "user" ? (
                            <User className="w-5 h-5 text-white" />
                          ) : (
                            <div className="relative">
                              <Bot className="w-5 h-5 text-white" />
                              <div className="absolute -top-1 -right-1 w-2 h-2 bg-cyan-300 rounded-full animate-pulse"></div>
                            </div>
                          )}
                        </div>
                        <div
                          className={`rounded-2xl px-6 py-4 shadow-lg backdrop-blur-sm max-h-96 overflow-y-auto ${
                            message.role === "user"
                              ? "bg-gradient-to-r from-blue-600/90 to-cyan-600/90 text-white"
                              : "bg-gray-800/90 text-gray-100 border border-gray-700"
                          }`}
                        >
                          <div 
                            className="text-sm leading-relaxed"
                            dangerouslySetInnerHTML={{ __html: message.content }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex gap-4 justify-start animate-fade-in">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-600 flex items-center justify-center shadow-lg">
                        <div className="relative">
                          <Bot className="w-5 h-5 text-white" />
                          <Brain className="w-3 h-3 text-cyan-300 absolute -top-1 -right-1 animate-pulse" />
                        </div>
                      </div>
                      <div className="bg-gray-800/90 border border-gray-700 rounded-2xl px-6 py-4 backdrop-blur-sm">
                        <div className="flex space-x-2">
                          <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
                          <div
                            className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"
                            style={{ animationDelay: "0.1s" }}
                          ></div>
                          <div
                            className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce"
                            style={{ animationDelay: "0.2s" }}
                          ></div>
                        </div>
                        <div className="text-xs text-gray-400 mt-2">
                          ZintelAI {chatMode === "products" ? "ürünleri arıyor..." : "düşünüyor..."}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </ScrollArea>

            <Separator className="bg-gray-800" />

            {/* Input Area */}
            <div className="p-6 bg-gray-900/50">
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={
                      chatMode === "general"
                        ? "ZintelAI ile sohbet edin..."
                        : "Vector search için semantic sorgu yazın (örn: gaming laptop, wireless headphones)..."
                    }
                    className="w-full rounded-full border-gray-700 bg-gray-800/50 text-white placeholder-gray-400 focus:border-purple-500 focus:ring-purple-500/20 pr-12 py-3 backdrop-blur-sm"
                    disabled={isLoading}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault()
                        sendMessage()
                      }
                    }}
                  />
                  {input && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    </div>
                  )}
                </div>
                <Button
                  onClick={sendMessage}
                  size="icon"
                  className="rounded-full bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 shadow-lg shadow-purple-500/25 transition-all duration-300 w-12 h-12"
                  disabled={isLoading || !input.trim()}
                >
                  <Send className="w-5 h-5" />
                </Button>
                {messages.length > 0 && (
                  <Button
                    onClick={clearMessages}
                    variant="outline"
                    size="icon"
                    className="rounded-full border-gray-700 hover:border-red-400 hover:bg-red-500/10 w-12 h-12 transition-all duration-300 bg-transparent"
                  >
                    <span className="text-lg">🗑️</span>
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-4 text-center text-xs text-gray-600">
          <div className="flex items-center justify-center gap-2 mb-2">
            <ZintelAILogo size="small" />
          </div>
          <div className="flex items-center justify-center gap-2">
            <span>Powered by</span>
            <span className="text-purple-400 font-medium">Azure OpenAI</span>
            <span>•</span>
            <span className="text-blue-400 font-medium">Advanced AI</span>
            <span>•</span>
            <span className="text-cyan-400 font-medium">Next.js</span>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes spin-slow {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-out forwards;
        }
        .animate-spin-slow {
          animation: spin-slow 8s linear infinite;
        }
      `}</style>
    </div>
  )
}
