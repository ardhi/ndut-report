const XlsxTemplate = require('xlsx-template')
const getTplHook = require('../../../../lib/get-tpl-hook')

const createDefTpl = async function ({ model, columns }) {
  const { getConfig, getNdutConfig, fs, _ } = this.ndut.helper
  const { generateId } = this.ndutDb.helper
  const config = getConfig()
  const table = this.ndutDb.model[model]
  const opts = getNdutConfig('ndutApi')
  const file = `${opts.dir}/lib/export-tpl-single.xlsx`
  const data = await fs.readFile(file)
  const content = new XlsxTemplate(data)
  let fields = _.keys(table.definition.properties)
  let dataValue = _.map(fields, c => ('${data.' + c + '}'))
  if (!_.isEmpty(columns)) {
    const columnsValue = _.map(columns, 'value')
    dataValue = _.map(columnsValue, c => ('${data.' + c + '}'))
    fields = _.map(columns, 'label')
  }
  const records = _.map(fields, (f, idx) => {
    return { key: f, value: dataValue[idx] }
  })
  const values = { data: records }
  content.substitute(1, values)
  const xlsx = content.generate()
  const dest = `${config.dir.tmp}/${generateId()}.xlsx`
  await fs.writeFile(dest, xlsx, 'binary')
  return dest
}

module.exports = async function ({ model, params, filter, options = {} }) {
  const { fs } = this.ndut.helper
  const { findOne } = this.ndutApi.helper

  let { tpl, hook } = getTplHook.call(this, model, true)
  if (!tpl) {
    tpl = await createDefTpl.call(this, { model, columns: options.columns || [] })
    options.columns = null
  }
  options.noThrow = true
  const tplData = await fs.readFile(tpl)
  const content = new XlsxTemplate(tplData)
  const result = await findOne({ model, params, filter, options })
  let data = (result || {}).data || {}
  if (hook) {
    const mod = require(hook)
    data = await mod.call(this, { model, params, filter, options, data })
  }
  const values = { data }
  content.substitute(1, values)
  return content.generate({ type: 'nodebuffer' })
}
