import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const friends = [
  { id: 1, name: "Alice Johnson", avatar: "/placeholder.svg?height=50&width=50", mutualFriends: 15 },
  { id: 2, name: "Bob Williams", avatar: "/placeholder.svg?height=50&width=50", mutualFriends: 8 },
  { id: 3, name: "Carol Davis", avatar: "/placeholder.svg?height=50&width=50", mutualFriends: 23 },
  { id: 4, name: "David Brown", avatar: "/placeholder.svg?height=50&width=50", mutualFriends: 5 },
  { id: 5, name: "Eva Martinez", avatar: "/placeholder.svg?height=50&width=50", mutualFriends: 12 },
]

export default function FriendsList() {
  return (
    <div className="flex-1">
      <Card>
        <CardHeader>
          <CardTitle>Your Friends</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {friends.map((friend) => (
              <Card key={friend.id}>
                <CardContent className="flex flex-col items-center p-6">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={friend.avatar} alt={friend.name} />
                    <AvatarFallback>{friend.name[0]}</AvatarFallback>
                  </Avatar>
                  <h3 className="mt-4 text-lg font-semibold">{friend.name}</h3>
                  <p className="text-sm text-gray-500">{friend.mutualFriends} mutual friends</p>
                  <div className="mt-4 flex space-x-2">
                    <Button variant="outline" size="sm">
                      Message
                    </Button>
                    <Button variant="outline" size="sm">
                      View Profile
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

