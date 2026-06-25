import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { Settings } from './settings';
import { AuthService } from '../../services/auth.service';
import { UserService } from '../../services/user-service';

describe('Settings', () => {
  let component: Settings;
  let fixture: ComponentFixture<Settings>;
  let mockAuthService: any;
  let mockUserService: any;

  beforeEach(async () => {
    mockAuthService = {
      currentUser: signal({ id: '1', name: 'Test', email: 'test@test.com', role: 'user' })
    };
    
    mockUserService = {
      getUserById: vi.fn().mockReturnValue(of({ settings: {} })),
      updateUser: vi.fn().mockReturnValue(of({}))
    };

    await TestBed.configureTestingModule({
      imports: [Settings],
      providers: [
        provideRouter([{path: '**', component: Settings}]),
        { provide: AuthService, useValue: mockAuthService },
        { provide: UserService, useValue: mockUserService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(Settings);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
