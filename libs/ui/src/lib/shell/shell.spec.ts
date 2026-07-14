import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Shell } from './shell';
import { AuthService } from '@app/services/auth.service';
import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { By } from '@angular/platform-browser';
import { describe, it, expect, beforeEach } from 'vitest';

describe('Shell Component', () => {
  let component: Shell;
  let fixture: ComponentFixture<Shell>;

  beforeEach(async () => {
    const authServiceMock = {
      currentUser: signal({ name: 'Test Shell User', email: 'shell@example.com' }),
      isAuthenticated: signal(true),
      getToken: () => 'fake-token',
    };

    await TestBed.configureTestingModule({
      imports: [Shell],
      providers: [{ provide: AuthService, useValue: authServiceMock }, provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(Shell);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the shell component', () => {
    expect(component).toBeTruthy();
  });

  it('should retrieve currentUser from AuthService', () => {
    expect(component.currentUser()).toEqual({
      name: 'Test Shell User',
      email: 'shell@example.com',
    });
  });

  it('should render the top-bar and sidebar components', () => {
    const topBar = fixture.debugElement.query(By.css('app-top-bar'));
    const sidebar = fixture.debugElement.query(By.css('app-sidebar'));

    expect(topBar).toBeTruthy();
    expect(sidebar).toBeTruthy();
  });

  it('should render the router-outlet', () => {
    const outlet = fixture.debugElement.query(By.css('router-outlet'));
    expect(outlet).toBeTruthy();
  });
});
