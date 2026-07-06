import rehypeFigureTitle from "rehype-figure-title"
import type { QuartzTransformerPlugin } from "@quartz-community/types"
import { visit } from "unist-util-visit"
import { fromMarkdown } from "mdast-util-from-markdown"
import { toHast } from "mdast-util-to-hast"
import type { Root } from "hast"

function rehypeRichCaption() {
  return (tree: Root) => {
    let processed = 0

    visit(tree, "element", (node: any) => {
      if (node.tagName === "figcaption") {
        processed++
        console.log("🔍 Found figcaption with text:", 
          node.children?.[0]?.value || "(no text)")

        if (node.children.length === 1 && node.children[0].type === "text") {
          let captionText = node.children[0].value.trim()
          console.log("   → Parsing as Markdown:", captionText)

          try {
            const mdast = fromMarkdown(captionText)
            const hast = toHast(mdast)

            visit(hast, "element", (linkNode: any) => {
              if (linkNode.tagName === "a") {
                linkNode.properties = linkNode.properties || {}
                linkNode.properties.target = "_blank"
                linkNode.properties.rel = "noreferrer noopener"
              }
            })

            node.children = hast.type === "root" ? hast.children : [hast]
            console.log("   → Successfully parsed Markdown links!")
          } catch (e) {
            console.log("   → Failed to parse:", e)
          }
        }
      }
    })

    console.log(`Processed ${processed} figcaptions`)
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