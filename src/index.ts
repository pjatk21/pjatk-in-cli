#!/usr/bin/env node --no-warnings --experimental-specifier-resolution=node
import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'
import Conf from 'conf'
import prompts from 'prompts'
import 'reflect-metadata'
import { AltapiClient } from './altapi'
import { DateTime } from 'luxon'

interface ConfigSchema {
  groups: string[]
  apiService: string
}

const config = new Conf<ConfigSchema>({
  defaults: {
    apiService: 'https://altapi.kpostek.dev',
    groups: [],
  },
  configName: 'pjcli',
  projectName: 'pjatk-in-cli',
})

const client = new AltapiClient()

yargs(hideBin(process.argv))
  .command(
    'init',
    'Initalize CLI tool',
    (y) => y,
    async () => {
      const { groupsAvailable } = await client.getGroups()

      const r = await prompts({
        name: 'groups',
        type: 'autocompleteMultiselect',
        message: 'Zaznacz swoje grupy',
        choices: groupsAvailable.map((g) => ({
          title: g.replaceAll(' ', ''),
          value: g,
          selected: config.get('groups').includes(g),
        })),
      })
      config.set('groups', r.groups)
      console.log('Nowa konfiguracja', config.store)
    }
  )
  .command(
    'today',
    'Get schedule for next 24h',
    (y) => y,
    async () => {
      const { entries } = await client.getSchedule(
        config.get('groups'),
        DateTime.now(),
        DateTime.now().plus({ day: 1 })
      )
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
  )
  .parse()
