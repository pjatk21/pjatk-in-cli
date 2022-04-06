import { plainToClass } from 'class-transformer'
import got, { Got } from 'got'

export class AltapiGroups {
  groupsAvailable: string[]
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
}
