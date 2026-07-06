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

      const pNode = node.children.find((child: any) => child.tagName === "p")
      const textNode = pNode ? pNode.children?.[0] : node.children?.[0]

      if (!textNode || textNode.type !== "text") return

      const captionText = textNode.value.trim()
      if (!captionText) return

      // Try full Markdown parsing first (preferred)
      try {
        const mdast = fromMarkdown(captionText)
        let hast = toHast(mdast)

        visit(hast, (n: any) => {
          if (n.type === "element" && n.tagName === "a") {
            n.properties = n.properties || {}
            n.properties.target = "_blank"
            n.properties.rel = "noreferrer noopener"
          }
        })

        if (pNode) {
          pNode.children = hast.type === "root" ? hast.children : [hast]
        } else {
          node.children = hast.type === "root" ? hast.children : [hast]
        }
        return
      } catch (e) {
        // Fallback to raw URL linkify
        const urlRegex = /https?:\/\/[^\s<)]+/g
        const matches = [...captionText.matchAll(urlRegex)]
        if (matches.length > 0) {
          const parts = captionText.split(urlRegex)
          const newChildren: any[] = []

          parts.forEach((part: string, i: number) => {
            if (part) newChildren.push({ type: "text", value: part })
            if (matches[i]) {
              const url = matches[i][0]
              newChildren.push({
                type: "element",
                tagName: "a",
                properties: {
                  href: url,
                  target: "_blank",
                  rel: "noreferrer noopener"
                },
                children: [{ type: "text", value: url }]
              })
            }
          })

          if (pNode) pNode.children = newChildren
          else node.children = newChildren
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