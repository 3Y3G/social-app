import Header from "../components/Header"
import LeftSidebar from "../components/LeftSidebar"
import FriendsList from "../components/FriendsList"

export default function FriendsPage() {
  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <main className="container mx-auto flex gap-4 px-4 py-4">
        <LeftSidebar />
        <FriendsList />
      </main>
    </div>
  )
}

