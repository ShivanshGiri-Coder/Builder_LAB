"use client"

import WebsiteExportManager from "@/components/WebsiteExportManager"
import Link from "next/link"

export default function WebsiteExportPage() {
  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <div className="border-b border-gray-800">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">Website Export</h1>
              <p className="text-gray-400 mt-1">Generate complete static websites with SEO optimization</p>
            </div>
            <Link
              href="/dashboard"
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>

      {/* Website Export Manager */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <WebsiteExportManager />
      </div>
    </div>
  )
}
