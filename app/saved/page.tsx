import Header from "../components/Header"
import LeftSidebar from "../components/LeftSidebar"
import SavedItems from "../components/SavedItems"

export default function SavedPage() {
  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <main className="container mx-auto flex gap-4 px-4 py-4">
        <LeftSidebar />
        <SavedItems />
      </main>
    </div>
  )
}

