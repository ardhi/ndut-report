module.exports = async function ({ model, params, filter, options = {} }) {
  const { getConfig, fs } = this.ndut.helper
  const { exportSingleHtml } = this.ndutReport.helper
  const config = getConfig()
  const { generateId } = this.ndutDb.helper
  const data = await exportSingleHtml({ model, params, filter, options })
  const browser = await this.ndutHeadlessBrowser.puppeteer.launch()
  const page = await browser.newPage()
  const file = `${config.dir.tmp}/${generateId()}.pdf`
  await page.setContent(data)
  await page.pdf({ path: file, format: 'A4' })
  await browser.close()
  return await fs.createReadStream(file)
}
