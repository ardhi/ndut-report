const getTplHook = require('../../../../lib/get-tpl-hook')

const streaming = async function ({ input, model, params, filter, options = {}, hook }) {
  const { _ } = this.ndut.helper
  const { findOne } = this.ndutApi.helper
  let { data } = await findOne({ model, params, filter, options })
  if (hook) data = await hook.call(this, { model, params, filter, options, data })
  _.forOwn(data, (value, key) => {
    input.write({ key, value })
  })
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
  options.noThrow = true
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
