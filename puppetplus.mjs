import puppeteer from 'puppeteer-extra'
import stealth from 'puppeteer-extra-plugin-stealth'
import cheerio from 'cheerio'

puppeteer.use(stealth())

export const loadUrl =
  async (url, log = false, howLongToWait = 0, page) => {
    try {
      await page.goto(url)

      if (log) {
        console.log("waiting for " + url)
      }

      await page.waitForSelector("#brand-gamesDD", {
        timeout: 100000
      })
    }
    catch (e) {
      console.log(`${url} failed! ${e.message} - retrying after ${howLongToWait}...`)

      // poor man's sleep
      const end = Date.now() + howLongToWait;
      while (Date.now() < end);

      return loadUrl(url, log, (howLongToWait + 1000) * 4, page)
    }
    const html = await page.content()

    return cheerio.load(html);

  }

const processUrl = async (url, tab, setName) => {
  const $ = await loadUrl(url, true, 0, tab)

  const [thirty, seven, one] = $(".info-list-container").find('dt').filter((i, el) => $(el).text().includes('average price'))
    .next('dd')
    .map((i, el) => $(el).text())
    .get();

  const rarity = $("#tabContent-info > div > div.col-12.col-lg-6.mx-auto > div > div.info-list-container.col-12.col-md-8.col-lg-12.mx-auto.align-self-start > dl > dd:nth-child(2) > span").attr("data-original-title")

  if (!rarity) throw new Error("Rarity is null! Check what's up")

  return ({
    name: $("h1")[0].children[0].data,
    url,
    rarity,
    set: setName,
    scrapedAt: Date.now(),
    priceAvgs: {
      thirty,
      seven,
      one
    }
  })

}


export const getCardSetPrices = async (setName, tab, totalPages = 4) => {
  const baseUrl = `https://www.cardmarket.com/en/Pokemon/Products/Singles/${setName}`;
  const urls = []
  const cards = [];

  for (let page = 1; page <= totalPages; page++) {
    const $ = await loadUrl(`${baseUrl}?sortBy=price_desc&site=${page}`, true, 0, tab)
    Array.from($(".table-body .row a"))
      .map(
        (elem) => `https://www.cardmarket.com${elem.attribs["href"]}`
      ).filter(e => e.indexOf("Expansion") === -1)
      .forEach((e) => urls.push(e))
  }

  for (const url of urls) {
      const card = await processUrl(url, tab, setName)
      cards.push(card)

      // wait a while, good for the api rate limiter
      const end = Date.now() + 600;
      while (Date.now() < end);
  }

  return cards;
}
