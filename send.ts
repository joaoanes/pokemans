import fs from 'fs/promises';
import path from 'path';
import process from 'process';
import { authenticate } from '@google-cloud/local-auth';
import { google } from 'googleapis';

import { JSONClient } from 'google-auth-library/build/src/auth/googleauth'

import { getSetsFromArgsOrBreak } from './junkyard'
import { SETS } from './consts'

const spreadsheetId = '1aVbugDe6T18V9hHklRcKTCiZH-eJFrs5Ei8WLiwCAFA'

// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = path.join(process.cwd(), '/jsons/gapi/token.json');
const CREDENTIALS_PATH = path.join(process.cwd(), 'credentials.json');

async function loadSavedCredentialsIfExist() {
  try {
    const content = await fs.readFile(TOKEN_PATH)
    const credentials = JSON.parse(content.toString())
    return google.auth.fromJSON(credentials);
  } catch (err) {
    return null;
  }
}

async function saveCredentials(client) {
  const content = await fs.readFile(CREDENTIALS_PATH)
  const keys = JSON.parse(content.toString())
  const key = keys.installed || keys.web
  const payload = JSON.stringify({
    type: 'authorized_user',
    client_id: key.client_id,
    client_secret: key.client_secret,
    refresh_token: client.credentials.refresh_token,
  });
  await fs.writeFile(TOKEN_PATH, payload);
}

async function authorize() {
  let client : JSONClient | null = await loadSavedCredentialsIfExist();
  if (client !== null) {
    return client;
  }
  client = await authenticate({
    scopes: SCOPES,
    keyfilePath: CREDENTIALS_PATH,
  }) as JSONClient

  if (client !== null && client.credentials) {
    await saveCredentials(client);
  }
  return client;
}


async function uploadSets(auth) {
  
  const sheets = google.sheets({ version: 'v4', auth });

  const sheetData = await sheets.spreadsheets.get({ spreadsheetId })
	if (sheetData === null || sheetData.data?.sheets == null) {return}
  const sheetNamesInSpreadsheet = sheetData.data.sheets.map(f => f.properties?.title)

  const setsToUpload = getSetsFromArgsOrBreak(process.argv, SETS)

  for (const set of setsToUpload) {
    let content
    try {
      content = await fs.readFile(`./jsons/${set}.json`);
    }
    catch (e) {
      console.log(`Error on set ${set}, skipping`)
      continue  
    }
    const cards = JSON.parse(content);
    if (!sheetNamesInSpreadsheet.includes(set)) {
      console.log("Creating sheet for " + set)
      sheets.spreadsheets.batchUpdate(
        {
          spreadsheetId,
          requestBody: {
            requests: [
              {
                'addSheet': {
                  'properties': {
                    'title': set
                  }
                }
              }
            ],
          }
        })
    }

    const request = {
      spreadsheetId,
      range: set + '!A:A',
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'OVERWRITE',
      resource: {
        values: cards.map(card => ([card.name, card.priceAvgs.one, card.priceAvgs.seven, card.priceAvgs.thirty, card.scrapedAt, card.rarity]))
      }
    };

    const res = await sheets.spreadsheets.values.append(request);
    console.log(set, res.status)
  }
}



authorize().then(uploadSets).catch(console.error)

