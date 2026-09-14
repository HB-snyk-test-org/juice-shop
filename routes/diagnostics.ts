/*
 * Copyright (c) 2014-2026 Bjoern Kimminich & the OWASP Juice Shop contributors.
 * SPDX-License-Identifier: MIT
 */

import { type Request, type Response, type NextFunction } from 'express'
import { exec } from 'node:child_process'

import * as challengeUtils from '../lib/challengeUtils'
import { challenges } from '../data/datacache'

const shellMetacharacters = /[;&|`$()<>\n]/

export function partnerHostDiagnostics () {
  return (req: Request, res: Response, next: NextFunction) => {
    const host = req.query.host as string
    if (!host) {
      res.status(400).json({ error: 'host is required' })
      return
    }
    const tool = req.query.tool === 'traceroute' ? 'traceroute' : 'ping'
    const command = tool === 'traceroute' ? `traceroute ${host}` : `ping -c 4 ${host}`

    challengeUtils.solveIf(challenges.commandInjectionChallenge, () => shellMetacharacters.test(host))

    exec(command, (error, stdout, stderr) => {
      if (error && !stdout && !stderr) {
        next(error)
        return
      }
      res.status(200).json({ status: 'success', data: { command, stdout, stderr } })
    })
  }
}
