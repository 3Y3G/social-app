"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Facebook, Twitter, Globe, Lock, Users, Loader2 } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

interface ShareOptionsProps {
  onSubmit: (e: React.FormEvent) => Promise<void>
  isSubmitting: boolean
}

export default function ShareOptions({ onSubmit, isSubmitting }: ShareOptionsProps) {
  const [shareToFacebook, setShareToFacebook] = useState(false)
  const [shareToTwitter, setShareToTwitter] = useState(false)
  const [visibility, setVisibility] = useState("public")
  const [allowComments, setAllowComments] = useState(true)
  const [showLikes, setShowLikes] = useState(true)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(e)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Настройки за споделяне</h3>

        <div className="space-y-4 border border-neutral-200 rounded-md p-4 dark:border-neutral-800 dark:border-neutral-800">
          <h4 className="text-sm font-medium">Също така сподели в</h4>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Facebook className="h-5 w-5 text-blue-600" />
              <Label htmlFor="share-facebook">Facebook</Label>
            </div>
            <Switch id="share-facebook" checked={shareToFacebook} onCheckedChange={setShareToFacebook} />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Twitter className="h-5 w-5 text-blue-400" />
              <Label htmlFor="share-twitter">Twitter</Label>
            </div>
            <Switch id="share-twitter" checked={shareToTwitter} onCheckedChange={setShareToTwitter} />
          </div>
        </div>

        <div className="space-y-4 border border-neutral-200 rounded-md p-4 dark:border-neutral-800 dark:border-neutral-800">
          <h4 className="text-sm font-medium">Видимост на публикацията</h4>

          <RadioGroup value={visibility} onValueChange={setVisibility}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="public" id="public" />
              <Label htmlFor="public" className="flex items-center">
                <Globe className="h-4 w-4 mr-2" />
                Публична
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="friends" id="friends" />
              <Label htmlFor="friends" className="flex items-center">
                <Users className="h-4 w-4 mr-2" />
                Само за приятели
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="private" id="private" />
              <Label htmlFor="private" className="flex items-center">
                <Lock className="h-4 w-4 mr-2" />
                Частна
              </Label>
            </div>
          </RadioGroup>
        </div>

        <div className="space-y-4 border border-neutral-200 rounded-md p-4 dark:border-neutral-800 dark:border-neutral-800">
          <h4 className="text-sm font-medium">Разширени настройки</h4>

          <div className="flex items-center justify-between">
            <Label htmlFor="allow-comments">Позволи коментари</Label>
            <Switch id="allow-comments" checked={allowComments} onCheckedChange={setAllowComments} />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="show-likes">Показвай брой харесвания</Label>
            <Switch id="show-likes" checked={showLikes} onCheckedChange={setShowLikes} />
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting} className="w-full md:w-auto">
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Създаване...
            </>
          ) : (
            "Създай публикация"
          )}
        </Button>
      </div>
    </form>
  )
}
