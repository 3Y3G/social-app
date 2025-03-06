import Header from "../components/Header"
import LeftSidebar from "../components/LeftSidebar"
import ProfileHeader from "../components/ProfileHeader"
import ProfileTabs from "../components/ProfileTabs"

export default function ProfilePage() {
  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <main className="container mx-auto flex gap-4 px-4 py-4">
        <LeftSidebar />
        <div className="flex-1 space-y-4">
          <ProfileHeader />
          <ProfileTabs />
        </div>
      </main>
    </div>
  )
}

