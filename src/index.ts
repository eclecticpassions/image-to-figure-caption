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
        let text = node.children[0].value.trim()

        // 1. Try full Markdown parsing first
        try {
          const mdast = fromMarkdown(text)
          let hast = toHast(mdast)

          visit(hast, (n: any) => {
            if (n.type === "element" && n.tagName === "a") {
              n.properties = n.properties || {}
              n.properties.target = "_blank"
              n.properties.rel = "noreferrer noopener"
            }
          })

          node.children = hast.type === "root" ? hast.children : [hast]
          return
        } catch (e) {}

        // 2. Fallback: linkify raw URLs
        const urlRegex = /https?:\/\/[^\s<)]+/g
        const parts = text.split(urlRegex)
        const matches = [...text.matchAll(urlRegex)]

        const newChildren: any[] = []

        parts.forEach((part: string, i: number) => {
          if (part) {
            newChildren.push({ type: "text", value: part })
          }
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

        if (newChildren.length > 0) {
          node.children = newChildren
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