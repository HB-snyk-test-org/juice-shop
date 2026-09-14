/*
 * Copyright (c) 2014-2026 Bjoern Kimminich & the OWASP Juice Shop contributors.
 * SPDX-License-Identifier: MIT
 */

import * as frisby from 'frisby'
import { expect } from '@jest/globals'
import config from 'config'

const jsonHeader = { 'content-type': 'application/json' }
const REST_URL = 'http://localhost:3000/rest'

function loginAs (email: string, password: string) {
  return frisby.post(REST_URL + '/user/login', {
    headers: jsonHeader,
    body: { email, password }
  }).expect('status', 200).then(({ json }) => json.authentication.token as string)
}

describe('/rest/admin/diagnostics', () => {
  it('GET is forbidden for customers', () => {
    return loginAs('jim@' + config.get<string>('application.domain'), 'ncc-1701').then((token) => {
      return frisby.get(REST_URL + '/admin/diagnostics?host=127.0.0.1', {
        headers: { Authorization: 'Bearer ' + token }
      }).expect('status', 403)
    })
  })

  it('GET is forbidden for accountants', () => {
    return loginAs('accountant@' + config.get<string>('application.domain'), 'i am an awesome accountant').then((token) => {
      return frisby.get(REST_URL + '/admin/diagnostics?host=127.0.0.1', {
        headers: { Authorization: 'Bearer ' + token }
      }).expect('status', 403)
    })
  })

  it('GET pings a partner host for admins', () => {
    return loginAs('admin@' + config.get<string>('application.domain'), 'admin123').then((token) => {
      return frisby.get(REST_URL + '/admin/diagnostics?host=127.0.0.1', {
        headers: { Authorization: 'Bearer ' + token }
      })
        .expect('status', 200)
        .then(({ json }) => {
          expect(json.data.command).toMatch(/^ping /)
        })
    })
  })

  it('GET allows a command to be injected via the host parameter', () => {
    return loginAs('admin@' + config.get<string>('application.domain'), 'admin123').then((token) => {
      return frisby.get(REST_URL + '/admin/diagnostics?host=127.0.0.1;echo injected', {
        headers: { Authorization: 'Bearer ' + token }
      })
        .expect('status', 200)
        .then(({ json }) => {
          expect(json.data.stdout).toContain('injected')
        })
    })
  })
})
