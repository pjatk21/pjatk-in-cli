#!/usr/bin/env node --disable-proto=delete --no-warnings --experimental-specifier-resolution=node
import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'
import Conf from 'conf'
import prompts from 'prompts'
import 'reflect-metadata'
import { AltapiClient } from './altapi'
import { DateTime } from 'luxon'
import { entriesAsTable } from './utils'
import chalk from 'chalk'
import { version } from '../package.json'

interface ConfigSchema {
  groups: string[]
  olaMode?: boolean
}

const config = new Conf<ConfigSchema>({
  defaults: {
    groups: [],
  },
  configName: 'pjcli',
  projectName: 'pjatk-in-cli',
})

const client = new AltapiClient()

// middlewares

function hasGroupsConfigured() {
  if (config.get('groups').length === 0)
    throw new Error(`No groups set! Use pjcli init to configure them.`)
}

const parser = yargs(hideBin(process.argv))
  .version(version)
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
      console.log('Nowa konfiguracja', { ...config.store }, config.path)
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
    },
    [hasGroupsConfigured]
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
    },
    [hasGroupsConfigured]
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
    },
    [hasGroupsConfigured]
  )
  .command(
    'next',
    'Prints overall status',
    (y) => y,
    async () => {
      const { entries } = await client.getSchedule(
        config.get('groups'),
        DateTime.now(),
        DateTime.now().endOf('day')
      )
      console.log(`Pozostało ${chalk.bold(entries.length)} zajęć`)
      if (entries[0]) {
        const ne = entries[0]
        console.log(
          `Kolejne zajęcia to ${chalk.bold(ne.code)} (${chalk.bold(
            ne.type === 'Wykład'
              ? chalk.bgGreenBright(ne.type)
              : chalk.bgBlueBright(ne.type + ` w sali ${ne.room}`)
          )}) za ${ne.begin
            .diffNow()
            .shiftTo('hours', 'minutes', 'seconds')
            .toHuman()}`
        )
      }
    },
    [hasGroupsConfigured]
  )
  .fail(false)

try {
  await parser.parse()
} catch (e) {
  if (e instanceof Error) console.log(e.name, '->', chalk.red(e.message))
}
