import { Suspense } from "react"
import Header from "../components/Header"
import LeftSidebar from "../components/LeftSidebar"
import MessagingInterface from "./components/MessagingInterface"

export default function MessagesPage() {
  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <main className="container mx-auto flex gap-4 px-4 py-4">
        <LeftSidebar />
        <Suspense fallback={<div>Loading messages...</div>}>
          <MessagingInterface />
        </Suspense>
      </main>
    </div>
  )
}

