/*
 * Copyright (c) 2014-2026 Bjoern Kimminich & the OWASP Juice Shop contributors.
 * SPDX-License-Identifier: MIT
 */

import { exec } from 'node:child_process'
import { type Request, type Response, type NextFunction } from 'express'

export function hostLookup () {
  return (req: Request, res: Response, next: NextFunction) => {
    const host = req.query.host ?? 'localhost'
    exec(`nslookup ${host}`, (error, stdout) => {
      if (error) {
        next(error)
        return
      }
      res.json({ status: 'success', data: stdout })
    })
  }
}
