import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Sidebar } from './sidebar';
import { ChatService } from '../../services/chat.service';
import { provideRouter, Router } from '@angular/router';
import { By } from '@angular/platform-browser';
import { describe, it, expect, beforeEach } from 'vitest';
import { signal } from '@angular/core';

describe('Sidebar Component', () => {
  let component: Sidebar;
  let fixture: ComponentFixture<Sidebar>;
  let chatServiceSpy: { hasUnreadChats: ReturnType<typeof signal<boolean>> };

  beforeEach(async () => {
    chatServiceSpy = {
      hasUnreadChats: signal(false),
    };

    await TestBed.configureTestingModule({
      imports: [Sidebar],
      providers: [
        { provide: ChatService, useValue: chatServiceSpy },
        provideRouter([
          { path: 'documents/generate', component: Sidebar },
          { path: 'payments/billing-history', component: Sidebar },
        ]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Sidebar);
    component = fixture.componentInstance;

    // Provide the required input
    fixture.componentRef.setInput('currentUser', {
      id: '123',
      name: 'Test User',
      email: 'test@example.com',
      role: 'admin',
    });

    fixture.detectChanges();
  });

  it('should create the sidebar component', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with collapsed as false', () => {
    expect(component.collapsed()).toBe(false);
  });

  it('should toggle the collapsed state', () => {
    expect(component.collapsed()).toBe(false);
    component.toggle();
    expect(component.collapsed()).toBe(true);
    component.toggle();
    expect(component.collapsed()).toBe(false);
  });

  it('should render navigation items', () => {
    const navItems = fixture.debugElement.queryAll(By.css('nav a'));
    expect(navItems.length).toBe(component.navItems.length);
  });

  it('should render the current user info in the footer when not collapsed', () => {
    const footer = fixture.debugElement.query(By.css('.sidebar-footer'));
    expect(footer.nativeElement.textContent).toContain('admin');
    expect(footer.nativeElement.textContent).toContain('test@example.com');
  });

  it('should hide user details in footer when collapsed', () => {
    component.toggle();
    fixture.detectChanges();

    const footer = fixture.debugElement.query(By.css('.sidebar-footer'));
    expect(footer.nativeElement.textContent).not.toContain('test@example.com');
  });

  it('should show unread indicator on Chats if hasUnreadChats is true', () => {
    chatServiceSpy.hasUnreadChats.set(true);
    fixture.detectChanges();

    const chatsLink = fixture.debugElement
      .queryAll(By.css('nav a'))
      .find((el) => el.nativeElement.textContent.includes('Chats'));
    const unreadDot = chatsLink?.query(By.css('.sidebar-unread-dot'));

    expect(unreadDot).toBeTruthy();
  });
  it('should compute planName correctly based on currentUser planId', () => {
    expect(component.planName()).toBe('');

    fixture.componentRef.setInput('currentUser', { id: '123', planId: 'price_1Tsh1w3C6FGO2xjMcR62X9Po' });
    expect(component.planName()).toBe('Pro');

    fixture.componentRef.setInput('currentUser', { id: '123', planId: 'price_1Tsh4Y3C6FGO2xjMaTpgehz2' });
    expect(component.planName()).toBe('Premium');

    fixture.componentRef.setInput('currentUser', { id: '123', planId: 'some_other_plan' });
    expect(component.planName()).toBe('Subscribed');
  });

  it('should compute isItemActive correctly based on router navigation', async () => {
    const router = TestBed.inject(Router);
    await router.navigateByUrl('/documents/generate');
    fixture.detectChanges();

    const activeMap = component.isItemActive();
    expect(activeMap['/documents']).toBe(true);
    expect(activeMap['/payments/subscriptions']).toBe(false);

    await router.navigateByUrl('/payments/billing-history');
    fixture.detectChanges();

    const newActiveMap = component.isItemActive();
    expect(newActiveMap['/documents']).toBe(false);
    expect(newActiveMap['/payments/subscriptions']).toBe(true);
  });
});
