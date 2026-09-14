/*
 * Copyright (c) 2014-2026 Bjoern Kimminich & the OWASP Juice Shop contributors.
 * SPDX-License-Identifier: MIT
 */

import { environment } from '../../environments/environment'
import { Injectable, inject } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { catchError, map } from 'rxjs/operators'

export interface Receipt {
  filename: string
  url: string
}

@Injectable({
  providedIn: 'root'
})
export class ReceiptsService {
  private readonly http = inject(HttpClient)

  private readonly hostServer = environment.hostServer
  private readonly host = this.hostServer + '/rest/receipts'

  get () {
    return this.http.get(this.host).pipe(map((response: any) => response.data), catchError((err: Error) => { throw err }))
  }

  upload (zip: File) {
    const postData = new FormData()
    postData.append('file', zip)
    return this.http.post(this.host + '/upload', postData).pipe(map((response: any) => response.data), catchError((err) => { throw err }))
  }
}
