const XlsxTemplate = require('xlsx-template')
const getTplHook = require('../../../lib/get-tpl-hook')

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
  const { getNdutConfig, _, fs } = this.ndut.helper
  const { find } = this.ndutApi.helper
  let { tpl, hook } = getTplHook.call(this, model)
  if (!tpl) {
    tpl = await createDefTpl.call(this, { model, columns: options.columns || [] })
    options.columns = null
  }
  const tplData = await fs.readFile(tpl)
  const content = new XlsxTemplate(tplData)
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
  if (hook) {
    const mod = require(hook)
    all = await mod.call(this, { model, params, filter, options, data: all })
  }
  const values = { data: all }
  content.substitute(1, values)
  return content.generate({ type: 'nodebuffer' })
}
