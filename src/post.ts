import { setFailed } from '@actions/core'
import { mkdirP, mv } from '@actions/io'

import { getVars } from './lib/getVars'
import { isErrorLike } from './lib/isErrorLike'
import { exec } from 'child_process'
import log from './lib/log'

async function post(): Promise<void> {
  try {
    await cleanupOrphanProcesses();
  } catch (error: unknown) {
    log.trace(error);
  }  

  for (let i = 0; i <= 5; i++) {
    try {
      const { cacheDir, targetPath, cachePath } = getVars()
  
      await mkdirP(cacheDir)
      await mv(targetPath, cachePath, { force: true })
      break;
    } catch (error: unknown) {
      log.trace(error)
      if (i < 5) {
        await delay(2000 * i);
        continue;
      }
      setFailed(isErrorLike(error) ? error.message : `unknown error: ${error}`)
    }
    console.log('post')
  }  
}

// Cleanup orphan processes in case one of them is holding on the cache directory
function cleanupOrphanProcesses() : Promise<void> {
  console.log("Cleaning up orphan processes...");

  var promise = new Promise<void>((resolve, reject) => {
    const command = `
    $user = [System.Security.Principal.WindowsIdentity]::GetCurrent().Name
    Get-Process | Where-Object { $_.Parent -eq $null -and $_.StartTime -gt (Get-Date).AddHours(-1) -and $_.UserName -eq $user } | ForEach-Object { Stop-Process -Id $_.Id -Force }
    `;

    exec(`powershell -Command "${command}"`, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error terminating processes: ${error.message}`);
            reject(error.message);
            return;
        }
        if (stderr) {
            console.error(`Stderr: ${stderr}`);
            reject(stderr);
            return;
        }
        console.log(`Stdout: ${stdout}`);
        resolve();
    });
  });

  return promise;
}

function delay(ms: number) : Promise<void> {
  return new Promise( resolve => setTimeout(resolve, ms) );
}

void post()
