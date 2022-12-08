module.exports = async function ({ model, params, filter, options = {} }) {
  const { getConfig, fs, getNdutConfig } = this.ndut.helper
  const { exportHtml } = this.ndutReport.helper
  const config = getConfig()
  const { generateId } = this.ndutDb.helper
  const data = await exportHtml({ model, params, filter, options })
  const cfg = getNdutConfig('ndutHeadlessBrowser')
  const browser = await this.ndutHeadlessBrowser.puppeteer.launch(cfg.launchOptions)
  const page = await browser.newPage()
  const file = `${config.dir.tmp}/${generateId()}.pdf`
  await page.setContent(data)
  await page.pdf({ path: file, format: 'A4' })
  await browser.close()
  return await fs.createReadStream(file)
}
