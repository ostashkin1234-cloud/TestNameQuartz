import type { QuartzTransformerPlugin } from "../types"

export const FoldHeaders: QuartzTransformerPlugin = () => ({
  name: "FoldHeaders",

  textTransform(_ctx, src) {
    let fenceChar: string | undefined
    let fenceLength = 0

    return src.split(/\r?\n/).map((line) => {
      const fence = line.match(/^\s{0,3}(`{3,}|~{3,})/)

      if (fence) {
        const marker = fence[1]

        if (!fenceChar) {
          fenceChar = marker[0]
          fenceLength = marker.length
        } else if (
          marker[0] === fenceChar &&
          marker.length >= fenceLength
        ) {
          fenceChar = undefined
          fenceLength = 0
        }

        return line
      }

      if (fenceChar) return line

      return line.replace(
        /^(#{1,6}[ \t]+.*?)[ \t]+%%[ \t]*fold[ \t]*%%[ \t]*$/,
        '$1 <span class="quartz-fold-marker"></span>',
      )
    }).join("\n")
  },

  externalResources() {
    return {
      js: [{
        loadTime: "afterDOMReady",
        contentType: "inline",
        script: `
          (() => {
  let folds = []

  const applyVisibility = () => {
    const managed = new Set()
    const hidden = new Set()

    folds.forEach((fold) => {
      fold.blocks.forEach((block) => {
        managed.add(block)

        if (fold.button.getAttribute("aria-expanded") !== "true") {
          hidden.add(block)
        }
      })
    })

    managed.forEach((block) => {
      block.hidden = hidden.has(block)
    })
  }

  const init = () => {
    const headings = Array.from(
      document.querySelectorAll("h1, h2, h3, h4, h5, h6")
    )

    headings.forEach((heading) => {
      const marker = heading.querySelector(".quartz-fold-marker")

      if (!marker || heading.dataset.quartzFoldReady === "true") return

      marker.remove()
      heading.dataset.quartzFold = "true"
      heading.dataset.quartzFoldReady = "true"

      const button = document.createElement("button")
      button.type = "button"
      button.textContent = "▸"
      button.setAttribute("aria-expanded", "false")
      button.setAttribute("aria-label", "Раскрыть раздел")
      button.style.cssText =
        "margin-right:.4em;padding:0;border:0;" +
        "background:transparent;color:var(--secondary);" +
        "font:inherit;cursor:pointer"

      heading.prepend(button)

      button.addEventListener("click", (event) => {
        event.preventDefault()
        event.stopPropagation()

        const expanded =
          button.getAttribute("aria-expanded") !== "true"

        button.setAttribute("aria-expanded", String(expanded))
        button.setAttribute(
          "aria-label",
          expanded ? "Свернуть раздел" : "Раскрыть раздел"
        )
        button.textContent = expanded ? "▾" : "▸"

        applyVisibility()
      })
    })

    folds = headings
      .filter((heading) => heading.dataset.quartzFold === "true")
      .map((heading) => {
        const level = Number(heading.tagName.slice(1))
        const button = heading.querySelector("button")
        const blocks = []
        let next = heading.nextElementSibling

        while (next) {
          const match = next.tagName.match(/^H([1-6])$/)

          if (match && Number(match[1]) <= level) break

          blocks.push(next)
          next = next.nextElementSibling
        }

        return { heading, button, blocks }
      })
      .filter((fold) => fold.button)

    applyVisibility()
  }

  document.addEventListener("nav", init)
  init()
})()
        `,
      }],
    }
  },
})
