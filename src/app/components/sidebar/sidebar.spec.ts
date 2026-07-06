import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Sidebar } from './sidebar';
import { ChatService } from '../../services/chat.service';
import { provideRouter } from '@angular/router';
import { By } from '@angular/platform-browser';
import { describe, it, expect, beforeEach } from 'vitest';
import { signal } from '@angular/core';


describe('Sidebar Component', () => {
  let component: Sidebar;
  let fixture: ComponentFixture<Sidebar>;
  let chatServiceSpy: { hasUnreadChats: ReturnType<typeof signal<boolean>> };

  beforeEach(async () => {
    chatServiceSpy = {
      hasUnreadChats: signal(false)
    };

    await TestBed.configureTestingModule({
      imports: [Sidebar],
      providers: [
        { provide: ChatService, useValue: chatServiceSpy },
        provideRouter([])
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(Sidebar);
    component = fixture.componentInstance;
    
    // Provide the required input
    fixture.componentRef.setInput('currentUser', {
      id: '123',
      name: 'Test User',
      email: 'test@example.com',
      role: 'admin'
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
    const footer = fixture.debugElement.query(By.css('.border-t'));
    expect(footer.nativeElement.textContent).toContain('admin');
    expect(footer.nativeElement.textContent).toContain('test@example.com');
  });

  it('should hide user details in footer when collapsed', () => {
    component.toggle();
    fixture.detectChanges();
    
    const footer = fixture.debugElement.query(By.css('.border-t'));
    expect(footer.nativeElement.textContent).not.toContain('test@example.com');
  });

  it('should show unread indicator on Chats if hasUnreadChats is true', () => {
    chatServiceSpy.hasUnreadChats.set(true);
    fixture.detectChanges();

    const chatsLink = fixture.debugElement.queryAll(By.css('nav a')).find(el => el.nativeElement.textContent.includes('Chats'));
    const unreadDot = chatsLink?.query(By.css('.bg-green-500'));
    
    expect(unreadDot).toBeTruthy();
  });
});
