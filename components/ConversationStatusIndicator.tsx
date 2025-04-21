import { Check, CheckCheck } from "lucide-react"

type ConversationStatusIndicatorProps = {
  status?: string
  senderId: string
  currentUserId?: string
  className?: string
}

export function ConversationStatusIndicator({
  status,
  senderId,
  currentUserId,
  className = "",
}: ConversationStatusIndicatorProps) {
  // Only show status for messages sent by the current user
  if (senderId !== currentUserId) return null

  // Determine which icon to show based on status
  switch (status) {
    case "READ":
      return <CheckCheck className={`h-3 w-3 text-blue-500 ${className}`} />
    case "DELIVERED":
      return <CheckCheck className={`h-3 w-3 text-gray-500 ${className}`} />
    case "SENT":
      return <Check className={`h-3 w-3 text-gray-500 ${className}`} />
    default:
      return null
  }
}
