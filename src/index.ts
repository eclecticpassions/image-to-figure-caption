import rehypeFigureTitle from "rehype-figure-title"
import type { QuartzTransformerPlugin } from "@quartz-community/types"

export const RehypeFigure: QuartzTransformerPlugin = () => ({
  name: "rehypeFigureTitle",
  htmlPlugins() {
    return [[rehypeFigureTitle, {}]]
  },
})

export default RehypeFigure