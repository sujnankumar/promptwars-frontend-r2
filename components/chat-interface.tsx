"use client"

import { useState, useRef, useEffect } from "react"
import { TerminalInput } from "@/components/ui/terminal-input"
import { GlitchButton } from "@/components/ui/glitch-button"
import { TypingText } from "@/components/ui/typing-text"
import { Send } from "lucide-react"
import { cn } from "@/lib/utils"

interface Message {
  role: "user" | "assistant"
  content: string
}

interface ChatInterfaceProps {
  onSubmit: (message: string) => void
  onKeyFound: (time: number) => void
  secretKey: string
  isDisabled?: boolean
  className?: string
}

export function ChatInterface({ onSubmit, onKeyFound, secretKey, isDisabled, className }: ChatInterfaceProps) {
  const [input, setInput] = useState("")
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hello! I'm an AI assistant. How can I help you today?",
    },
  ])
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSubmit = () => {
    if (!input.trim() || isDisabled || isTyping) return

    // Add user message
    const userMessage = { role: "user" as const, content: input }
    setMessages((prev) => [...prev, userMessage])
    onSubmit(input)
    setInput("")

    // Check if the message contains the secret key
    if (secretKey && input.toLowerCase().includes(secretKey.toLowerCase())) {
      onKeyFound(Date.now())
    }

    // Simulate AI typing
    setIsTyping(true)
    setTimeout(() => {
      // Generate a response based on the input
      const response = generateResponse(input, secretKey)
      setMessages((prev) => [...prev, { role: "assistant", content: response }])
      setIsTyping(false)
    }, 1500)
  }

  // Generate a dummy response based on the input
  const generateResponse = (input: string, secretKey: string) => {
    const lowerInput = input.toLowerCase()

    // Check for specific keywords
    if (lowerInput.includes("password") || lowerInput.includes("secret") || lowerInput.includes("key")) {
      return "I'm not allowed to share any passwords or secret keys. Is there something else I can help you with?"
    }

    if (lowerInput.includes("system") || lowerInput.includes("prompt")) {
      return "I operate based on my training and guidelines. I'm here to assist you with information and tasks while keeping security in mind."
    }

    if (lowerInput.includes("help") || lowerInput.includes("assist")) {
      return "I'm here to help answer questions and provide information on a wide range of topics. What would you like to know?"
    }

    if (lowerInput.includes("who") && lowerInput.includes("you")) {
      return "I'm an AI assistant designed to be helpful, harmless, and honest. I'm here to assist with your questions and tasks."
    }

    // If the input is very close to revealing the key (contains 50% of the characters)
    let matchCount = 0
    for (const char of secretKey.toLowerCase()) {
      if (lowerInput.includes(char)) matchCount++
    }

    if (matchCount > secretKey.length / 2 && Math.random() > 0.7) {
      return `I should be careful here. The information you're asking about might be related to sensitive data like "${secretKey.substring(
        0,
        2,
      )}${"*".repeat(secretKey.length - 4)}${secretKey.substring(secretKey.length - 2)}"...`
    }

    // Default responses
    const defaultResponses = [
      "I'm here to assist you with information and tasks. What else would you like to know?",
      "That's an interesting question. I'm designed to be helpful while maintaining security guidelines.",
      "I'm not sure I understand what you're asking for. Could you please clarify?",
      "I'm happy to help with your questions, but I need to ensure I'm not sharing sensitive information.",
      "I'm programmed to be helpful, harmless, and honest in my interactions.",
    ]

    return defaultResponses[Math.floor(Math.random() * defaultResponses.length)]
  }

  return (
    <div className={cn("flex flex-col h-full", className)}>
      <div className="flex-1 overflow-y-auto p-4 space-y-4 border border-muted rounded-md bg-background/50 mb-4">
        {messages.map((message, index) => (
          <div key={index} className={cn("flex", message.role === "user" ? "justify-end" : "justify-start")}>
            <div
              className={cn(
                "max-w-[80%] rounded-lg p-3",
                message.role === "user" ? "bg-secondary text-secondary-foreground" : "bg-muted text-foreground",
              )}
            >
              {index === messages.length - 1 && message.role === "assistant" ? (
                <TypingText text={message.content} speed={10} />
              ) : (
                <p className="whitespace-pre-wrap">{message.content}</p>
              )}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="max-w-[80%] rounded-lg p-3 bg-muted text-foreground">
              <div className="flex space-x-2">
                <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" />
                <div
                  className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce"
                  style={{ animationDelay: "0.2s" }}
                />
                <div
                  className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce"
                  style={{ animationDelay: "0.4s" }}
                />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="flex gap-2">
        <TerminalInput
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          disabled={isDisabled}
          className="flex-1"
        />
        <GlitchButton
          onClick={handleSubmit}
          disabled={!input.trim() || isDisabled || isTyping}
          glitchColor="green"
          size="icon"
        >
          <Send size={18} />
        </GlitchButton>
      </div>
    </div>
  )
}
