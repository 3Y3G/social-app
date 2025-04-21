import { Check, CheckCheck, Clock } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

type MessageStatusProps = {
  status: string
  readBy?: Array<{ id: string; name: string | null }>
  className?: string
}

export function MessageStatus({ status, readBy = [], className = "" }: MessageStatusProps) {
  // Determine which icon to show based on status
  const getStatusIcon = () => {
    switch (status) {
      case "READ":
        return <CheckCheck className={`h-4 w-4 text-blue-500 ${className}`} />
      case "DELIVERED":
        return <CheckCheck className={`h-4 w-4 ${className}`} />
      case "SENT":
        return <Check className={`h-4 w-4 ${className}`} />
      case "PENDING":
      default:
        return <Clock className={`h-4 w-4 ${className}`} />
    }
  }

  // Generate tooltip content based on status
  const getTooltipContent = () => {
    switch (status) {
      case "READ":
        if (readBy.length > 0) {
          return (
            <div className="text-xs">
              <p className="font-semibold">Read by:</p>
              <ul>
                {readBy.map((user) => (
                  <li key={user.id}>{user.name || "Unknown user"}</li>
                ))}
              </ul>
            </div>
          )
        }
        return "Read"
      case "DELIVERED":
        return "Delivered"
      case "SENT":
        return "Sent"
      case "PENDING":
      default:
        return "Sending..."
    }
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div>{getStatusIcon()}</div>
        </TooltipTrigger>
        <TooltipContent>{getTooltipContent()}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
