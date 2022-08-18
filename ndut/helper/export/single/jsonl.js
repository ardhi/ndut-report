module.exports = async function ({ model, params, filter, options = {} }) {
  const { findOne } = this.ndutApi.helper
  options.noThrow = true
  const { data } = await findOne({ model, params, filter, options })
  if (!data) return
  const input = JSON.stringify(data, null, 2)
  return input
}
