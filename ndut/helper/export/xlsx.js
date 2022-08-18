const path = require('path')
const XlsxTemplate = require('xlsx-template')

const createDefTpl = async function ({ model, columns }) {
  const { getConfig, getNdutConfig, fs, _ } = this.ndut.helper
  const { generateId } = this.ndutDb.helper
  const config = getConfig()
  const table = this.ndutDb.model[model]
  const opts = getNdutConfig('ndutApi')
  const file = `${opts.dir}/lib/export-tpl.xlsx`
  const data = await fs.readFile(file)
  const content = new XlsxTemplate(data)
  let fields = _.keys(table.definition.properties)
  let dataFields = _.map(fields, c => ('${table:data.' + c + '}'))
  if (!_.isEmpty(columns)) {
    const columnsValue = _.map(columns, 'value')
    dataFields = _.map(columnsValue, c => ('${table:data.' + c + '}'))
    fields = _.map(columns, 'label')
  }
  const values = { columns: fields, dataColumns: dataFields }
  content.substitute(1, values)
  const xlsx = content.generate()
  const dest = `${config.dir.tmp}/${generateId()}.xlsx`
  await fs.writeFile(dest, xlsx, 'binary')
  return dest
}

module.exports = async function ({ model, params, filter, options = {} }) {
  const { getNdutConfig, _, fs, aneka } = this.ndut.helper
  const { pascalCase } = aneka
  const { find } = this.ndutApi.helper
  const schema = _.find(this.ndutDb.schemas, { name: model })
  const opts = getNdutConfig(schema.ndut)
  const optsApp = getNdutConfig('app')
  const base = path.parse(schema.file).name
  let tpl = `${opts.dir}/ndutApi/export-tpl/${base}.xlsx`
  if (!fs.existsSync(tpl)) tpl = `${optsApp.dir}/ndutApi/export-tpl/override/${pascalCase(base)}.xlsx`
  if (!fs.existsSync(tpl)) {
    tpl = await createDefTpl.call(this, { model, columns: options.columns || [] })
    options.columns = null
  }
  const data = await fs.readFile(tpl)
  const content = new XlsxTemplate(data)
  const optsApi = getNdutConfig('ndut-api')
  const batchSize = optsApi.batchSize || 100
  let page = 1
  params.skip = 0
  params.limit = batchSize
  let all = []
  try {
    for (;;) {
      params.skip = (page - 1) * batchSize
      const { data } = await find({ model, params, filter, options })
      if (data.length === 0) break
      all = _.concat(all, data)
      page++
    }
  } catch (err) {
  }
  const values = { data: all }
  content.substitute(1, values)
  return content.generate({ type: 'nodebuffer' })
}
