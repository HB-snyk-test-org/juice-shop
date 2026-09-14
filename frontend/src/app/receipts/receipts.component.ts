/*
 * Copyright (c) 2014-2026 Bjoern Kimminich & the OWASP Juice Shop contributors.
 * SPDX-License-Identifier: MIT
 */

import { environment } from '../../environments/environment'
import { Component, type OnInit, inject } from '@angular/core'
import { UntypedFormControl, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms'
import { ReceiptsService, type Receipt } from '../Services/receipts.service'
import { SnackBarHelperService } from '../Services/snack-bar-helper.service'
import { catchError } from 'rxjs/operators'
import { EMPTY } from 'rxjs'
import { TranslateModule } from '@ngx-translate/core'
import { MatButtonModule } from '@angular/material/button'
import { MatIconModule } from '@angular/material/icon'
import { MatCardModule, MatCardTitle, MatCardContent } from '@angular/material/card'

@Component({
  selector: 'app-receipts',
  templateUrl: './receipts.component.html',
  styleUrls: ['./receipts.component.scss'],
  imports: [MatCardModule, MatCardTitle, MatCardContent, TranslateModule, FormsModule, ReactiveFormsModule, MatButtonModule, MatIconModule]
})
export class ReceiptsComponent implements OnInit {
  private readonly receiptsService = inject(ReceiptsService)
  private readonly snackBarHelperService = inject(SnackBarHelperService)

  public emptyState = true
  public receipts: Receipt[] = []
  public zipControl: UntypedFormControl = new UntypedFormControl('', [Validators.required])

  ngOnInit (): void {
    this.loadReceipts()
  }

  loadReceipts () {
    this.receiptsService.get().pipe(catchError((err) => {
      console.log(err)

      return EMPTY
    })).subscribe((receipts: Receipt[]) => {
      this.receipts = (receipts ?? []).map((receipt) => ({ ...receipt, url: environment.hostServer + receipt.url }))
      this.emptyState = this.receipts.length === 0
    })
  }

  onZipPicked (event: Event) {
    const file = (event.target as HTMLInputElement).files[0]
    this.zipControl.setValue(file)
    this.zipControl.updateValueAndValidity()
  }

  upload () {
    if (!(this.zipControl.value instanceof File)) {
      return
    }
    this.receiptsService.upload(this.zipControl.value).subscribe({
      next: () => {
        this.resetForm()
        this.loadReceipts()
        this.snackBarHelperService.open('RECEIPTS_UPLOAD_SUCCESS', 'confirmBar')
      },
      error: (err) => {
        this.snackBarHelperService.open(err.error?.error, 'errorBar')
        console.log(err)
      }
    })
  }

  resetForm () {
    this.zipControl.setValue('')
    this.zipControl.markAsPristine()
    this.zipControl.markAsUntouched()
  }
}
