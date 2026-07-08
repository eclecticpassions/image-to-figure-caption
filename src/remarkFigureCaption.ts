import type { Plugin } from "unified"
import { visit } from "unist-util-visit"
import type { Root, Paragraph, ListItem, Image } from "mdast"

export const remarkFigureCaption: Plugin<[], Root> = () => {
  return (tree) => {
    visit(tree, "paragraph", (node: Paragraph, index, parent) => {
      if (!parent || typeof index !== "number") return
      if (node.children.length !== 1) return

      const child = node.children[0]
      if (child.type !== "image") return

      const image = child as Image
      if (!image.title) return

      parent.children[index] = {
        type: "html",
        value: `<figure><img src="${image.url}" alt="${image.alt || ""}"><figcaption>${image.title}</figcaption></figure>`,
      } as any
    })
  }
}