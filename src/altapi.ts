import { plainToClass, Transform, Type } from 'class-transformer'
import got, { Got } from 'got'
import { DateTime } from 'luxon'

export class AltapiGroups {
  groupsAvailable: string[]
}

export class AltapiScheduleEntry {
  name: string
  code: string
  type: string
  room: string
  groups: string[]
  tutor: string
  building: string

  @Type(() => DateTime)
  @Transform(({ value }) => DateTime.fromISO(value))
  begin: DateTime

  @Type(() => DateTime)
  @Transform(({ value }) => DateTime.fromISO(value))
  end: DateTime
}

export class AltapiSchedule {
  @Type(() => AltapiScheduleEntry)
  entries: AltapiScheduleEntry[]
}

export class AltapiClient {
  private readonly http: Got

  constructor() {
    this.http = got.extend({
      prefixUrl: 'https://altapi.kpostek.dev/v1/',
    })
  }

  async getGroups() {
    return plainToClass(
      AltapiGroups,
      await this.http.get('timetable/groups').json<unknown>()
    )
  }

  async getSchedule(groups: string[], begin: DateTime, end: DateTime) {
    const params = new URLSearchParams()
    params.set('from', begin.toISO())
    params.set('to', end.toISO())
    for (const group of groups) params.set('groups', group)
    return plainToClass(
      AltapiSchedule,
      await this.http
        .get('timetable/range', {
          searchParams: params,
        })
        .json<unknown>()
    )
  }
}
