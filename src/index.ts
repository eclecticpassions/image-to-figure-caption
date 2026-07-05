import rehypeFigure from "@microflash/rehype-figure"
import type { QuartzTransformerPlugin } from "@quartz-community/types"

export const RehypeFigure: QuartzTransformerPlugin = () => ({
  name: "RehypeFigure",
  htmlPlugins() {
    return [[rehypeFigure, {}]]
  },
})

export default RehypeFigure