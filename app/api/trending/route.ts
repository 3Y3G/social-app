import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function GET() {
  try {
    // In a real app, you would implement a more sophisticated algorithm
    // to determine trending topics based on hashtags, post content, etc.
    // For now, we'll use a simplified approach

    // Get posts from the last 7 days
    const lastWeek = new Date()
    lastWeek.setDate(lastWeek.getDate() - 7)

    const recentPosts = await prisma.post.findMany({
      where: {
        createdAt: {
          gte: lastWeek,
        },
      },
      select: {
        content: true,
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
      },
    })

    // Extract hashtags from post content
    const hashtagRegex = /#(\w+)/g
    const hashtags: Record<string, { count: number; engagement: number }> = {}

    recentPosts.forEach((post) => {
      const matches = post.content?.match(hashtagRegex) || []

      const engagement = post._count.likes + post._count.comments

      matches.forEach((tag: string) => {
        const cleanTag = tag.toLowerCase()
        if (!hashtags[cleanTag]) {
          hashtags[cleanTag] = { count: 0, engagement: 0 }
        }
        hashtags[cleanTag].count += 1
        hashtags[cleanTag].engagement += engagement
      })
    })

    // Convert to array and sort by engagement and count
    const trendingTopics = Object.entries(hashtags)
      .map(([tag, data]) => ({
        id: tag,
        name: tag,
        count: data.count,
        engagement: data.engagement,
        score: data.count * 0.4 + data.engagement * 0.6, // Weighted score
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 10) // Get top 10

    return NextResponse.json({ success: true, data: trendingTopics })
  } catch (error) {
    console.error("Error fetching trending topics:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch trending topics" }, { status: 500 })
  }
}
