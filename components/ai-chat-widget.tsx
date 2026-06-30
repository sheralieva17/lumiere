"use client"

import { useState, useRef, useEffect } from "react"
import { MessageCircle, X, Send, Bot, User } from "lucide-react"
import { cn } from "@/lib/utils"

type ChatMessage = {
  id: string
  role: "user" | "assistant"
  text: string
}

export function AiChatWidget() {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState("")
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, isLoading])

  async function askAssistant(text: string) {
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      text,
    }
    const nextMessages = [...messages, userMessage]
    setMessages(nextMessages)
    setIsLoading(true)
    setError("")

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || "Не удалось отправить сообщение")
      }

      const answer = String(data.text || "").trim()
      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        text: answer || "Извините, я не смог подготовить ответ.",
      }
      setMessages((prev) => [...prev, assistantMessage])
    } catch (e) {
      const message = e instanceof Error ? e.message : "Не удалось отправить сообщение"
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const text = input.trim()
    if (!text || isLoading) return
    setInput("")
    void askAssistant(text)
  }

  return (
    <>
      <button
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          "fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-all duration-300 hover:scale-105",
          "bg-foreground text-background",
          open && "rotate-0"
        )}
        aria-label={open ? "Закрыть чат" : "Открыть чат"}
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>

      <div
        className={cn(
          "fixed bottom-24 right-6 z-50 flex w-[360px] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl transition-all duration-300",
          open
            ? "pointer-events-auto scale-100 opacity-100"
            : "pointer-events-none scale-95 opacity-0"
        )}
        style={{ height: "520px" }}
      >
        <div className="flex items-center gap-3 border-b border-border bg-foreground px-5 py-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-background/20">
            <Bot className="h-5 w-5 text-background" />
          </div>
          <div>
            <p className="text-sm font-medium text-background">Помощник LUMIERE</p>
            <p className="text-xs text-background/60">Консультант по товарам и уходу</p>
          </div>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center gap-3 px-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary">
                <Bot className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-foreground font-serif">
                Добро пожаловать в LUMIERE
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Спросите меня об уходе за кожей, подборе товаров или любой теме, связанной с красотой.
              </p>
              <div className="flex flex-wrap gap-2 mt-2 justify-center">
                {["Есть сыворотка для сияния?", "Посоветуй уход за кожей", "Что подойдет для сухой кожи?"].map(
                  (suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => {
                        if (!isLoading) void askAssistant(suggestion)
                      }}
                      className="rounded-full border border-border bg-secondary px-3 py-1.5 text-xs text-foreground transition-colors hover:bg-muted"
                    >
                      {suggestion}
                    </button>
                  )
                )}
              </div>
            </div>
          )}

          {messages.map((message) => {
            const isUser = message.role === "user"
            return (
              <div
                key={message.id}
                className={cn("flex gap-2.5", isUser ? "justify-end" : "justify-start")}
              >
                {!isUser && (
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-secondary mt-0.5">
                    <Bot className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                )}
                <div
                  className={cn(
                    "max-w-[75%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
                    isUser
                      ? "bg-foreground text-background rounded-br-md"
                      : "bg-secondary text-foreground rounded-bl-md"
                  )}
                >
                  {message.text}
                </div>
                {isUser && (
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-foreground mt-0.5">
                    <User className="h-3.5 w-3.5 text-background" />
                  </div>
                )}
              </div>
            )
          })}

          {isLoading && (
            <div className="flex gap-2.5 justify-start">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-secondary mt-0.5">
                <Bot className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
              <div className="bg-secondary rounded-2xl rounded-bl-md px-3.5 py-2.5">
                <div className="flex gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:0ms]" />
                  <span className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:150ms]" />
                  <span className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:300ms]" />
                </div>
              </div>
            </div>
          )}

          {error && (
            <p className="text-xs text-destructive bg-destructive/10 rounded-md px-3 py-2">
              {error}
            </p>
          )}
        </div>

        <div className="border-t border-border bg-card px-4 py-3">
          <form onSubmit={handleSubmit} className="flex items-center gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Спросите о товарах и уходе..."
              className="flex-1 bg-secondary rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-ring"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors",
                input.trim()
                  ? "bg-foreground text-background hover:bg-foreground/90"
                  : "bg-secondary text-muted-foreground"
              )}
              aria-label="Отправить сообщение"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    </>
  )
}
