import { loadQuartzConfig, loadQuartzLayout } from "./quartz/plugins/loader/config-loader"
import { FoldHeaders } from "./quartz/plugins/transformers"

const config = await loadQuartzConfig()

config.plugins.transformers.unshift(FoldHeaders())
export default config
export const layout = await loadQuartzLayout()
