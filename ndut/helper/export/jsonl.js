const streaming = async function ({ input, model, params, filter, options = {} }) {
  const { _, getNdutConfig } = this.ndut.helper
  const { find } = this.ndutApi.helper
  const cfg = getNdutConfig('ndut-api')
  const batchSize = cfg.batchSize || 100
  let page = 1
  params.skip = 0
  params.limit = batchSize
  try {
    for (;;) {
      params.skip = (page - 1) * batchSize
      const { data } = await find({ model, params, filter, options })
      if (data.length === 0) break
      data.forEach(input.write)
      page++
    }
    input.end()
  } catch (err) {
    input.destroy(err)
  }
}

module.exports = async function ({ model, params, filter, options = {} }) {
  const { JSONStream } = this.ndut.helper
  const input = JSONStream.stringify(options.trueJson ? undefined : false)
  streaming.call(this, { input, model, params, filter })
  return input
}
