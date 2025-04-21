import SavedItems from "../../components/SavedItems"

export default function SavedPage() {
  return (
    <div className="min-h-screen bg-gray-100">
      <main className="container mx-auto flex gap-4 px-4 py-4">
        <SavedItems />
      </main>
    </div>
  )
}
