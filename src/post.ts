import { setFailed } from '@actions/core'
import { mkdirP, mv } from '@actions/io'

import { getVars } from './lib/getVars'
import { isErrorLike } from './lib/isErrorLike'
import log from './lib/log'

async function post(): Promise<void> {
  for (let i = 0; i <= 5; i++) {
    await delay(2000 * i)
    try {
      const { cacheDir, targetPath, cachePath } = getVars()
  
      await mkdirP(cacheDir)
      await mv(targetPath, cachePath, { force: true })
    } catch (error: unknown) {
      log.trace(error)
      if (i < 5) continue;
      setFailed(isErrorLike(error) ? error.message : `unknown error: ${error}`)
    }
    console.log('post')
  }  
}

function delay(ms: number) : Promise<void> {
  return new Promise( resolve => setTimeout(resolve, ms) );
}

void post()
