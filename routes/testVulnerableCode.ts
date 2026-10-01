/*
 * Copyright (c) 2014-2026 Bjoern Kimminich & the OWASP Juice Shop contributors.
 * SPDX-License-Identifier: MIT
 */

import { exec } from 'child_process'
import { type Request, type Response } from 'express'

export function testVulnerableCode () {
  return (req: Request, res: Response) => {
    exec(`echo ${req.query.input}`, (error, stdout) => {
      if (error != null) {
        res.status(500).send(error.message)
        return
      }
      res.send(stdout)
    })
  }
}
