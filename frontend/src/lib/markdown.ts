import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { remark } from 'remark'
import gfm from 'remark-gfm'
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
  // gfm renders the footnotes; sanitizing would prefix their ids a second
  // time so that the links between references and notes break. The
  // markdown files are our own.
  const processedContent = remark().use(gfm).use(html, { sanitize: false }).processSync(content)

  return {
    frontmatter: data,
    html: processedContent.toString(),
  }
}
