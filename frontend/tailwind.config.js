import fs from "node:fs"
import path from "node:path"
import plugin from "tailwindcss/plugin"

function parseJsonc(source) {
  const withoutBlocks = source.replace(/\/\*[\s\S]*?\*\//g, "")
  const withoutLines = withoutBlocks.replace(/(^|[^:])\/\/.*$/gm, "$1")
  return JSON.parse(withoutLines)
}

const designSystemPath = path.resolve(process.cwd(), "..", "design_system.jsonc")
const designSystem = parseJsonc(fs.readFileSync(designSystemPath, "utf8"))

const bodyFont = designSystem.typography.body.family.split(",").map((part) => part.trim())
const headerFont = designSystem.typography.header.family.split(",").map((part) => part.trim())

/** @type {import("tailwindcss").Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          pink: designSystem.colors.brand.pink,
          blue: designSystem.colors.brand.blue,
          babyPink: designSystem.colors.brand.babyPink,
        },
        signal: {
          critical: designSystem.colors.signals.critical,
          warning: designSystem.colors.signals.warning,
          good: designSystem.colors.signals.good,
        },
        dataViz: {
          primary: designSystem.colors.dataViz.primary,
          highlight: designSystem.colors.dataViz.highlight,
        },
        text: {
          primary: designSystem.colors.text.primary,
          secondary: designSystem.colors.text.secondary,
        },
      },
      fontFamily: {
        sans: [...bodyFont, "ui-sans-serif", "system-ui", "sans-serif"],
        heading: [...headerFont, "ui-sans-serif", "system-ui", "sans-serif"],
      },
      fontSize: {
        "display-dashboard": designSystem.typography.header.sizes.title,
        "section-title": designSystem.typography.header.sizes.section,
        metric: designSystem.typography.body.sizes.metric,
        label: designSystem.typography.body.sizes.label,
        content: designSystem.typography.body.sizes.content,
      },
      spacing: {
        "screen-margin": designSystem.spacing.layout.screen_margin,
        "card-gap": designSystem.spacing.layout.card_gap,
        "card-padding": designSystem.spacing.containers.card_padding,
        "section-gap": designSystem.spacing.containers.section_gap,
        "element-stack": designSystem.spacing.containers.element_stack,
      },
      borderRadius: {
        glass: designSystem.surfaces.glassCard.radius,
      },
      boxShadow: {
        glass: designSystem.surfaces.glassCard.shadow,
      },
      backdropBlur: {
        glass: designSystem.surfaces.glassCard.backdropBlur,
      },
      backgroundImage: {
        "app-mesh": designSystem.surfaces.appBackground,
      },
    },
  },
  plugins: [
    plugin(({ addBase }) => {
      addBase({
        ":root": {
          "--ds-color-brand-pink": designSystem.colors.brand.pink,
          "--ds-color-brand-blue": designSystem.colors.brand.blue,
          "--ds-color-brand-baby-pink": designSystem.colors.brand.babyPink,
          "--ds-color-signal-critical": designSystem.colors.signals.critical,
          "--ds-color-signal-warning": designSystem.colors.signals.warning,
          "--ds-color-signal-good": designSystem.colors.signals.good,
          "--ds-color-data-viz-primary": designSystem.colors.dataViz.primary,
          "--ds-color-data-viz-highlight": designSystem.colors.dataViz.highlight,
          "--ds-color-text-primary": designSystem.colors.text.primary,
          "--ds-color-text-secondary": designSystem.colors.text.secondary,
          "--ds-surface-glass-background": designSystem.surfaces.glassCard.background,
          "--ds-surface-glass-backdrop-blur": designSystem.surfaces.glassCard.backdropBlur,
          "--ds-surface-glass-border": designSystem.surfaces.glassCard.border,
          "--ds-surface-glass-shadow": designSystem.surfaces.glassCard.shadow,
          "--ds-surface-glass-radius": designSystem.surfaces.glassCard.radius,
          "--ds-surface-app-background": designSystem.surfaces.appBackground,
          "--ds-component-map-region-border": designSystem.components.map.regionBorder,
          "--ds-component-map-fill-opacity": `${designSystem.components.map.fillOpacity}`,
          "--ds-component-chart-axis-color": designSystem.components.charts.axisColor,
          "--ds-spacing-screen-margin": designSystem.spacing.layout.screen_margin,
          "--ds-spacing-card-gap": designSystem.spacing.layout.card_gap,
          "--ds-spacing-card-padding": designSystem.spacing.containers.card_padding,
          "--ds-spacing-section-gap": designSystem.spacing.containers.section_gap,
          "--ds-spacing-element-stack": designSystem.spacing.containers.element_stack,
        },
      })
    }),
  ],
}
