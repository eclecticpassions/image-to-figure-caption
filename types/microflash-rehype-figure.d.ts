declare module "@microflash/rehype-figure" {
  import type { Plugin } from "unified"

  const rehypeFigure: Plugin<[{
    className?: string
  }] | []>
  export default rehypeFigure
}