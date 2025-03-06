import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

const friendSuggestions = [
  { name: "Alice Johnson", avatar: "/placeholder.svg?height=40&width=40", mutualFriends: 5 },
  { name: "Bob Williams", avatar: "/placeholder.svg?height=40&width=40", mutualFriends: 3 },
  { name: "Carol Davis", avatar: "/placeholder.svg?height=40&width=40", mutualFriends: 7 },
]

const trendingTopics = ["#SummerVibes", "#TechNews", "#HealthyLiving", "#TravelDreams", "#FoodieFinds"]

const onlineUsers = [
  { name: "David Brown", avatar: "/placeholder.svg?height=40&width=40" },
  { name: "Eva Martinez", avatar: "/placeholder.svg?height=40&width=40" },
  { name: "Frank Lee", avatar: "/placeholder.svg?height=40&width=40" },
]

export default function RightSidebar() {
  return (
    <aside className="w-80 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Friend Suggestions</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-4">
            {friendSuggestions.map((friend, index) => (
              <li key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Avatar>
                    <AvatarImage src={friend.avatar} alt={friend.name} />
                    <AvatarFallback>{friend.name[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{friend.name}</p>
                    <p className="text-sm text-gray-500">{friend.mutualFriends} mutual friends</p>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  Add
                </Button>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Trending Topics</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {trendingTopics.map((topic, index) => (
              <li key={index}>
                <Button variant="link" className="p-0 text-blue-600">
                  {topic}
                </Button>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Online Friends</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-4">
            {onlineUsers.map((user, index) => (
              <li key={index} className="flex items-center space-x-3">
                <Avatar>
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback>{user.name[0]}</AvatarFallback>
                </Avatar>
                <span>{user.name}</span>
                <div className="ml-auto h-2 w-2 rounded-full bg-green-500"></div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sponsored</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <img src="/placeholder.svg?height=200&width=300" alt="Sponsored content" className="rounded-lg" />
            <p className="text-sm">Experience the new XYZ product - Revolutionizing your daily life!</p>
            <Button className="w-full">Learn More</Button>
          </div>
        </CardContent>
      </Card>
    </aside>
  )
}

