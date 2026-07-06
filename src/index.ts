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

      // Handle both direct text and text inside <p>
      let textNode = node.children.find((child: any) => 
        child.type === "text" || (child.type === "element" && child.tagName === "p")
      )

      if (!textNode) return

      let captionText = ""

      if (textNode.type === "text") {
        captionText = textNode.value.trim()
      } else if (textNode.type === "element" && textNode.tagName === "p") {
        captionText = textNode.children?.[0]?.value?.trim() || ""
      }

      if (!captionText) return

      // Try Markdown parsing first
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

        // Replace the content
        if (textNode.type === "element" && textNode.tagName === "p") {
          textNode.children = hast.type === "root" ? hast.children : [hast]
        } else {
          node.children = hast.type === "root" ? hast.children : [hast]
        }
        return
      } catch (e) {}

      // Fallback: raw URL linkify
      const urlRegex = /https?:\/\/[^\s<)]+/g
      const matches = [...captionText.matchAll(urlRegex)]

      if (matches.length === 0) return

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

      if (textNode.type === "element" && textNode.tagName === "p") {
        textNode.children = newChildren
      } else {
        node.children = newChildren
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