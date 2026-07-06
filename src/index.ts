import rehypeFigureTitle from "rehype-figure-title"
import type { QuartzTransformerPlugin } from "@quartz-community/types"
import { visit } from "unist-util-visit"
import { fromMarkdown } from "mdast-util-from-markdown"
import { toHast } from "mdast-util-to-hast"
import type { Root } from "hast"

function rehypeRichCaption() {
  return (tree: Root) => {
    visit(tree, "element", (node: any) => {
      if (node.tagName !== "figcaption") return

      if (node.children.length === 1 && node.children[0].type === "text") {
        const captionText = node.children[0].value.trim()

        try {
          const mdast = fromMarkdown(captionText)
          let hast = toHast(mdast)

          // Add target="_blank" and rel to all links
          visit(hast, "element", (linkNode: any) => {
            if (linkNode.tagName === "a") {
              linkNode.properties = linkNode.properties || {}
              linkNode.properties.target = "_blank"
              linkNode.properties.rel = "noreferrer noopener"
            }
          })

          node.children = hast.type === "root" ? hast.children : [hast]
        } catch (e) {
          console.warn("Failed to parse caption as Markdown:", captionText)
        }
      }
    })
  }
}

export const RehypeFigure: QuartzTransformerPlugin = () => ({
  name: "rehypeFigureTitle",
  htmlPlugins() {
    return [
      [rehypeFigureTitle, {}],
      [rehypeRichCaption, {}]
    ]
  },
})

export default RehypeFigure