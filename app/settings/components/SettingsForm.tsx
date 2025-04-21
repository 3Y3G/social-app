"use client"

import type React from "react"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { Loader2, Upload } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { updateProfile, updatePassword, updatePrivacySettings, updateAccountSettings } from "@/lib/user-actions"
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

type SettingsFormProps = {
  user: {
    id: string
    name?: string | null
    email?: string | null
    image?: string | null
    bio?: string | null
    location?: string | null
    occupation?: string | null
    language?: string | null
    theme?: string | null
    profileVisibility?: string | null
    messagePermissions?: string | null
    showOnlineStatus?: boolean
    showReadReceipts?: boolean
  }
}

export default function SettingsForm({ user }: SettingsFormProps) {
  const { toast } = useToast()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    name: user.name || "",
    email: user.email || "",
    bio: user.bio || "",
    location: user.location || "",
    occupation: user.occupation || "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
    image: user.image || "",
    coverImage: "",
    theme: user.theme || "light",
    profileVisibility: user.profileVisibility || "public",
    messagePermissions: user.messagePermissions || "friends",
    language: user.language || "en",
    showOnlineStatus: user.showOnlineStatus !== false, // Default to true if undefined
    showReadReceipts: user.showReadReceipts !== false, // Default to true if undefined
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSwitchChange = (name: string, checked: boolean) => {
    setFormData((prev) => ({ ...prev, [name]: checked }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    startTransition(async () => {
      const formDataObj = new FormData()
      formDataObj.append("name", formData.name)
      formDataObj.append("bio", formData.bio)
      formDataObj.append("location", formData.location)
      formDataObj.append("occupation", formData.occupation)
      formDataObj.append("image", formData.image)

      const result = await updateProfile(formDataObj)

      if (result.success) {
        toast({
          title: "Успешно",
          description: "Профилът е обновен успешно",
        })
        router.refresh()
      } else {
        setError(result.error || "Възникна грешка при обновяването на профила")
        toast({
          title: "Грешка",
          description: result.error || "Възникна грешка при обновяването на профила",
          variant: "destructive",
        })
      }
    })
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (formData.newPassword !== formData.confirmPassword) {
      setError("Новите пароли не съвпадат")
      toast({
        title: "Грешка",
        description: "Новите пароли не съвпадат",
        variant: "destructive",
      })
      return
    }

    startTransition(async () => {
      const formDataObj = new FormData()
      formDataObj.append("currentPassword", formData.currentPassword)
      formDataObj.append("newPassword", formData.newPassword)

      const result = await updatePassword(formDataObj)

      if (result.success) {
        toast({
          title: "Успешно",
          description: "Паролата е обновена успешно",
        })

        setFormData((prev) => ({
          ...prev,
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        }))
      } else {
        setError(result.error || "Възникна грешка при обновяването на паролата")
        toast({
          title: "Грешка",
          description: result.error || "Възникна грешка при обновяването на паролата",
          variant: "destructive",
        })
      }
    })
  }

  const handleAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    startTransition(async () => {
      const formDataObj = new FormData()
      formDataObj.append("language", formData.language)
      formDataObj.append("theme", formData.theme)

      const result = await updateAccountSettings(formDataObj)

      if (result.success) {
        toast({
          title: "Успешно",
          description: "Настройките на акаунта са запазени успешно",
        })
        router.refresh()
      } else {
        setError(result.error || "Възникна грешка при запазването на настройките на акаунта")
        toast({
          title: "Грешка",
          description: result.error || "Възникна грешка при запазването на настройките на акаунта",
          variant: "destructive",
        })
      }
    })
  }

  const handlePrivacySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    startTransition(async () => {
      const formDataObj = new FormData()
      formDataObj.append("profileVisibility", formData.profileVisibility)
      formDataObj.append("messagePermissions", formData.messagePermissions)
      formDataObj.append("showOnlineStatus", formData.showOnlineStatus.toString())
      formDataObj.append("showReadReceipts", formData.showReadReceipts.toString())

      const result = await updatePrivacySettings(formDataObj)

      if (result.success) {
        toast({
          title: "Успешно",
          description: "Настройките за поверителност са запазени успешно",
        })
        router.refresh()
      } else {
        setError(result.error || "Възникна грешка при запазването на настройките за поверителност")
        toast({
          title: "Грешка",
          description: result.error || "Възникна грешка при запазването на настройките за поверителност",
          variant: "destructive",
        })
      }
    })
  }

  return (
    <div className="flex-1">
      <Card>
        <CardHeader>
          <CardTitle>Настройки</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Tabs defaultValue="profile">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="profile">Профил</TabsTrigger>
              <TabsTrigger value="account">Акаунт</TabsTrigger>
              <TabsTrigger value="privacy">Поверителност</TabsTrigger>
            </TabsList>

            <TabsContent value="profile">
              <form onSubmit={handleProfileSubmit} className="space-y-6 py-4">
                <div className="flex flex-col items-center space-y-4">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={formData.image || undefined} alt={formData.name} />
                    <AvatarFallback>{formData.name?.[0]}</AvatarFallback>
                  </Avatar>
                  <Button type="button" variant="outline" size="sm">
                    <Upload className="mr-2 h-4 w-4" />
                    Промяна на профилна снимка
                  </Button>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="name">Име</Label>
                      <Input id="name" name="name" value={formData.name} onChange={handleChange} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Имейл</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        disabled
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bio">Биография</Label>
                    <Textarea
                      id="bio"
                      name="bio"
                      value={formData.bio}
                      onChange={handleChange}
                      placeholder="Разкажете нещо за себе си"
                      className="min-h-[100px]"
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="location">Местоположение</Label>
                      <Input
                        id="location"
                        name="location"
                        value={formData.location}
                        onChange={handleChange}
                        placeholder="Град, Държава"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="occupation">Професия</Label>
                      <Input
                        id="occupation"
                        name="occupation"
                        value={formData.occupation}
                        onChange={handleChange}
                        placeholder="Вашата професия"
                      />
                    </div>
                  </div>
                </div>

                <Button type="submit" disabled={isPending}>
                  {isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Запазване...
                    </>
                  ) : (
                    "Запази профила"
                  )}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="account">
              <div className="space-y-6 py-4">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Настройки на акаунта</h3>

                  <form onSubmit={handleAccountSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="language">Език</Label>
                      <Select
                        value={formData.language}
                        onValueChange={(value) => handleSelectChange("language", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Изберете език" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="bg">Български</SelectItem>
                          <SelectItem value="en">English</SelectItem>
                          <SelectItem value="es">Español</SelectItem>
                          <SelectItem value="fr">Français</SelectItem>
                          <SelectItem value="de">Deutsch</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="theme">Тема</Label>
                      <Select value={formData.theme} onValueChange={(value) => handleSelectChange("theme", value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Изберете тема" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="light">Светла</SelectItem>
                          <SelectItem value="dark">Тъмна</SelectItem>
                          <SelectItem value="system">Системна</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Button type="submit" disabled={isPending}>
                      {isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Запазване...
                        </>
                      ) : (
                        "Запази настройките"
                      )}
                    </Button>
                  </form>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Промяна на парола</h3>
                  <form onSubmit={handlePasswordSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword">Текуща парола</Label>
                      <Input
                        id="currentPassword"
                        name="currentPassword"
                        type="password"
                        value={formData.currentPassword}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="newPassword">Нова парола</Label>
                      <Input
                        id="newPassword"
                        name="newPassword"
                        type="password"
                        value={formData.newPassword}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Потвърдете новата парола</Label>
                      <Input
                        id="confirmPassword"
                        name="confirmPassword"
                        type="password"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                      />
                    </div>
                    <Button type="submit" disabled={isPending}>
                      {isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Обновяване...
                        </>
                      ) : (
                        "Обнови паролата"
                      )}
                    </Button>
                  </form>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Опасна зона</h3>
                  <Button
                    variant="destructive"
                    onClick={() => {
                      toast({
                        title: "Внимание",
                        description: "Тази функция не е налична в момента.",
                        variant: "destructive",
                      })
                    }}
                  >
                    Деактивирай акаунта
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="privacy">
              <form onSubmit={handlePrivacySubmit} className="space-y-6 py-4">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Настройки за поверителност</h3>

                  <div className="space-y-2">
                    <Label htmlFor="profileVisibility">Видимост на профила</Label>
                    <Select
                      value={formData.profileVisibility}
                      onValueChange={(value) => handleSelectChange("profileVisibility", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Изберете видимост" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="public">Публичен</SelectItem>
                        <SelectItem value="friends">Само приятели</SelectItem>
                        <SelectItem value="private">Личен</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="messagePermissions">Разрешения за съобщения</Label>
                    <Select
                      value={formData.messagePermissions}
                      onValueChange={(value) => handleSelectChange("messagePermissions", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Изберете разрешения" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="everyone">Всички</SelectItem>
                        <SelectItem value="friends">Само приятели</SelectItem>
                        <SelectItem value="none">Никой</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="showOnlineStatus">Показвай онлайн статус</Label>
                      <p className="text-sm text-gray-500">Позволява на другите да виждат кога сте онлайн</p>
                    </div>
                    <Switch
                      id="showOnlineStatus"
                      checked={formData.showOnlineStatus}
                      onCheckedChange={(checked) => handleSwitchChange("showOnlineStatus", checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="showReadReceipts">Показвай разписки за прочитане</Label>
                      <p className="text-sm text-gray-500">
                        Позволява на другите да знаят кога сте прочели техните съобщения
                      </p>
                    </div>
                    <Switch
                      id="showReadReceipts"
                      checked={formData.showReadReceipts}
                      onCheckedChange={(checked) => handleSwitchChange("showReadReceipts", checked)}
                    />
                  </div>
                </div>

                <Button type="submit" disabled={isPending}>
                  {isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Запазване...
                    </>
                  ) : (
                    "Запази настройките за поверителност"
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
