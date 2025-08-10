import fs from 'fs'
import path from 'path'
import { visit } from 'unist-util-visit'
import { unified } from 'unified'
import remarkParse from 'remark-parse'

/**
 * remark plugin to include external file contents at lines like:
 *   !INCLUDE "filename"
 * If the file does not exist, replace with nothing (no error).
 */
export default function remarkIncludeFiles() {
  return async (tree, file) => {
    const cwd = file.cwd || process.cwd()

    visit(tree, 'paragraph', (node, index, parent) => {
      if (
        node.children.length === 1 &&
        node.children[0].type === 'text'
      ) {
        const text = node.children[0].value.trim()
        const includeMatch = text.match(/^!INCLUDE\s+"(.+)"$/)
        if (includeMatch) {
          const includePath = path.resolve(cwd, includeMatch[1])
          if (fs.existsSync(includePath)) {
            const content = fs.readFileSync(includePath, 'utf8')
            // Parse included content into AST
            const parsed = unified().use(remarkParse).parse(content)
            // Replace the current node with parsed children
            parent.children.splice(index, 1, ...parsed.children)
          } else {
            // File not found: just remove the include directive node
            parent.children.splice(index, 1)
          }
        }
      }
    })
  }
}



