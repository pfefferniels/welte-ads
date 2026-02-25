import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { remark } from 'remark'
import html from 'remark-html'

interface MarkdownContent {
  frontmatter: {
    path?: string
    title?: string
    [key: string]: unknown
  }
  html: string
}

export function getMarkdownContent(filename: string): MarkdownContent {
  const filePath = path.join(process.cwd(), 'src', 'introduction', filename)
  const fileContents = fs.readFileSync(filePath, 'utf8')
  const { data, content } = matter(fileContents)
  const processedContent = remark().use(html).processSync(content)

  return {
    frontmatter: data,
    html: processedContent.toString(),
  }
}
