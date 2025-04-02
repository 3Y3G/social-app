"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { io, type Socket } from "socket.io-client"
import { useSession } from "next-auth/react"

export function useSocket() {
  const { data: session } = useSession()
  const [isConnected, setIsConnected] = useState(false)
  const socketRef = useRef<Socket | null>(null)

  useEffect(() => {
    if (!session?.user) return

    // Initialize socket connection
    const socket = io({
      path: "/api/socket",
      autoConnect: true,
      withCredentials: true,
    })

    socketRef.current = socket

    socket.on("connect", () => {
      console.log("Socket connected")
      setIsConnected(true)
    })

    socket.on("disconnect", () => {
      console.log("Socket disconnected")
      setIsConnected(false)
    })

    socket.on("error", (error) => {
      console.error("Socket error:", error)
    })

    return () => {
      socket.disconnect()
    }
  }, [session])

  const joinConversation = useCallback(
    (conversationId: string) => {
      if (socketRef.current && isConnected) {
        socketRef.current.emit("join-conversation", conversationId)
      }
    },
    [isConnected],
  )

  const sendMessage = useCallback(
    (data: {
      conversationId: string
      content: string
      mediaUrl?: string
      mediaType?: string
    }) => {
      if (socketRef.current && isConnected) {
        socketRef.current.emit("send-message", data)
      }
    },
    [isConnected],
  )

  const sendTypingStatus = useCallback(
    (data: {
      conversationId: string
      isTyping: boolean
    }) => {
      if (socketRef.current && isConnected) {
        socketRef.current.emit("typing", data)
      }
    },
    [isConnected],
  )

  const markMessageAsRead = useCallback(
    (data: {
      messageId: string
      conversationId: string
    }) => {
      if (socketRef.current && isConnected) {
        socketRef.current.emit("mark-read", data)
      }
    },
    [isConnected],
  )

  const subscribeToEvent = useCallback((event: string, callback: (...args: any[]) => void) => {
    if (socketRef.current) {
      socketRef.current.on(event, callback)
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.off(event, callback)
      }
    }
  }, [])

  return {
    isConnected,
    joinConversation,
    sendMessage,
    sendTypingStatus,
    markMessageAsRead,
    subscribeToEvent,
    socket: socketRef.current,
  }
}

