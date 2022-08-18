const path = require('path')
const XlsxTemplate = require('xlsx-template')

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
  const { getNdutConfig, _, fs, aneka } = this.ndut.helper
  const { pascalCase } = aneka
  const { findOne } = this.ndutApi.helper
  const schema = _.find(this.ndutDb.schemas, { name: model })
  const opts = getNdutConfig(schema.ndut)
  const optsApp = getNdutConfig('app')
  const base = path.parse(schema.file).name + '-single'
  let tpl = `${opts.dir}/ndutApi/export-tpl/${base}.xlsx`
  if (!fs.existsSync(tpl)) tpl = `${optsApp.dir}/ndutApi/export-tpl/override/${pascalCase(base + ' single')}.xlsx`
  if (!fs.existsSync(tpl)) {
    tpl = await createDefTpl.call(this, { model, columns: options.columns || [] })
    options.columns = null
  }
  options.noThrow = true
  const data = await fs.readFile(tpl)
  const content = new XlsxTemplate(data)
  const optsApi = getNdutConfig('ndut-api')
  const result = await findOne({ model, params, filter, options })
  const values = { data: (result || {}).data || {} }
  content.substitute(1, values)
  return content.generate({ type: 'nodebuffer' })
}
