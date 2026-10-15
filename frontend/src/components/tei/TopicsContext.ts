"use client"

import { createContext } from "react"
import type { Topic } from "../../lib/tei"

// the topics of the edition, keyed by their pointer (e.g. "#home")
export const TopicsContext = createContext<Record<string, Topic>>({})
