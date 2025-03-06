import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Image, Video, Smile, MapPin } from "lucide-react"

export default function CreatePost() {
  return (
    <Card>
      <CardContent className="pt-4">
        <div className="flex space-x-4">
          <Avatar>
            <AvatarImage src="/placeholder.svg?height=40&width=40" alt="User" />
            <AvatarFallback>U</AvatarFallback>
          </Avatar>
          <Input placeholder="What's on your mind?" className="flex-1" />
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <div className="flex space-x-2">
          <Button variant="ghost" size="sm">
            <Image className="mr-2 h-4 w-4" />
            Photo
          </Button>
          <Button variant="ghost" size="sm">
            <Video className="mr-2 h-4 w-4" />
            Video
          </Button>
          <Button variant="ghost" size="sm">
            <Smile className="mr-2 h-4 w-4" />
            Feeling
          </Button>
          <Button variant="ghost" size="sm">
            <MapPin className="mr-2 h-4 w-4" />
            Check in
          </Button>
        </div>
        <Button>Post</Button>
      </CardFooter>
    </Card>
  )
}

