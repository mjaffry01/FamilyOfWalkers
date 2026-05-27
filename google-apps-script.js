/**
 * Family of Walkers — Google Apps Script Backend
 * ================================================
 * SETUP (one time):
 * 1. Open your Google Sheet → Extensions → Apps Script
 * 2. Replace ALL code with this → Save
 * 3. Deploy → New deployment → Web app
 *    Execute as: Me  |  Who has access: Anyone
 * 4. Copy the /exec URL
 */

const SHEET_NAME = 'Walks'

function getSheet() {
  const ss  = SpreadsheetApp.getActiveSpreadsheet()
  let sheet = ss.getSheetByName(SHEET_NAME)
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME)
    sheet.appendRow(['date','family','name','steps','water','km','cal','timestamp'])
    sheet.setFrozenRows(1)
    sheet.getRange(1,1,1,8)
      .setBackground('#0f2027')
      .setFontColor('#f0c040')
      .setFontWeight('bold')
  }
  return sheet
}

// ── CORS headers ──────────────────────────────────────
function corsResponse(data) {
  const output = ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON)
  return output
}

// ── Handle GET requests ───────────────────────────────
function doGet(e) {
  const action = (e.parameter.action || '').trim()
  let result

  if (action === 'sync') {
    result = handleSync(e.parameter)
  } else if (action === 'board') {
    result = handleBoard(e.parameter)
  } else {
    result = { status: 'ok', message: 'Family Walkers API running ✅' }
  }

  return corsResponse(result)
}

// ── Handle OPTIONS preflight ──────────────────────────
function doOptions(e) {
  return corsResponse({ status: 'ok' })
}

// ── Sync: save / update a walk entry ─────────────────
function handleSync(p) {
  try {
    const sheet  = getSheet()
    const data   = sheet.getDataRange().getValues()
    const today  = p.date   || todayStr()
    const family = (p.family || '').toLowerCase().trim()
    const name   = (p.name  || '').trim()

    let rowIdx = -1
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][0]) === today &&
          String(data[i][1]).toLowerCase() === family &&
          String(data[i][2]).toLowerCase() === name.toLowerCase()) {
        rowIdx = i + 1
        break
      }
    }

    const row = [
      today, family, name,
      parseInt(p.steps)  || 0,
      parseInt(p.water)  || 0,
      parseFloat(p.km)   || 0,
      parseInt(p.cal)    || 0,
      new Date().toISOString()
    ]

    if (rowIdx > 0) {
      sheet.getRange(rowIdx, 1, 1, 8).setValues([row])
    } else {
      sheet.appendRow(row)
    }

    return { status: 'ok' }
  } catch(e) {
    return { status: 'error', message: e.toString() }
  }
}

// ── Board: return today's rankings for a family ───────
function handleBoard(p) {
  try {
    const sheet  = getSheet()
    const data   = sheet.getDataRange().getValues()
    const today  = p.date   || todayStr()
    const family = (p.family || '').toLowerCase().trim()
    const rows   = []

    for (let i = 1; i < data.length; i++) {
      if (String(data[i][0]) === today &&
          String(data[i][1]).toLowerCase() === family) {
        rows.push({
          name:  data[i][2],
          steps: Number(data[i][3]) || 0,
          water: Number(data[i][4]) || 0,
          km:    Number(data[i][5]) || 0,
          cal:   Number(data[i][6]) || 0,
        })
      }
    }

    return rows
  } catch(e) {
    return []
  }
}

function todayStr() {
  return Utilities.formatDate(
    new Date(),
    Session.getScriptTimeZone(),
    'yyyy-MM-dd'
  )
}
