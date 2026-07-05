import rehypeFigureTitle from "rehype-figure-title"
import type { QuartzTransformerPlugin } from "@quartz-community/types"
import { visit } from "unist-util-visit"

function rehypeCaptionLinkify() {
  return (tree: any) => {
    visit(tree, "element", (node: any) => {
      if (node.tagName !== "figcaption" || !Array.isArray(node.children)) return

      node.children = node.children.flatMap((child: any) => {
        if (child.type !== "text" || typeof child.value !== "string") return [child]

        const url = child.value.match(/https?:\/\/[^\s]+/g)
        if (!url) return [child]

        const parts: any[] = []
        let lastIndex = 0

        for (const match of child.value.matchAll(/https?:\/\/[^\s]+/g)) {
          const start = match.index ?? 0
          const href = match[0]

          if (start > lastIndex) {
            parts.push({
              type: "text",
              value: child.value.slice(lastIndex, start),
            })
          }

          parts.push({
            type: "element",
            tagName: "a",
            properties: { href, target: "_blank", rel: "noreferrer" },
            children: [{ type: "text", value: href }],
          })

          lastIndex = start + href.length
        }

        if (lastIndex < child.value.length) {
          parts.push({
            type: "text",
            value: child.value.slice(lastIndex),
          })
        }

        return parts
      })
    })
  }
}

export const RehypeFigure: QuartzTransformerPlugin = () => ({
  name: "rehypeFigureTitle",
  htmlPlugins() {
    return [[rehypeFigureTitle, {}], [rehypeCaptionLinkify, {}]]
  },
})

export default RehypeFigure