/*
 * Copyright (c) 2014-2026 Bjoern Kimminich & the OWASP Juice Shop contributors.
 * SPDX-License-Identifier: MIT
 */

import { TranslateModule, TranslateService } from '@ngx-translate/core'
import { provideHttpClientTesting } from '@angular/common/http/testing'
import { type ComponentFixture, fakeAsync, TestBed, waitForAsync } from '@angular/core/testing'
import { RouterTestingModule } from '@angular/router/testing'
import { MatCardModule } from '@angular/material/card'
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'
import { of } from 'rxjs'
import { throwError } from 'rxjs/internal/observable/throwError'
import { ReceiptsComponent } from './receipts.component'
import { ReceiptsService } from '../Services/receipts.service'
import { FormsModule, ReactiveFormsModule } from '@angular/forms'
import { MatIconModule } from '@angular/material/icon'
import { MatSnackBar } from '@angular/material/snack-bar'
import { EventEmitter } from '@angular/core'
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http'

describe('ReceiptsComponent', () => {
  let component: ReceiptsComponent
  let fixture: ComponentFixture<ReceiptsComponent>
  let receiptsService: any
  let snackBar: any
  let translateService

  beforeEach(waitForAsync(() => {
    receiptsService = jasmine.createSpyObj('ReceiptsService', ['get', 'upload'])
    receiptsService.get.and.returnValue(of([]))
    receiptsService.upload.and.returnValue(of({}))
    translateService = jasmine.createSpyObj('TranslateService', ['get'])
    translateService.get.and.returnValue(of({}))
    translateService.onLangChange = new EventEmitter()
    translateService.onTranslationChange = new EventEmitter()
    translateService.onDefaultLangChange = new EventEmitter()
    snackBar = jasmine.createSpyObj('MatSnackBar', ['open'])

    TestBed.configureTestingModule({
      imports: [RouterTestingModule,
        TranslateModule.forRoot(),
        BrowserAnimationsModule,
        MatCardModule,
        MatIconModule,
        FormsModule,
        ReactiveFormsModule,
        ReceiptsComponent],
      providers: [
        { provide: ReceiptsService, useValue: receiptsService },
        { provide: TranslateService, useValue: translateService },
        { provide: MatSnackBar, useValue: snackBar },
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting()
      ]
    })
      .compileComponents()
  }))

  beforeEach(() => {
    fixture = TestBed.createComponent(ReceiptsComponent)
    component = fixture.componentInstance
    component.ngOnInit()
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  it('should make emptyState true and hold no receipts when get API gives empty response', () => {
    receiptsService.get.and.returnValue(of([]))
    component.ngOnInit()
    expect(component.emptyState).toBe(true)
    expect(component.receipts).toEqual([])
  })

  it('should make emptyState false when get API gives non empty response', () => {
    receiptsService.get.and.returnValue(of([{ filename: 'receipt.jpg', url: '/rest/receipts/file/receipt.jpg' }]))
    component.ngOnInit()
    expect(component.emptyState).toBe(false)
  })

  it('should log error from get API call directly to browser console', fakeAsync(() => {
    receiptsService.get.and.returnValue(throwError('Error'))
    console.log = jasmine.createSpy('log')
    component.ngOnInit()
    fixture.detectChanges()
    expect(console.log).toHaveBeenCalledWith('Error')
  }))

  it('should not call upload API when no zip file was picked', () => {
    component.zipControl.setValue('')
    component.upload()
    expect(receiptsService.upload).not.toHaveBeenCalled()
  })

  it('should upload the picked zip file and refresh the receipts list', () => {
    spyOn(component, 'loadReceipts')
    spyOn(component, 'resetForm')
    component.zipControl.setValue(new File([''], 'receipts.zip'))
    component.upload()
    expect(receiptsService.upload).toHaveBeenCalled()
    expect(component.loadReceipts).toHaveBeenCalled()
    expect(component.resetForm).toHaveBeenCalled()
  })

  it('should log error from upload API call directly to browser console', fakeAsync(() => {
    receiptsService.upload.and.returnValue(throwError('Error'))
    console.log = jasmine.createSpy('log')
    component.zipControl.setValue(new File([''], 'receipts.zip'))
    component.upload()
    fixture.detectChanges()
    expect(console.log).toHaveBeenCalledWith('Error')
  }))

  it('should reinitialise the upload form by calling resetForm', () => {
    component.zipControl.setValue(new File([''], 'receipts.zip'))
    component.resetForm()
    expect(component.zipControl.value).toBe('')
    expect(component.zipControl.pristine).toBe(true)
    expect(component.zipControl.untouched).toBe(true)
  })
})
