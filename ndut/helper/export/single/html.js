const XLSX = require('xlsx')

module.exports = async function ({ model, params, filter, options = {} }) {
  const { exportSingleXlsx } = this.ndutReport.helper
  const data = await exportSingleXlsx({ model, params, filter, options })
  const workbook = XLSX.read(data)
  const sheets = workbook.SheetNames
  const ws = workbook.Sheets[sheets[0]]
  const html = XLSX.utils.sheet_to_html(ws)
  return html
}
