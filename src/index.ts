import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'
import Conf from 'conf'
import prompts from 'prompts'
import 'reflect-metadata'
import { AltapiClient } from './altapi'

interface ConfigSchema {
  groups: string[]
  apiService: string
}

const config = new Conf<ConfigSchema>({
  defaults: {
    apiService: 'https://altapi.kpostek.dev',
    groups: [],
  },
  configName: 'altapi-cli',
})

yargs(hideBin(process.argv))
  .command(
    'init',
    'Initalize CLI tool',
    (y) => y,
    async () => {
      const client = new AltapiClient()
      const { groupsAvailable } = await client.getGroups()

      const r = await prompts({
        name: 'groups',
        type: 'autocompleteMultiselect',
        message: 'Zaznacz swoje grupy',
        choices: groupsAvailable.map((g) => ({
          title: g.replaceAll(' ', ''),
          value: g,
        })),
      })
      console.log(r)
    }
  )
  .parse()
