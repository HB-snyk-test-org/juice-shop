/*
 * Copyright (c) 2014-2026 Bjoern Kimminich & the OWASP Juice Shop contributors.
 * SPDX-License-Identifier: MIT
 */

import fs from 'node:fs/promises'
import path from 'node:path'
import unzipper from 'unzipper'
import { type Request, type Response, type NextFunction } from 'express'

import * as security from '../lib/insecurity'

const ALLOWED_IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'])

function receiptsDirFor (userId: number | string) {
  return path.resolve('uploads/receipts', String(userId))
}

export function uploadReceipts () {
  return async (req: Request, res: Response, next: NextFunction) => {
    const file = req.file
    if (file?.buffer == null) {
      res.status(400).json({ error: 'File is not passed' })
      return
    }
    if (!file.originalname.toLowerCase().endsWith('.zip')) {
      res.status(415).json({ error: 'Only ZIP archives are accepted for receipt uploads' })
      return
    }

    let archive
    try {
      archive = await unzipper.Open.buffer(file.buffer)
    } catch (err) {
      res.status(400).json({ error: 'Uploaded file is not a valid ZIP archive' })
      return
    }

    const targetDir = receiptsDirFor(req.body.UserId)
    await fs.mkdir(targetDir, { recursive: true })

    const extracted: string[] = []
    try {
      for (const entry of archive.files) {
        if (entry.path.endsWith('/')) {
          // Directory entry, nothing to extract
          continue
        }
        const extension = path.extname(entry.path).toLowerCase()
        if (!ALLOWED_IMAGE_EXTENSIONS.has(extension)) {
          continue
        }

        const safeName = security.sanitizeFilename(path.basename(entry.path))
        if (!safeName) {
          continue
        }
        const destination = path.join(targetDir, safeName)
        if (path.dirname(destination) !== targetDir) {
          // Guards against zip-slip style paths escaping the user's receipts folder
          continue
        }

        const content = await entry.buffer()
        await fs.writeFile(destination, content)
        extracted.push(safeName)
      }
    } catch (err) {
      next(err)
      return
    }

    res.status(200).json({ status: 'success', data: { extracted } })
  }
}

export function getReceipts () {
  return async (req: Request, res: Response, next: NextFunction) => {
    const targetDir = receiptsDirFor(req.body.UserId)
    let filenames: string[] = []
    try {
      filenames = await fs.readdir(targetDir)
    } catch (err) {
      filenames = []
    }
    const receipts = filenames
      .filter((filename) => ALLOWED_IMAGE_EXTENSIONS.has(path.extname(filename).toLowerCase()))
      .map((filename) => ({ filename, url: `/rest/receipts/file/${encodeURIComponent(filename)}` }))
    res.status(200).json({ status: 'success', data: receipts })
  }
}

export function getReceiptFile () {
  return async (req: Request, res: Response, next: NextFunction) => {
    const targetDir = receiptsDirFor(req.body.UserId)
    const safeName = security.sanitizeFilename(path.basename(req.params.filename))
    const filePath = path.join(targetDir, safeName)
    if (path.dirname(filePath) !== targetDir) {
      res.status(404).end()
      return
    }
    res.sendFile(filePath, (err) => {
      if (err) {
        res.status(404).end()
      }
    })
  }
}
