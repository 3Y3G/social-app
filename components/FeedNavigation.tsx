// Файл: FeedNavigation.tsx
"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Clock, Flame, Sparkles } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"

export default function FeedNavigation() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState(searchParams.get("feed") || "latest")

  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
    router.push(`/?feed=${tab}`, { scroll: false })
  }

  return (
    <Card>
      <CardContent className="p-2">
        <div className="flex space-x-2">
          <Button
            variant={activeTab === "latest" ? "default" : "ghost"}
            onClick={() => handleTabChange("latest")}
            className="flex-1"
          >
            <Clock className="mr-2 h-4 w-4" />
            Най-нови
          </Button>
          <Button
            variant={activeTab === "popular" ? "default" : "ghost"}
            onClick={() => handleTabChange("popular")}
            className="flex-1"
          >
            <Flame className="mr-2 h-4 w-4" />
            Популярни
          </Button>
          <Button
            variant={activeTab === "for-you" ? "default" : "ghost"}
            onClick={() => handleTabChange("for-you")}
            className="flex-1"
          >
            <Sparkles className="mr-2 h-4 w-4" />
            За теб
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
