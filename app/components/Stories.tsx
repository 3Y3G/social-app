import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { Plus } from "lucide-react"

const stories = [
  { id: 1, name: "Your Story", avatar: "/placeholder.svg?height=50&width=50" },
  { id: 2, name: "John Doe", avatar: "/placeholder.svg?height=50&width=50" },
  { id: 3, name: "Jane Smith", avatar: "/placeholder.svg?height=50&width=50" },
  { id: 4, name: "Alice Johnson", avatar: "/placeholder.svg?height=50&width=50" },
  { id: 5, name: "Bob Williams", avatar: "/placeholder.svg?height=50&width=50" },
  { id: 6, name: "Emma Brown", avatar: "/placeholder.svg?height=50&width=50" },
]

export default function Stories() {
  return (
    <Card className="p-4">
      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex w-max space-x-4">
          {stories.map((story, index) => (
            <Button key={story.id} variant="ghost" className="flex flex-col items-center space-y-1 p-0">
              <Avatar className="h-16 w-16 ring-2 ring-blue-500">
                {index === 0 && (
                  <div className="absolute bottom-0 right-0 rounded-full bg-blue-500 p-1">
                    <Plus className="h-4 w-4 text-white" />
                  </div>
                )}
                <AvatarImage src={story.avatar} alt={story.name} />
                <AvatarFallback>{story.name[0]}</AvatarFallback>
              </Avatar>
              <span className="text-xs">{story.name}</span>
            </Button>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </Card>
  )
}

