import type React from "react"

import { CheckCircle } from "lucide-react"

import { Alert, AlertDescription } from "@/components/ui/alert"

interface FormSuccessProps {
  message?: string
}

const FormSuccess: React.FC<FormSuccessProps> = ({ message }) => {
  if (!message) {
    return null
  }

  return (
    <Alert variant="default" className="mt-4">
      <CheckCircle className="h-4 w-4" />
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  )
}

export { FormSuccess }
