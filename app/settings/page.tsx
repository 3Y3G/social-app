import Header from "../components/Header"
import LeftSidebar from "../components/LeftSidebar"
import SettingsForm from "../components/SettingsForm"

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <main className="container mx-auto flex gap-4 px-4 py-4">
        <LeftSidebar />
        <SettingsForm />
      </main>
    </div>
  )
}

