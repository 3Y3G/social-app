import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Bookmark, Link, Image } from "lucide-react"

const savedItems = [
  { id: 1, type: "post", title: "Interesting article about AI", url: "#", date: "2023-06-15" },
  { id: 2, type: "link", title: "Cool website for developers", url: "#", date: "2023-06-14" },
  { id: 3, type: "image", title: "Beautiful sunset photo", url: "#", date: "2023-06-13" },
  { id: 4, type: "post", title: "Recipe for delicious pasta", url: "#", date: "2023-06-12" },
  { id: 5, type: "link", title: "Useful JavaScript tutorial", url: "#", date: "2023-06-11" },
]

export default function SavedItems() {
  return (
    <div className="flex-1">
      <Card>
        <CardHeader>
          <CardTitle>Saved Items</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all">
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="posts">Posts</TabsTrigger>
              <TabsTrigger value="links">Links</TabsTrigger>
              <TabsTrigger value="images">Images</TabsTrigger>
            </TabsList>
            <TabsContent value="all">
              <ul className="space-y-4">
                {savedItems.map((item) => (
                  <li key={item.id}>
                    <Card>
                      <CardContent className="flex items-center p-4">
                        {item.type === "post" && <Bookmark className="mr-4 h-5 w-5" />}
                        {item.type === "link" && <Link className="mr-4 h-5 w-5" />}
                        {item.type === "image" && <Image className="mr-4 h-5 w-5" />}
                        <div>
                          <h3 className="font-semibold">{item.title}</h3>
                          <p className="text-sm text-gray-500">Saved on {item.date}</p>
                        </div>
                      </CardContent>
                    </Card>
                  </li>
                ))}
              </ul>
            </TabsContent>
            <TabsContent value="posts">
              <ul className="space-y-4">
                {savedItems
                  .filter((item) => item.type === "post")
                  .map((item) => (
                    <li key={item.id}>
                      <Card>
                        <CardContent className="flex items-center p-4">
                          <Bookmark className="mr-4 h-5 w-5" />
                          <div>
                            <h3 className="font-semibold">{item.title}</h3>
                            <p className="text-sm text-gray-500">Saved on {item.date}</p>
                          </div>
                        </CardContent>
                      </Card>
                    </li>
                  ))}
              </ul>
            </TabsContent>
            <TabsContent value="links">
              <ul className="space-y-4">
                {savedItems
                  .filter((item) => item.type === "link")
                  .map((item) => (
                    <li key={item.id}>
                      <Card>
                        <CardContent className="flex items-center p-4">
                          <Link className="mr-4 h-5 w-5" />
                          <div>
                            <h3 className="font-semibold">{item.title}</h3>
                            <p className="text-sm text-gray-500">Saved on {item.date}</p>
                          </div>
                        </CardContent>
                      </Card>
                    </li>
                  ))}
              </ul>
            </TabsContent>
            <TabsContent value="images">
              <ul className="space-y-4">
                {savedItems
                  .filter((item) => item.type === "image")
                  .map((item) => (
                    <li key={item.id}>
                      <Card>
                        <CardContent className="flex items-center p-4">
                          <Image className="mr-4 h-5 w-5" />
                          <div>
                            <h3 className="font-semibold">{item.title}</h3>
                            <p className="text-sm text-gray-500">Saved on {item.date}</p>
                          </div>
                        </CardContent>
                      </Card>
                    </li>
                  ))}
              </ul>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

