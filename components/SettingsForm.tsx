// Файл: SettingsForm.tsx
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function SettingsForm() {
  return (
    <div className="flex-1">
      <Card>
        <CardHeader>
          <CardTitle>Настройки</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="account">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="account">Профил</TabsTrigger>
              <TabsTrigger value="privacy">Поверителност</TabsTrigger>
              <TabsTrigger value="notifications">Известия</TabsTrigger>
            </TabsList>

            <TabsContent value="account">
              <form className="space-y-4">
                <div>
                  <Label htmlFor="name">Име</Label>
                  <Input id="name" defaultValue="Иван Петров" />
                </div>
                <div>
                  <Label htmlFor="email">Имейл</Label>
                  <Input id="email" type="email" defaultValue="ivan@example.com" />
                </div>
                <div>
                  <Label htmlFor="password">Нова парола</Label>
                  <Input id="password" type="password" />
                </div>
                <Button>Запази промените</Button>
              </form>
            </TabsContent>

            <TabsContent value="privacy">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="public-profile">Публичен профил</Label>
                  <Switch id="public-profile" />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="friend-requests">Позволи заявки за приятелство</Label>
                  <Switch id="friend-requests" defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="data-sharing">Споделяне на данни</Label>
                  <Switch id="data-sharing" />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="notifications">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="email-notifications">Имейл известия</Label>
                  <Switch id="email-notifications" defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="push-notifications">Push известия</Label>
                  <Switch id="push-notifications" defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="newsletter">Бюлетин</Label>
                  <Switch id="newsletter" />
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
