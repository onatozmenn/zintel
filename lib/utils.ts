import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Markdown'ı HTML'e çeviren fonksiyon
export function markdownToHtml(markdown: string): string {
  if (!markdown) return ""
  
  let html = markdown
  
  // **bold** -> <strong>bold</strong>
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
  
  // *italic* -> <em>italic</em>
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>')
  
  // # Heading -> <h1>Heading</h1>
  html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>')
  html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>')
  html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>')
  
  // Listeleri düzgün formatla
  html = html.replace(/^- (.*$)/gim, '<li>$1</li>')
  // Liste öğelerini <ul> ile sar
  html = html.replace(/(<li>.*<\/li>)/g, '<ul>$1</ul>')
  
  // Line breaks - daha akıllı
  html = html.replace(/\n\n/g, '</p><p>') // Çift satır sonu = yeni paragraf
  html = html.replace(/\n/g, '<br>') // Tek satır sonu = line break
  html = html.replace(/<p><\/p>/g, '') // Boş paragrafları temizle
  html = html.replace(/^/, '<p>') // Başlangıç paragrafı
  html = html.replace(/$/, '</p>') // Bitiş paragrafı
  
  // Emojileri koru
  html = html.replace(/🧠/g, '🧠')
  html = html.replace(/🔍/g, '🔍')
  html = html.replace(/✅/g, '✅')
  html = html.replace(/💰/g, '💰')
  html = html.replace(/🏷️/g, '🏷️')
  html = html.replace(/📂/g, '📂')
  html = html.replace(/🔗/g, '🔗')
  html = html.replace(/📊/g, '📊')
  html = html.replace(/🎯/g, '🎯')
  html = html.replace(/💡/g, '💡')
  html = html.replace(/⚠️/g, '⚠️')
  html = html.replace(/🔧/g, '🔧')
  html = html.replace(/📁/g, '📁')
  html = html.replace(/⚡/g, '⚡')
  html = html.replace(/💾/g, '💾')
  html = html.replace(/📦/g, '📦')
  
  return html
}

// HTML'i güvenli hale getiren fonksiyon
export function sanitizeHtml(html: string): string {
  // Sadece güvenli HTML tag'lerini kabul et
  const allowedTags = ['strong', 'em', 'h1', 'h2', 'h3', 'li', 'ul', 'br', 'p', 'div', 'span']
  const allowedAttributes = ['class', 'style']
  
  // Basit sanitization
  let sanitized = html
  
  // Sadece izin verilen tag'leri kabul et
  const tagRegex = /<(\/?)([a-zA-Z0-9]+)([^>]*)>/g
  sanitized = sanitized.replace(tagRegex, (match, slash, tagName, attributes) => {
    if (allowedTags.includes(tagName.toLowerCase())) {
      return match
    }
    return ''
  })
  
  return sanitized
}
