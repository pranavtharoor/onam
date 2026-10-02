import { event } from '../content'

const stamp = (iso: string) => new Date(iso).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
/** RFC 5545 text escaping. */
const esc = (t: string) => t.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n')
/** RFC 5545 line folding: at most 75 octets per line (UTF-8), never splitting a character. */
const fold = (line: string) => {
  const enc = new TextEncoder()
  const out: string[] = []
  let cur = '', bytes = 0
  for (const ch of line) {
    const n = enc.encode(ch).length
    if (bytes + n > (out.length ? 74 : 75)) { out.push(cur); cur = ''; bytes = 0 }
    cur += ch; bytes += n
  }
  out.push(cur)
  return out.join('\r\n ')
}

/** An .ics file for the event, as a data: URL (works on static hosting, no server). */
export function calendarHref(url: string) {
  const lines = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//onam-sadhya//invitation//EN', 'BEGIN:VEVENT',
    `UID:onam-sadhya-${stamp(event.startIST)}@invitation`,
    `DTSTAMP:${stamp(new Date().toISOString())}`,
    `DTSTART:${stamp(event.startIST)}`,
    `DTEND:${stamp(event.endIST)}`,
    `SUMMARY:${esc(`Onam at ${event.community}: celebrations and ${event.title}`)}`,
    `LOCATION:${esc([event.venue, ...event.addressLines].join(', '))}`,
    `DESCRIPTION:${esc([
      `A day of Onam celebrations at ${event.community}, ending in the Sadhya.`,
      '',
      ...event.schedule.map((s) => `${s.time}  ${s.name}${s.note ? ` (${s.note})` : ''}`),
      '',
      event.food,
      `Dress: ${event.dress}`,
      url,
    ].join('\n'))}`,
    'END:VEVENT', 'END:VCALENDAR',
  ]
  return 'data:text/calendar;charset=utf-8,' + encodeURIComponent(lines.map(fold).join('\r\n'))
}

/** Until the Google Form exists, RSVP opens this site in a new tab. */
export function rsvpHref() {
  return event.rsvpUrl ?? location.href.split('#')[0]!
}
