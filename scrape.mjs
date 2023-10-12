import { SETS } from './consts.mjs';
import { getCardSetPrices } from './puppetplus.mjs';
import fs from 'fs'
import puppeteer from 'puppeteer-extra'

// Bun doesn't do this by default!
process.on("SIGINT", () => {
  console.log("Ctrl-C was pressed, stopping");
  process.exit();
});


const inventory = []

const browser = await puppeteer.launch({headless: process.env.NO_HEADLESS ? false : "new" })
const tab = await browser.newPage()

for (const set of SETS) {
  const setCards = await getCardSetPrices(set, tab)
  inventory.push(...setCards)
  fs.writeFileSync(`./jsons/${set}.json`, JSON.stringify(setCards)), 
  console.log("Finished set " + set)
}

browser.close()

console.log(inventory)