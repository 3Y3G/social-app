import { Suspense } from "react"
import MessagingInterface from "./components/MessagingInterface"

export default function MessagesPage() {
  return (
    <div className="max-h-screen bg-gray-100">
      <main className="container mx-auto px-0 sm:px-4">
        <Suspense fallback={<div className="flex justify-center py-8">Loading messages...</div>}>
          <MessagingInterface />
        </Suspense>
      </main>
    </div>
  )
}
