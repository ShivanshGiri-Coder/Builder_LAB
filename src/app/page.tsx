import type { Metadata } from "next"
import HomePageClient from "./home-page-client"

export const metadata: Metadata = {
  title: "Builder LAB - Portfolio Builder for Teen Coders",
  description:
    "Build your developer portfolio in minutes. AI-powered case studies, beautiful templates, and instant publishing for student coders.",
}

export default function HomePage() {
  return <HomePageClient />
}
