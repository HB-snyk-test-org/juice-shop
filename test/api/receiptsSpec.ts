/*
 * Copyright (c) 2014-2026 Bjoern Kimminich & the OWASP Juice Shop contributors.
 * SPDX-License-Identifier: MIT
 */

import * as frisby from 'frisby'
import { expect } from '@jest/globals'
import config from 'config'
import path from 'node:path'
import fs from 'node:fs'

const jsonHeader = { 'content-type': 'application/json' }
const URL = 'http://localhost:3000'
const REST_URL = `${URL}/rest`

function loginAs (email: string, password: string) {
  return frisby.post(`${REST_URL}/user/login`, {
    headers: jsonHeader,
    body: { email, password }
  }).expect('status', 200).then(({ json }) => json.authentication.token as string)
}

describe('/rest/receipts', () => {
  it('GET receipts is forbidden for anonymous user', () => {
    return frisby.get(`${REST_URL}/receipts`)
      .expect('status', 401)
  })

  it('POST receipts upload is forbidden for anonymous user', () => {
    const file = path.resolve(__dirname, '../files/validReceipts.zip')
    const form = frisby.formData()
    form.append('file', fs.createReadStream(file) as unknown as Blob)

    return frisby.post(`${REST_URL}/receipts/upload`, {
      // @ts-expect-error FIXME form.getHeaders() is not found
      headers: { 'Content-Type': form.getHeaders()['content-type'] },
      body: form
    })
      .expect('status', 401)
  })

  it('POST receipts upload with no file is rejected', () => {
    return loginAs(`jim@${config.get<string>('application.domain')}`, 'ncc-1701')
      .then((token) => {
        return frisby.post(`${REST_URL}/receipts/upload`, {
          headers: { Authorization: `Bearer ${token}` }
        })
          .expect('status', 400)
          .expect('json', { error: 'File is not passed' })
      })
  })

  it('POST receipts upload rejects a non-ZIP file', () => {
    const file = path.resolve(__dirname, '../files/validProfileImage.jpg')
    const form = frisby.formData()
    form.append('file', fs.createReadStream(file) as unknown as Blob)

    return loginAs(`jim@${config.get<string>('application.domain')}`, 'ncc-1701')
      .then((token) => {
        return frisby.post(`${REST_URL}/receipts/upload`, {
          headers: {
            Authorization: `Bearer ${token}`,
            // @ts-expect-error FIXME form.getHeaders() is not found
            'Content-Type': form.getHeaders()['content-type']
          },
          body: form
        })
          .expect('status', 415)
      })
  })

  it('POST receipts upload extracts image entries into the uploading user\'s own folder and GET reflects them', () => {
    const file = path.resolve(__dirname, '../files/validReceipts.zip')

    return loginAs(`jim@${config.get<string>('application.domain')}`, 'ncc-1701')
      .then((token) => {
        const form = frisby.formData()
        form.append('file', fs.createReadStream(file) as unknown as Blob)

        return frisby.post(`${REST_URL}/receipts/upload`, {
          headers: {
            Authorization: `Bearer ${token}`,
            // @ts-expect-error FIXME form.getHeaders() is not found
            'Content-Type': form.getHeaders()['content-type']
          },
          body: form
        })
          .expect('status', 200)
          .then(({ json }) => {
            expect(json.data.extracted.sort()).toEqual(['receipt1.jpg', 'receipt2.jpg', 'receipt3.jpg'])

            return frisby.get(`${REST_URL}/receipts`, {
              headers: { Authorization: `Bearer ${token}` }
            })
              .expect('status', 200)
              .then(({ json: listJson }) => {
                const filenames = listJson.data.map((receipt: { filename: string }) => receipt.filename).sort()
                expect(filenames).toEqual(['receipt1.jpg', 'receipt2.jpg', 'receipt3.jpg'])

                return frisby.get(`${URL}${listJson.data[0].url}`, {
                  headers: { Authorization: `Bearer ${token}` }
                })
                  .expect('status', 200)
              })
          })
      })
  })

  it('does not let one user see or fetch another user\'s receipts', () => {
    return loginAs(`bender@${config.get<string>('application.domain')}`, 'OhG0dPlease1nsertLiquor!')
      .then((token) => {
        return frisby.get(`${REST_URL}/receipts`, {
          headers: { Authorization: `Bearer ${token}` }
        })
          .expect('status', 200)
          .then(({ json }) => {
            expect(json.data).toEqual([])

            return frisby.get(`${REST_URL}/receipts/file/receipt1.jpg`, {
              headers: { Authorization: `Bearer ${token}` }
            })
              .expect('status', 404)
          })
      })
  })
})
