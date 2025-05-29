"use client"

import { useState, useEffect } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Search, X, Users } from "lucide-react"
import { useSession } from "next-auth/react"
import { useToast } from "@/hooks/use-toast"
import type { SafeUser } from "@/lib/types"

type GroupConversationFormProps = {
  onCreateConversation: (participantIds: string[], groupName: string, groupDescription?: string) => void
  onCancel: () => void
}

export default function GroupConversationForm({ onCreateConversation, onCancel }: GroupConversationFormProps) {
  const { data: session } = useSession()
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<SafeUser[]>([])
  const [selectedParticipants, setSelectedParticipants] = useState<SafeUser[]>([])
  const [groupName, setGroupName] = useState("")
  const [groupDescription, setGroupDescription] = useState("")
  const [loading, setLoading] = useState(false)
  const [isCreating, setIsCreating] = useState(false)

  useEffect(() => {
    if (searchQuery.trim().length >= 2) {
      searchUsers()
    } else {
      setSearchResults([])
    }
  }, [searchQuery])

  const searchUsers = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}&type=users`)
      const data = await response.json()

      if (data.success) {
        // Filter out the current user and already selected participants
        const filteredResults = data.data.users.filter(
          (user: SafeUser) => user.id !== session?.user?.id && !selectedParticipants.some((p) => p.id === user.id),
        )
        setSearchResults(filteredResults)
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to search users",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while searching users",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const addParticipant = (user: SafeUser) => {
    setSelectedParticipants([...selectedParticipants, user])
    setSearchQuery("")
    setSearchResults([])
  }

  const removeParticipant = (userId: string) => {
    setSelectedParticipants(selectedParticipants.filter((p) => p.id !== userId))
  }

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      toast({
        title: "Error",
        description: "Group name is required",
        variant: "destructive",
      })
      return
    }

    if (selectedParticipants.length === 0) {
      toast({
        title: "Error",
        description: "At least one participant is required",
        variant: "destructive",
      })
      return
    }

    setIsCreating(true)
    try {
      const participantIds = selectedParticipants.map((p) => p.id)
      await onCreateConversation(participantIds, groupName, groupDescription || undefined)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create group conversation",
        variant: "destructive",
      })
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <Users className="h-5 w-5 text-gray-500" />
        <h3 className="text-lg font-semibold">Create Group Conversation</h3>
      </div>

      {/* Group Name */}
      <div className="space-y-2">
        <Label htmlFor="groupName">Group Name *</Label>
        <Input
          id="groupName"
          placeholder="Enter group name"
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
          maxLength={100}
        />
      </div>

      {/* Group Description */}
      <div className="space-y-2">
        <Label htmlFor="groupDescription">Group Description (Optional)</Label>
        <Textarea
          id="groupDescription"
          placeholder="Enter group description"
          value={groupDescription}
          onChange={(e) => setGroupDescription(e.target.value)}
          maxLength={500}
          rows={3}
        />
      </div>

      {/* Selected Participants */}
      {selectedParticipants.length > 0 && (
        <div className="space-y-2">
          <Label>Selected Participants ({selectedParticipants.length})</Label>
          <div className="flex flex-wrap gap-2">
            {selectedParticipants.map((participant) => (
              <div key={participant.id} className="flex items-center space-x-2 bg-gray-100 rounded-full px-3 py-1">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={participant.image || undefined} alt={participant.name || ""} />
                  <AvatarFallback className="text-xs">{participant.name?.[0]}</AvatarFallback>
                </Avatar>
                <span className="text-sm">{participant.name}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4 p-0"
                  onClick={() => removeParticipant(participant.id)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search Users */}
      <div className="space-y-2">
        <Label>Add Participants</Label>
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search for users to add"
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Search Results */}
      <div className="max-h-60 overflow-y-auto">
        {loading ? (
          <div className="text-center py-4">Searching...</div>
        ) : searchResults.length === 0 ? (
          searchQuery.trim().length >= 2 ? (
            <div className="text-center py-4 text-gray-500">No users found</div>
          ) : (
            searchQuery.trim().length > 0 && (
              <div className="text-center py-4 text-gray-500">Type at least 2 characters to search</div>
            )
          )
        ) : (
          <div className="space-y-2">
            {searchResults.map((user) => (
              <Button
                key={user.id}
                variant="ghost"
                className="w-full justify-start"
                onClick={() => addParticipant(user)}
              >
                <Avatar className="mr-2">
                  <AvatarImage src={user.image || undefined} alt={user.name || ""} />
                  <AvatarFallback>{user.name?.[0]}</AvatarFallback>
                </Avatar>
                <div className="text-left">
                  <div className="font-semibold">{user.name}</div>
                  {user.email && <div className="text-sm text-gray-500">{user.email}</div>}
                </div>
              </Button>
            ))}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-2">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          onClick={handleCreateGroup}
          disabled={!groupName.trim() || selectedParticipants.length === 0 || isCreating}
        >
          {isCreating ? "Creating..." : "Create Group"}
        </Button>
      </div>
    </div>
  )
}
