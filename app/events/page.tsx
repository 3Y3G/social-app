import Header from "../components/Header"
import LeftSidebar from "../components/LeftSidebar"
import EventsList from "../components/EventsList"

export default function EventsPage() {
  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <main className="container mx-auto flex gap-4 px-4 py-4">
        <LeftSidebar />
        <EventsList />
      </main>
    </div>
  )
}

