import type React from "react"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

interface FormErrorProps {
  message?: string
}

const FormError: React.FC<FormErrorProps> = ({ message }) => {
  if (!message) {
    return null
  }

  return (
    <Alert variant="destructive" className="mt-4">
      <AlertCircle className="h-4 w-4" />
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  )
}

export { FormError }
