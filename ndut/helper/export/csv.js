const getTplHook = require('../../../lib/get-tpl-hook')

const streaming = async function ({ input, model, params, filter, options = {}, hook }) {
  const { _, getNdutConfig } = this.ndut.helper
  const { find } = this.ndutApi.helper
  const cfg = getNdutConfig('ndut-api')
  const batchSize = cfg.batchSize || 100
  let page = 1
  params.skip = 0
  params.limit = batchSize
  for (;;) {
    params.skip = (page - 1) * batchSize
    let { data } = await find({ model, params, filter, options })
    if (hook) data = await hook.call(this, { model, params, filter, options, data })
    if (data.length === 0) break
    data.forEach(input.write)
    page++
  }
  input.end()
}

const buildStream = function () {
  const { through } = this.ndut.helper
  let stream
  stream = through(
    function (data) {
      stream.queue(data)
    },
    function (data) {
      stream.queue(null)
    }
  )
  return stream
}

module.exports = async function ({ model, params, filter, options = {} }) {
  const { scramjet } = this.ndut.helper
  const { DataStream } = scramjet
  const { hook } = getTplHook.call(this, model)
  const input = buildStream.call(this)
  streaming.call(this, { input, model, params, filter, hook })
  const writer = buildStream.call(this)
  DataStream
    .from(input)
    .CSVStringify()
    .pipe(writer)
  return writer
}
