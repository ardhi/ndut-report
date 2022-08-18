const streaming = async function ({ input, model, params, filter, options = {} }) {
  const { _ } = this.ndut.helper
  const { findOne } = this.ndutApi.helper
  const { data } = await findOne({ model, params, filter, options })
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
  const input = buildStream.call(this)
  streaming.call(this, { input, model, params, filter })
  const writer = buildStream.call(this)
  DataStream
    .from(input)
    .CSVStringify()
    .pipe(writer)
  return writer
}
