"use client"

import { useState, useEffect } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Users, UserPlus, UserMinus, Edit, Save, X } from "lucide-react"
import { useSession } from "next-auth/react"
import { useToast } from "@/hooks/use-toast"
import { formatDistanceToNow } from "date-fns"

type Participant = {
  id: string
  name: string | null
  image: string | null
  isOnline: boolean
  lastActive: string | null
  joinedAt: string
}

type GroupInfoDialogProps = {
  conversationId: string
  groupName: string
  groupDescription?: string
  isOpen: boolean
  onClose: () => void
}

export default function GroupInfoDialog({
  conversationId,
  groupName: initialGroupName,
  groupDescription: initialGroupDescription,
  isOpen,
  onClose,
}: GroupInfoDialogProps) {
  const { data: session } = useSession()
  const { toast } = useToast()
  const [participants, setParticipants] = useState<Participant[]>([])
  const [loading, setLoading] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [groupName, setGroupName] = useState(initialGroupName)
  const [groupDescription, setGroupDescription] = useState(initialGroupDescription || "")

  useEffect(() => {
    if (isOpen) {
      fetchParticipants()
    }
  }, [isOpen, conversationId])

  useEffect(() => {
    setGroupName(initialGroupName)
    setGroupDescription(initialGroupDescription || "")
  }, [initialGroupName, initialGroupDescription])

  const fetchParticipants = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/conversations/${conversationId}/participants`)
      const data = await response.json()

      if (data.success) {
        setParticipants(data.data)
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to fetch participants",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while fetching participants",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSaveChanges = async () => {
    try {
      const response = await fetch(`/api/conversations/${conversationId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          groupName: groupName.trim(),
          groupDescription: groupDescription.trim() || undefined,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setIsEditing(false)
        toast({
          title: "Success",
          description: "Group information updated successfully",
        })
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to update group information",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while updating group information",
        variant: "destructive",
      })
    }
  }

  const handleRemoveParticipant = async (participantId: string) => {
    try {
      const response = await fetch(`/api/conversations/${conversationId}/participants`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ participantId }),
      })

      const data = await response.json()

      if (data.success) {
        setParticipants(participants.filter((p) => p.id !== participantId))
        toast({
          title: "Success",
          description: "Participant removed successfully",
        })
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to remove participant",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while removing participant",
        variant: "destructive",
      })
    }
  }

  const handleLeaveGroup = async () => {
    if (session?.user?.id) {
      await handleRemoveParticipant(session.user.id)
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Group Information</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Group Details */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Group Details</h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  if (isEditing) {
                    setGroupName(initialGroupName)
                    setGroupDescription(initialGroupDescription || "")
                  }
                  setIsEditing(!isEditing)
                }}
              >
                {isEditing ? <X className="h-4 w-4" /> : <Edit className="h-4 w-4" />}
              </Button>
            </div>

            {isEditing ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="editGroupName">Group Name</Label>
                  <Input
                    id="editGroupName"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    maxLength={100}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editGroupDescription">Description</Label>
                  <Textarea
                    id="editGroupDescription"
                    value={groupDescription}
                    onChange={(e) => setGroupDescription(e.target.value)}
                    maxLength={500}
                    rows={3}
                  />
                </div>
                <Button onClick={handleSaveChanges} className="w-full">
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <div>
                  <Label>Group Name</Label>
                  <p className="text-sm">{groupName}</p>
                </div>
                {groupDescription && (
                  <div>
                    <Label>Description</Label>
                    <p className="text-sm text-gray-600">{groupDescription}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Participants */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Participants ({participants.length})</h3>
              <Button variant="ghost" size="icon">
                <UserPlus className="h-4 w-4" />
              </Button>
            </div>

            {loading ? (
              <div className="text-center py-4">Loading participants...</div>
            ) : (
              <div className="space-y-2">
                {participants.map((participant) => (
                  <div key={participant.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <Avatar>
                          <AvatarImage src={participant.image || undefined} alt={participant.name || ""} />
                          <AvatarFallback>{participant.name?.[0]}</AvatarFallback>
                        </Avatar>
                        {participant.isOnline && (
                          <span className="absolute -bottom-1 -right-1 h-3 w-3 rounded-full bg-green-500 border-2 border-white"></span>
                        )}
                      </div>
                      <div>
                        <div className="font-medium">{participant.name}</div>
                        <div className="text-xs text-gray-500">
                          {participant.isOnline
                            ? "Online"
                            : participant.lastActive
                              ? `Last seen ${formatDistanceToNow(new Date(participant.lastActive), { addSuffix: true })}`
                              : "Offline"}
                        </div>
                      </div>
                    </div>
                    {participant.id !== session?.user?.id && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveParticipant(participant.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <UserMinus className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="space-y-2">
            <Button variant="outline" className="w-full" onClick={handleLeaveGroup}>
              Leave Group
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
