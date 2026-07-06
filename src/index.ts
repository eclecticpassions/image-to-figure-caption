import rehypeFigureTitle from "rehype-figure-title"
import type { QuartzTransformerPlugin } from "@quartz-community/types"
import { visit } from "unist-util-visit"
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

      const urlRegex = /https?:\/\/[^\s<)]+/g
      const matches = [...captionText.matchAll(urlRegex)]

      if (matches.length === 0) return

      const parts = captionText.split(urlRegex)
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

      if (pNode) {
        pNode.children = newChildren
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