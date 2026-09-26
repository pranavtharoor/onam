import { event } from '../content'

const stamp = (iso: string) => new Date(iso).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
/** RFC 5545 text escaping. */
const esc = (t: string) => t.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n')
/** RFC 5545 line folding (75 octets; approximated by characters). */
const fold = (line: string) => line.match(/.{1,73}/g)!.join('\r\n ')

/** An .ics file for the event, as a data: URL (works on static hosting, no server). */
export function calendarHref(url: string) {
  const lines = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//onam-sadhya//invitation//EN', 'BEGIN:VEVENT',
    `UID:onam-sadhya-${stamp(event.startIST)}@invitation`,
    `DTSTAMP:${stamp(new Date().toISOString())}`,
    `DTSTART:${stamp(event.startIST)}`,
    `DTEND:${stamp(event.endIST)}`,
    `SUMMARY:${esc(event.title)}`,
    `LOCATION:${esc([event.venue, ...event.addressLines].join(', '))}`,
    `DESCRIPTION:${esc(`${event.food} Dress: ${event.dress} ${url}`)}`,
    'END:VEVENT', 'END:VCALENDAR',
  ]
  return 'data:text/calendar;charset=utf-8,' + encodeURIComponent(lines.map(fold).join('\r\n'))
}

/** Until the Google Form exists, RSVP opens this site in a new tab. */
export function rsvpHref() {
  return event.rsvpUrl ?? location.href.split('#')[0]!
}
