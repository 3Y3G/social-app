import { Suspense } from "react"
import SearchResults from "../../components/SearchResults"

export default async function SearchPage(props: { searchParams: Promise<{ q: string }> }) {
  const searchParams = await props.searchParams
  const query = searchParams.q || ""

  return (
    <div className="min-h-screen bg-gray-100">
      <main className="container mx-auto flex gap-4 px-4 py-4">
        <div className="flex-1">
          <Suspense fallback={<div>Loading search results...</div>}>
            <SearchResults initialQuery={query} />
          </Suspense>
        </div>
      </main>
    </div>
  )
}
