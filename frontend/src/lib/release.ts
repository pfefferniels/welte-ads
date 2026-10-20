import fs from 'fs'
import path from 'path'

interface Release {
  version: string | null
  date: string | null
}

/** The version and release date that CITATION.cff names, if any. A release
 * is made by setting both there and pushing the tag v<version>. */
export function currentRelease(): Release {
  const cff = fs.readFileSync(path.join(process.cwd(), '..', 'CITATION.cff'), 'utf-8')
  const field = (name: string) =>
    cff.match(new RegExp(`^${name}:\\s*"?([^"\\n]+)"?\\s*$`, 'm'))?.[1].trim() ?? null
  return { version: field('version'), date: field('date-released') }
}

/** The size of a file that the build publishes, e.g. "1.2 MB". */
export function publishedSize(file: string): string | null {
  try {
    const bytes = fs.statSync(path.join(process.cwd(), 'public', file)).size
    return `${(bytes / 1e6).toLocaleString('en-GB', { maximumFractionDigits: 1 })} MB`
  } catch {
    return null
  }
}
