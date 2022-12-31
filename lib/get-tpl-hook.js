const path = require('path')

module.exports = function (model, single) {
  const { _, getNdutConfig, aneka, fs } = this.ndut.helper
  const { pascalCase } = aneka
  const schema = _.find(this.ndutDb.schemas, { name: model })
  let base = pascalCase(path.parse(schema.file).name)
  if (single) base += 'Single'
  const opts = getNdutConfig(schema.ndut)
  const optsApp = getNdutConfig('app')
  let tpl = `${optsApp.dir}/ndutApi/export-tpl/override/${base}.xlsx`
  if (!fs.existsSync(tpl)) tpl = `${opts.dir}/ndutApi/export-tpl/${base}.xlsx`
  if (!fs.existsSync(tpl)) tpl = null
  let hook = `${optsApp.dir}/ndutApi/export-hook/override/${base}.js`
  if (!fs.existsSync(hook)) hook = `${opts.dir}/ndutApi/export-hook/${base}.js`
  if (!fs.existsSync(hook)) hook = null
  return { tpl, hook }
}