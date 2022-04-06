#!/usr/bin/env node --no-warnings --experimental-specifier-resolution=node
import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'
import Conf from 'conf'
import prompts from 'prompts'
import 'reflect-metadata'
import { AltapiClient } from './altapi'
import { DateTime } from 'luxon'
import { entriesAsTable } from './utils'

interface ConfigSchema {
  groups: string[]
  apiService: string
  olaMode?: boolean
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
  .middleware(() => {
    if (config.get('olaMode')) console.log('✨Have a nice day Ola!✨')
  })
  .command(
    'init',
    'Initalize CLI tool',
    (y) => y.option('theOlaMode', { hidden: true, type: 'boolean' }),
    async ({ theOlaMode }) => {
      if (theOlaMode) config.set('olaMode', true)
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
    'now',
    'Get schedule for next 24h',
    (y) => y,
    async () => {
      const { entries } = await client.getSchedule(
        config.get('groups'),
        DateTime.now(),
        DateTime.now().plus({ day: 1 })
      )
      entriesAsTable(entries)
    }
  )
  .command(
    'today',
    'Get schedule for today',
    (y) => y,
    async () => {
      const { entries } = await client.getSchedule(
        config.get('groups'),
        DateTime.now().startOf('day'),
        DateTime.now().endOf('day')
      )
      entriesAsTable(entries)
    }
  )
  .command(
    'tomorrow',
    'Get schedule for tomorrow',
    (y) => y,
    async () => {
      const { entries } = await client.getSchedule(
        config.get('groups'),
        DateTime.now().plus({ day: 1 }).startOf('day'),
        DateTime.now().plus({ day: 1 }).endOf('day')
      )
      entriesAsTable(entries)
    }
  )
  .parse()
