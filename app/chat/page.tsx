"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { marked } from "marked"
import hljs from "highlight.js"
import "highlight.js/styles/github-dark.css"
import { saveAs } from "file-saver"

marked.setOptions({
  highlight: (code, lang) => hljs.highlight(code, { language: lang }).value,
  pedantic: false,
  gfm: true,
  breaks: true,
  sanitize: false,
  smartLists: true,
  smartypants: false,
  xhtml: false,
})

const extractFilename = (url: string): string | null => {
  try {
    const parsedUrl = new URL(url)
    const pathname = parsedUrl.pathname
    const filename = pathname.substring(pathname.lastIndexOf("/") + 1)
    return filename || null
  } catch (error) {
    console.error("Error parsing URL:", error)
    return null
  }
}

// פונקציה לחילוץ URL מהערה <!-- saved from url=(0071)https://... -->
const extractSavedFromUrlPlain = (html: string): string | null => {
  const marker = "saved from url=("
  const startIdx = html.indexOf(marker)
  if (startIdx === -1) return null

  // התחלה אחרי הסוגריים
  const afterMarker = html.substring(startIdx + marker.length)
  const closingParenIdx = afterMarker.indexOf(")")
  if (closingParenIdx === -1) return null

  const urlStartIdx = closingParenIdx + 1
  const urlCandidate = afterMarker.substring(urlStartIdx).trim()

  // עצירת URL בקצה סביר כמו תו רווח, סוגר או סוף שורה
  const stopChars = [" ", ">", "\n", "\r"]
  let endIdx = urlCandidate.length
  for (const ch of stopChars) {
    const i = urlCandidate.indexOf(ch)
    if (i !== -1 && i < endIdx) endIdx = i
  }

  const finalUrl = urlCandidate.substring(0, endIdx)
  return finalUrl.startsWith("http") ? finalUrl : null
}

const ChatPage = () => {
  const [markdown, setMarkdown] = useState<string>("")
  const [htmlContent, setHtmlContent] = useState<string>("")
  const [originalUrl, setOriginalUrl] = useState<string | null>(null)
  const [filename, setFilename] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (htmlContent) {
      let tempUrl: string | null = null

      // נחפש רק ב-1000 התווים הראשונים (ההערה תמיד בתחילת הקובץ)
      const searchContent = htmlContent.substring(0, 1000)
      console.log("🔍 מחפש ב-1000 התווים הראשונים")

      // חילוץ URL פשוט ללא regex
      console.log("🔧 מתחיל חילוץ URL פשוט...")
      tempUrl = extractSavedFromUrlPlain(searchContent)

      if (tempUrl) {
        console.log("✅ נמצא URL מקורי:", tempUrl)
        setOriginalUrl(tempUrl)
      } else {
        console.log("❌ לא נמצא URL בקובץ")
        setOriginalUrl(null)
      }

      if (tempUrl) {
        const extractedFilename = extractFilename(tempUrl)
        setFilename(extractedFilename)
      } else {
        setFilename(null)
      }
    } else {
      setOriginalUrl(null)
      setFilename(null)
    }
  }, [htmlContent])

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const content = e.target?.result as string
        setHtmlContent(content)
        setMarkdown(content)
      }
      reader.readAsText(file)
    }
  }

  const handleMarkdownChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMarkdown(event.target.value)
    setHtmlContent(event.target.value)
  }

  const downloadMarkdown = () => {
    if (markdown) {
      const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" })
      saveAs(blob, filename || "download.md")
    }
  }

  return (
    <div className="flex flex-col h-screen">
      <header className="bg-gray-800 text-white p-4">
        <h1 className="text-2xl font-semibold">Markdown Editor</h1>
      </header>

      <main className="flex flex-grow">
        <section className="w-1/2 p-4">
          <div className="mb-4">
            <label
              htmlFor="file-upload"
              className="cursor-pointer bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
              Upload HTML File
            </label>
            <input id="file-upload" type="file" accept=".html, .txt" className="hidden" onChange={handleFileChange} />
            {filename && <span className="ml-2">Selected file: {filename}</span>}
          </div>
          <textarea
            ref={textareaRef}
            className="w-full h-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={markdown}
            onChange={handleMarkdownChange}
            placeholder="Enter your markdown here..."
          />
        </section>

        <section className="w-1/2 p-4 bg-gray-100 overflow-auto">
          <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: marked(markdown) }} />
        </section>
      </main>

      <footer className="bg-gray-800 text-white p-4">
        <div className="container mx-auto flex justify-between items-center">
          <p>&copy; 2023 Markdown Editor</p>
          <button
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            onClick={downloadMarkdown}
          >
            Download Markdown
          </button>
        </div>
      </footer>
    </div>
  )
}

export default ChatPage
