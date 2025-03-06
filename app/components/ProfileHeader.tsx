import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Pencil, MapPin, Briefcase, Calendar } from "lucide-react"

export default function ProfileHeader() {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="relative">
          <img
            src="/placeholder.svg?height=200&width=1000"
            alt="Cover"
            className="h-48 w-full rounded-lg object-cover"
          />
          <Avatar className="absolute bottom-0 left-4 -mb-16 h-32 w-32 border-4 border-white">
            <AvatarImage src="/placeholder.svg?height=128&width=128" alt="Profile" />
            <AvatarFallback>JD</AvatarFallback>
          </Avatar>
        </div>
        <div className="mt-16 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">John Doe</h2>
            <p className="text-gray-500">Software Developer</p>
          </div>
          <Button>
            <Pencil className="mr-2 h-4 w-4" />
            Edit Profile
          </Button>
        </div>
        <div className="mt-4 flex space-x-4 text-gray-500">
          <div className="flex items-center">
            <MapPin className="mr-1 h-4 w-4" />
            New York, USA
          </div>
          <div className="flex items-center">
            <Briefcase className="mr-1 h-4 w-4" />
            Acme Inc.
          </div>
          <div className="flex items-center">
            <Calendar className="mr-1 h-4 w-4" />
            Joined January 2020
          </div>
        </div>
        <p className="mt-4">
          Passionate about creating innovative solutions and building great user experiences. Always learning and
          exploring new technologies.
        </p>
      </CardContent>
    </Card>
  )
}

