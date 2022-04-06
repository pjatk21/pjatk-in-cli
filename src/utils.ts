import { AltapiScheduleEntry } from './altapi'

export function entriesAsTable(entries: AltapiScheduleEntry[]) {
  console.table(
    Object.fromEntries(
      entries
        .sort()
        .map(({ begin, end, name, room, tutor, type }) => [
          begin.toLocaleString({ timeStyle: 'short' }) +
            ' - ' +
            end.toLocaleString({ timeStyle: 'short' }),
          { name, room, type, tutor },
        ])
    )
  )
}
