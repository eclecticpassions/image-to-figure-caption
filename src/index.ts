import type { QuartzTransformerPlugin } from "@quartz-community/types"
import { visit } from "unist-util-visit"
import { fromMarkdown } from "mdast-util-from-markdown"

function remarkFigureCaptions() {
  return (tree: any) => {
    visit(tree, "image", (node: any, index: number | undefined, parent: any) => {
      if (!parent || index === undefined) return
      if (!node.title) return

      const captionMdast = fromMarkdown(node.title)
      const figureNode = {
        type: "paragraph",
        data: { hName: "figure" },
        children: [
          {
            type: "image",
            url: node.url,
            alt: node.alt,
            title: null,
          },
          {
            type: "html",
            value: `<figcaption>${renderInlineMdast(captionMdast)}</figcaption>`,
          },
        ],
      }

      parent.children[index] = figureNode
    })
  }
}

function renderInlineMdast(node: any): string {
  if (!node) return ""
  if (node.type === "root" && Array.isArray(node.children)) {
    return node.children.map(renderInlineMdast).join("")
  }
  if (node.type === "text") return escapeHtml(node.value ?? "")
  if (node.type === "link") {
    const href = escapeHtml(node.url ?? "")
    const text = Array.isArray(node.children) ? node.children.map(renderInlineMdast).join("") : ""
    return `<a href="${href}" target="_blank" rel="noreferrer">${text}</a>`
  }
  if (Array.isArray(node.children)) return node.children.map(renderInlineMdast).join("")
  return ""
}

function escapeHtml(s: string) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
}

export const RehypeFigure: QuartzTransformerPlugin = () => ({
  name: "remarkFigureCaptions",
  remarkPlugins() {
    return [[remarkFigureCaptions, {}]]
  },
})

export default RehypeFigure