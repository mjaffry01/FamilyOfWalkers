/**
 * Family of Walkers — Google Apps Script Backend
 * ================================================
 * SETUP (one time, 5 minutes):
 *
 * 1. Go to https://sheets.google.com → create a new blank sheet
 *    Name it "Family Walkers"
 *
 * 2. In the sheet, click Extensions → Apps Script
 *
 * 3. Delete everything in the editor and paste ALL of this code
 *
 * 4. Click Save (floppy disk icon)
 *
 * 5. Click Deploy → New deployment
 *    - Type: Web app
 *    - Execute as: Me
 *    - Who has access: Anyone
 *    → Click Deploy → Copy the Web App URL
 *
 * 6. Open the Family Walkers app → tap Sync → paste that URL → Save
 *
 * That's it! All family members' steps will appear in your Google Sheet.
 */

const SHEET_NAME = 'Walks'

function getSheet() {
  const ss    = SpreadsheetApp.getActiveSpreadsheet()
  let sheet   = ss.getSheetByName(SHEET_NAME)
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME)
    sheet.appendRow(['date','family','name','steps','water','km','cal','timestamp'])
    sheet.setFrozenRows(1)
    // Style header
    sheet.getRange(1,1,1,8).setBackground('#0f2027').setFontColor('#f0c040').setFontWeight('bold')
  }
  return sheet
}

// ── Handle all requests ───────────────────────────────
function doGet(e) {
  const action = e.parameter.action || ''
  let result

  if (action === 'sync') {
    result = handleSync(e.parameter)
  } else if (action === 'board') {
    result = handleBoard(e.parameter)
  } else {
    result = { status: 'ok', message: 'Family Walkers API running' }
  }

  return ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON)
}

// ── Sync: save / update a walk entry ─────────────────
function handleSync(p) {
  const sheet  = getSheet()
  const data   = sheet.getDataRange().getValues()
  const today  = p.date  || todayStr()
  const family = (p.family || '').toLowerCase().trim()
  const name   = (p.name  || '').trim()

  // Find existing row for this person today
  let rowIdx = -1
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === today &&
        String(data[i][1]).toLowerCase() === family &&
        String(data[i][2]).toLowerCase() === name.toLowerCase()) {
      rowIdx = i + 1  // 1-based sheet row
      break
    }
  }

  const row = [
    today, family, name,
    parseInt(p.steps) || 0,
    parseInt(p.water) || 0,
    parseFloat(p.km)  || 0,
    parseInt(p.cal)   || 0,
    new Date().toISOString()
  ]

  if (rowIdx > 0) {
    sheet.getRange(rowIdx, 1, 1, 8).setValues([row])
  } else {
    sheet.appendRow(row)
  }

  return { status: 'ok' }
}

// ── Board: return today's rankings for a family ───────
function handleBoard(p) {
  const sheet  = getSheet()
  const data   = sheet.getDataRange().getValues()
  const today  = p.date   || todayStr()
  const family = (p.family || '').toLowerCase().trim()
  const rows   = []

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === today &&
        String(data[i][1]).toLowerCase() === family) {
      rows.push({
        date:   data[i][0],
        family: data[i][1],
        name:   data[i][2],
        steps:  Number(data[i][3]) || 0,
        water:  Number(data[i][4]) || 0,
        km:     Number(data[i][5]) || 0,
        cal:    Number(data[i][6]) || 0,
      })
    }
  }

  return rows
}

function todayStr() {
  const d = new Date()
  return Utilities.formatDate(d, Session.getScriptTimeZone(), 'yyyy-MM-dd')
}
