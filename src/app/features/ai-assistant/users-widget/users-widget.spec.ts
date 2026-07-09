import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { UsersWidget } from './users-widget';
import { UserService } from '../../../services/user-service';

describe('UsersWidget', () => {
  let component: UsersWidget;
  let fixture: ComponentFixture<UsersWidget>;

  beforeEach(async () => {
    const mockUserService = {
      usersResource: { value: () => [] },
      users$: of([]),
    };

    await TestBed.configureTestingModule({
      imports: [UsersWidget],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: UserService, useValue: mockUserService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(UsersWidget);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('parseUsers', () => {
    it('should parse valid user line format', () => {
      component.text = '* **John Doe** (johndoe) - admin';
      component.parseUsers();
      expect(component.users).toEqual([
        { name: 'John Doe', username: 'johndoe', role: 'admin', avatar: 'J' },
      ]);
    });

    it('should parse valid user line without role, defaulting to user', () => {
      component.text = '* **Alice** (alice123)';
      component.parseUsers();
      expect(component.users).toEqual([
        { name: 'Alice', username: 'alice123', role: 'user', avatar: 'A' },
      ]);
    });

    it('should parse details containing commas and extract role', () => {
      component.text = '* **Bob Smith** (bobsmith, email: bob@example.com, Role: moderator)';
      component.parseUsers();
      expect(component.users).toEqual([
        { name: 'Bob Smith', username: 'bobsmith', role: 'moderator', avatar: 'B' },
      ]);
    });

    it('should parse multiple users', () => {
      component.text = '* **User One** (user1)\n* **User Two** (user2) - admin';
      component.parseUsers();
      expect(component.users).toHaveLength(2);
      expect(component.users[0].name).toBe('User One');
      expect(component.users[1].name).toBe('User Two');
      expect(component.users[1].role).toBe('admin');
    });

    it('should ignore invalid lines', () => {
      component.text = 'Here are the users:\n* Invalid line format\n* **Valid User** (valid)';
      component.parseUsers();
      expect(component.users).toHaveLength(1);
      expect(component.users[0].name).toBe('Valid User');
    });
  });
});
