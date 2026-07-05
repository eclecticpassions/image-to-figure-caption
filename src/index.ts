import type { QuartzTransformerPlugin } from "@quartz-community/types"
import { visit } from "unist-util-visit"
import { fromMarkdown } from "mdast-util-from-markdown"

function remarkFigureCaptions() {
  return (tree: any) => {
    visit(tree, "image", (node: any, index: number | undefined, parent: any) => {
      if (!parent || index === undefined) return
      if (!node.title) return

      const caption = fromMarkdown(node.title)

      parent.children[index] = {
        type: "html",
        value: renderFigure(node.url, node.alt, caption),
      }
    })
  }
}

function renderFigure(src: string, alt: string, caption: any) {
  return `<figure><img src="${escapeHtml(src)}" alt="${escapeHtml(alt ?? "")}"><figcaption>${renderMdast(caption)}</figcaption></figure>`
}

function renderMdast(node: any): string {
  if (!node) return ""
  if (node.type === "root" && Array.isArray(node.children)) {
    return node.children.map(renderMdast).join("")
  }
  if (node.type === "text") return escapeHtml(node.value ?? "")
  if (node.type === "link") {
    const href = escapeHtml(node.url ?? "")
    const children = Array.isArray(node.children) ? node.children.map(renderMdast).join("") : ""
    return `<a href="${href}" target="_blank" rel="noreferrer">${children}</a>`
  }
  if (Array.isArray(node.children)) return node.children.map(renderMdast).join("")
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