"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

// sends a link of the old kind (/topic/#home) on to the topic's own page
export default function TopicRedirect() {
  const router = useRouter()

  useEffect(() => {
    const id = window.location.hash.slice(1)
    router.replace(id ? `/topic/${id}` : '/topics')
  }, [router])

  return null
}
