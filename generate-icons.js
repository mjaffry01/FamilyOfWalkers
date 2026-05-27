/**
 * Generates icon-192.png and icon-512.png for the PWA
 * Run: node generate-icons.js
 */
const fs   = require('fs')
const zlib = require('zlib')

function crc32(buf) {
  const t = []
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1
    t[n] = c
  }
  let crc = 0xFFFFFFFF
  for (let i = 0; i < buf.length; i++) crc = (crc >>> 8) ^ t[(crc ^ buf[i]) & 0xFF]
  return (crc ^ 0xFFFFFFFF) >>> 0
}

function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length)
  const tb  = Buffer.from(type, 'ascii')
  const cv  = Buffer.alloc(4); cv.writeUInt32BE(crc32(Buffer.concat([tb, data])))
  return Buffer.concat([len, tb, data, cv])
}

function makePNG(size) {
  const rows = []
  for (let y = 0; y < size; y++) {
    const row = Buffer.alloc(size * 4 + 1)
    row[0] = 0
    for (let x = 0; x < size; x++) {
      const i = x * 4 + 1
      const cx = size / 2, cy = size / 2
      const rx = Math.abs(x - cx), ry = Math.abs(y - cy)
      const r  = size * 0.46
      // rounded rect background — dark navy
      const corner = size * 0.18
      const inRect = rx < r && ry < r && !(rx > r - corner && ry > r - corner)

      if (!inRect) { row[i+3] = 0; continue }

      row[i]   = 15   // R — #0f2027 bg
      row[i+1] = 32   // G
      row[i+2] = 39   // B
      row[i+3] = 255

      // Gold ring
      const dist = Math.sqrt((x-cx)**2 + (y-cy)**2)
      const ring = size * 0.38
      if (Math.abs(dist - ring) < size * 0.012) {
        row[i]=240; row[i+1]=192; row[i+2]=64; continue
      }

      // Green circle (walker symbol)
      if (dist < size * 0.28) {
        row[i]=46; row[i+1]=204; row[i+2]=113; continue
      }

      // Walker head dot
      const hdx = x - (cx + size*0.06), hdy = y - (cy - size*0.18)
      if (Math.sqrt(hdx**2 + hdy**2) < size * 0.07) {
        row[i]=240; row[i+1]=192; row[i+2]=64
      }
    }
    rows.push(row)
  }

  const raw  = Buffer.concat(rows)
  const comp = zlib.deflateSync(raw, { level: 9 })
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size,0); ihdr.writeUInt32BE(size,4)
  ihdr[8]=8; ihdr[9]=6; ihdr[10]=0; ihdr[11]=0; ihdr[12]=0

  return Buffer.concat([
    Buffer.from([137,80,78,71,13,10,26,10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', comp),
    chunk('IEND', Buffer.alloc(0))
  ])
}

fs.writeFileSync('public/icon-192.png', makePNG(192))
fs.writeFileSync('public/icon-512.png', makePNG(512))
console.log('✅  icon-192.png and icon-512.png generated in public/')
