import { Suspense } from "react"
import Header from "../components/Header"
import LeftSidebar from "../components/LeftSidebar"
import SearchResults from "../components/SearchResults"

export default function SearchPage({ searchParams }: { searchParams: { q: string } }) {
  const query = searchParams.q || ""

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <main className="container mx-auto flex gap-4 px-4 py-4">
        <LeftSidebar />
        <div className="flex-1">
          <Suspense fallback={<div>Loading search results...</div>}>
            <SearchResults initialQuery={query} />
          </Suspense>
        </div>
      </main>
    </div>
  )
}

