import type { QuartzTransformerPlugin } from "@quartz-community/types"
import { visit } from "unist-util-visit"
import { fromMarkdown } from "mdast-util-from-markdown"

function remarkImageCaptionLinks() {
  return (tree: any) => {
    visit(tree, "image", (node: any, index: number | undefined, parent: any) => {
      if (!parent || index === undefined) return
      if (!node.title) return

      const caption = fromMarkdown(node.title)
      const captionHtml = mdastToInlineHtml(caption)

      parent.children.splice(index + 1, 0, {
        type: "html",
        value: `<figcaption>${captionHtml}</figcaption>`,
      })
    })
  }
}

function mdastToInlineHtml(node: any): string {
  if (!node) return ""
  if (node.type === "root" && Array.isArray(node.children)) {
    return node.children.map(mdastToInlineHtml).join("")
  }
  if (node.type === "text") return escapeHtml(node.value ?? "")
  if (node.type === "link") {
    const href = escapeHtml(node.url ?? "")
    const text = Array.isArray(node.children) ? node.children.map(mdastToInlineHtml).join("") : ""
    return `<a href="${href}" target="_blank" rel="noreferrer">${text}</a>`
  }
  if (Array.isArray(node.children)) return node.children.map(mdastToInlineHtml).join("")
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
  name: "remarkImageCaptionLinks",
  remarkPlugins() {
    return [[remarkImageCaptionLinks, {}]]
  },
})

export default RehypeFigure