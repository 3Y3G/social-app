import Header from "../components/Header"
import LeftSidebar from "../components/LeftSidebar"
import MessageList from "../components/MessageList"
import MessageChat from "../components/MessageChat"

export default function MessagesPage() {
  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <main className="container mx-auto flex gap-4 px-4 py-4">
        <LeftSidebar />
        <div className="flex flex-1 gap-4">
          <MessageList />
          <MessageChat />
        </div>
      </main>
    </div>
  )
}

