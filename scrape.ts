mport { SETS } from './consts';
import { getCardSetPrices } from './puppetplus';
import { getSetsFromArgsOrBreak } from './junkyard'

import fs from 'fs'
import puppeteer from 'puppeteer-extra'

// Bun doesn't do this by default!
process.on("SIGINT", () => {
  console.log("Ctrl-C was pressed, stopping")
  process.exit(-1)
});


const inventory = []

const browser = await puppeteer.launch({headless: process.env.NO_HEADLESS ? false : "new", targetFilter: (target) => !!target.url, args: ["--disable-notifications", "--no-sandbox", "--window-size=1280,720", "--disable-dev-shm-usage"]})

const tab = (await browser.pages())[0]

await tab.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36")

const setsToScrape = getSetsFromArgsOrBreak(process.argv, SETS)

for (const set of setsToScrape) {
  const setCards = await getCardSetPrices(set, tab)
  inventory.push(...setCards)
  fs.writeFileSync(`./jsons/${set}.json`, JSON.stringify(setCards)), 
  console.log("Finished set " + set)
}

browser.close()

console.log(inventory)

