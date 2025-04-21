"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { io, type Socket } from "socket.io-client"
import { useSession } from "next-auth/react"

export function useSocket() {
  const { data: session } = useSession()
  const [isConnected, setIsConnected] = useState(false)
  const socketRef = useRef<Socket | null>(null)
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null)

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

      // Set last sync time for reconnection status sync
      setLastSyncTime(new Date().toISOString())
    })

    socket.on("disconnect", () => {
      console.log("Socket disconnected")
      setIsConnected(false)
    })

    socket.on("error", (error) => {
      console.error("Socket error:", error)
    })

    socket.on("reconnect", () => {
      console.log("Socket reconnected")
      // When reconnected, sync message statuses
      if (lastSyncTime) {
        // We'll sync for each active conversation when they're joined
      }
    })

    return () => {
      socket.disconnect()
    }
  }, [session])

  const joinConversation = useCallback(
    (conversationId: string) => {
      if (socketRef.current && isConnected) {
        socketRef.current.emit("join-conversation", conversationId)

        // Sync message statuses when joining a conversation after reconnect
        if (lastSyncTime) {
          socketRef.current.emit("sync-message-status", {
            conversationId,
            lastSyncTime,
          })
        }
      }
    },
    [isConnected, lastSyncTime],
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

  const syncMessageStatus = useCallback(
    (data: {
      conversationId: string
      lastSyncTime: string
    }) => {
      if (socketRef.current && isConnected) {
        socketRef.current.emit("sync-message-status", data)
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
    syncMessageStatus,
    subscribeToEvent,
    socket: socketRef.current,
    lastSyncTime,
  }
}
