import rehypeFigureTitle from "rehype-figure-title";
import type { QuartzTransformerPlugin } from "@quartz-community/types";
import { visit } from "unist-util-visit";
import { fromMarkdown } from "mdast-util-from-markdown";
import { toHast } from "mdast-util-to-hast";
import type { Root } from "hast";
import { remarkFigureCaption } from "./remarkFigureCaption";
import { imageSize } from "image-size";
import type { VFile } from "vfile";
import path from "path";
import fs from "fs";

// First function: Auto-calculate and inject image dimensions to fix anchor link jumping inaccurately
function rehypeImageDimensions() {
  return (tree: Root, file?: VFile) => {
    visit(tree, "element", (node: any) => {
      if (node.tagName !== "img") return;

      const src = node.properties?.src as string;
      if (!src || src.startsWith("http") || src.startsWith("//") || src.startsWith("data:")) return;

      const cleanSrc = (src.split("?")[0] || "").replace(/^(\.\/|\/)/, "");
      const fileDir = file?.path ? path.dirname(file.path) : process.cwd();

      const possiblePaths = [
        path.join(process.cwd(), "content", cleanSrc),
        path.resolve(fileDir, cleanSrc),
        path.join(process.cwd(), "static", cleanSrc),
      ];

      let assetPath: string | null = null;
      for (const p of possiblePaths) {
        if (fs.existsSync(p)) {
          assetPath = p;
          break;
        }
      }

      if (assetPath) {
        try {
          const dimensions = imageSize(assetPath);
          if (dimensions?.width && dimensions?.height) {
            node.properties.width = dimensions.width;
            node.properties.height = dimensions.height;
          }
        } catch (e) {
          console.error(`Could not read dimensions for: ${assetPath}`);
        }
      }
    });
  };
}

// Second function: Add  captions to images
function rehypeRichCaption() {
  return (tree: Root) => {
    visit(tree, "element", (node: any) => {
      if (node.tagName !== "figcaption") return;

      const pNode = node.children.find((child: any) => child.tagName === "p");
      const textNode = pNode ? pNode.children?.[0] : node.children?.[0];

      if (!textNode || textNode.type !== "text") return;

      const captionText = textNode.value.trim();
      if (!captionText) return;

      // Full MD parsing first
      try {
        const mdast = fromMarkdown(captionText);
        let hast = toHast(mdast);

        visit(hast, (n: any) => {
          if (n.type === "element" && n.tagName === "a") {
            n.properties = n.properties || {};
            n.properties.target = "_blank";
            n.properties.rel = "noreferrer noopener";
          }
        });

        if (pNode) {
          pNode.children = hast.type === "root" ? hast.children : [hast];
        } else {
          node.children = hast.type === "root" ? hast.children : [hast];
        }
        return;
      } catch (e) {
        // Fallback to raw URL linkify
        const urlRegex = /https?:\/\/[^\s<)]+/g;
        const matches = [...captionText.matchAll(urlRegex)];
        if (matches.length > 0) {
          const parts = captionText.split(urlRegex);
          const newChildren: any[] = [];

          parts.forEach((part: string, i: number) => {
            if (part) newChildren.push({ type: "text", value: part });
            if (matches[i]) {
              const url = matches[i][0];
              newChildren.push({
                type: "element",
                tagName: "a",
                properties: {
                  href: url,
                  target: "_blank",
                  rel: "noreferrer noopener",
                },
                children: [{ type: "text", value: url }],
              });
            }
          });

          if (pNode) pNode.children = newChildren;
          else node.children = newChildren;
        }
      }
    });
  };
}

export const RehypeFigure: QuartzTransformerPlugin = () => ({
  name: "rehypeFigureTitle",
  markdownPlugins() {
    return [remarkFigureCaption];
  },
  htmlPlugins() {
    return [
      [rehypeFigureTitle, {}],
      [rehypeImageDimensions, {}], // Placed before rich caption
      [rehypeRichCaption, {}],
    ];
  },
});

export default RehypeFigure;
