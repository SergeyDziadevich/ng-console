import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { UsersTable } from './users-table';
import { User } from '../../../models/user.model';
import { UserRole } from '../../../enums/user-role.enum';
import { vi } from 'vitest';

describe('UsersTable', () => {
  let component: UsersTable;
  let fixture: ComponentFixture<UsersTable>;

  const mockUser: User = {
    _id: '1',
    username: 'testuser',
    displayName: 'Test User',
    password: 'password',
    email: 'test@example.com',
    role: UserRole.Admin,
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UsersTable],
      providers: [
        provideRouter([
          { path: '**', component: UsersTable },
          { path: 'login', component: UsersTable },
        ]),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(UsersTable);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('users', [mockUser]);
    await fixture.whenStable();
  });

  it('should handle sorting', () => {
    const user1 = { ...mockUser, _id: '1', username: 'Zebra', email: 'a@example.com', isTwoFactorEnabled: false };
    const user2 = { ...mockUser, _id: '2', username: 'Apple', email: 'z@example.com', isTwoFactorEnabled: true };
    fixture.componentRef.setInput('users', [user1, user2]);
    fixture.detectChanges();

    // Sort by username (asc)
    component.sortBy('username');
    expect(component.sortColumn()).toBe('username');
    expect(component.sortDirection()).toBe('asc');
    expect(component.paginatedUsers()[0].username).toBe('Apple');

    // Sort by username (desc)
    component.sortBy('username');
    expect(component.sortDirection()).toBe('desc');
    expect(component.paginatedUsers()[0].username).toBe('Zebra');

    // Third click resets sort column to null
    component.sortBy('username');
    expect(component.sortColumn()).toBeNull();
    expect(component.sortDirection()).toBe('asc');

    // Sort by email (asc)
    component.sortBy('email');
    expect(component.sortColumn()).toBe('email');
    expect(component.sortDirection()).toBe('asc');
    expect(component.paginatedUsers()[0].email).toBe('a@example.com');

    // Sort by boolean field (isTwoFactorEnabled) asc: false before true
    component.sortBy('isTwoFactorEnabled');
    expect(component.sortColumn()).toBe('isTwoFactorEnabled');
    expect(component.sortDirection()).toBe('asc');
    expect(component.paginatedUsers()[0].isTwoFactorEnabled).toBe(false);

    // Sort by boolean field desc: true before false
    component.sortBy('isTwoFactorEnabled');
    expect(component.sortDirection()).toBe('desc');
    expect(component.paginatedUsers()[0].isTwoFactorEnabled).toBe(true);
  });

  it('should handle searching by name and email', () => {
    const user1 = { ...mockUser, _id: '1', username: 'Alpha', email: 'hello@world.com' };
    const user2 = { ...mockUser, _id: '2', username: 'Beta', email: 'test@example.com' };
    fixture.componentRef.setInput('users', [user1, user2]);
    fixture.detectChanges();

    // Search Name
    const eventName = new Event('input');
    Object.defineProperty(eventName, 'target', { writable: false, value: { value: 'alp' } });
    component.updateSearchName(eventName);
    
    expect(component.searchName()).toBe('alp');
    expect(component.paginatedUsers().length).toBe(1);
    expect(component.paginatedUsers()[0].username).toBe('Alpha');

    // Clear search name
    const eventName2 = new Event('input');
    Object.defineProperty(eventName2, 'target', { writable: false, value: { value: '' } });
    component.updateSearchName(eventName2);

    // Search Email
    const eventEmail = new Event('input');
    Object.defineProperty(eventEmail, 'target', { writable: false, value: { value: 'test@ex' } });
    component.updateSearchEmail(eventEmail);
    
    expect(component.searchEmail()).toBe('test@ex');
    expect(component.paginatedUsers().length).toBe(1);
    expect(component.paginatedUsers()[0].username).toBe('Beta');
  });

  it('should toggle search visibility', () => {
    component.onNameTitleClick();
    expect(component.isNameSearchVisible()).toBe(true);
    
    component.searchName.set('');
    component.onNameSearchBlur();
    expect(component.isNameSearchVisible()).toBe(false);

    component.onEmailTitleClick();
    expect(component.isEmailSearchVisible()).toBe(true);
    
    component.searchEmail.set('');
    component.onEmailSearchBlur();
    expect(component.isEmailSearchVisible()).toBe(false);
  });
  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should emit edit event when editUser is called', () => {
    vi.spyOn(component.edit, 'emit');
    component.editUser(mockUser);
    expect(component.edit.emit).toHaveBeenCalledWith(mockUser);
  });

  it('should set userToDelete when confirmDelete is called', () => {
    component.confirmDelete(mockUser);
    expect(component.userToDelete()).toEqual(mockUser);
  });

  it('should clear userToDelete when cancelDelete is called', () => {
    component.confirmDelete(mockUser);
    expect(component.userToDelete()).toEqual(mockUser);

    component.cancelDelete();
    expect(component.userToDelete()).toBeNull();
  });

  it('should emit delete event and clear userToDelete when deleteUser is called with a user selected', () => {
    vi.spyOn(component.delete, 'emit');
    component.confirmDelete(mockUser);

    component.deleteUser();

    expect(component.delete.emit).toHaveBeenCalledWith(mockUser);
    expect(component.userToDelete()).toBeNull();
  });

  it('should not emit delete event if no user is selected to delete', () => {
    vi.spyOn(component.delete, 'emit');
    component.userToDelete.set(null);

    component.deleteUser();

    expect(component.delete.emit).not.toHaveBeenCalled();
  });
  it('should compute initial pagination correctly', () => {
    expect(component.currentPage()).toBe(1);
    expect(component.pageSize()).toBe(25);
    expect(component.totalPages()).toBe(1);
    expect(component.paginatedUsers().length).toBe(1);
  });

  it('should handle nextPage and prevPage', () => {
    const manyUsers = Array.from({ length: 60 }, (_, i) => ({
      ...mockUser,
      _id: `id-${i}`,
    }));
    fixture.componentRef.setInput('users', manyUsers);
    fixture.detectChanges();

    component.nextPage();
    expect(component.currentPage()).toBe(2);
    expect(component.paginatedUsers().length).toBe(25);
    expect(component.paginatedUsers()[0]._id).toBe('id-25');

    component.nextPage();
    expect(component.currentPage()).toBe(3);
    expect(component.paginatedUsers().length).toBe(10);

    component.nextPage();
    expect(component.currentPage()).toBe(3);

    component.prevPage();
    expect(component.currentPage()).toBe(2);

    component.prevPage();
    component.prevPage();
    expect(component.currentPage()).toBe(1);

    // Clamp page: shrink data to 1 user while on page 2
    component.nextPage();
    expect(component.currentPage()).toBe(2);
    fixture.componentRef.setInput('users', [mockUser]);
    fixture.detectChanges();
    // paginatedUsers should clamp to page 1
    expect(component.paginatedUsers().length).toBe(1);
  });

  it('should update page size', () => {
    const manyUsers = Array.from({ length: 60 }, (_, i) => ({
      ...mockUser,
      _id: `id-${i}`,
    }));
    fixture.componentRef.setInput('users', manyUsers);
    fixture.detectChanges();

    component.nextPage();

    const select = document.createElement('select');
    const option = document.createElement('option');
    option.value = '50';
    select.appendChild(option);
    select.value = '50';

    const event = new Event('change');
    Object.defineProperty(event, 'target', { writable: false, value: select });

    component.onPageSizeChange(event);

    expect(component.pageSize()).toBe(50);
    expect(component.currentPage()).toBe(1);
    expect(component.totalPages()).toBe(2);
    expect(component.paginatedUsers().length).toBe(50);
  });

  it('should handle "all" page size', () => {
    const manyUsers = Array.from({ length: 60 }, (_, i) => ({
      ...mockUser,
      _id: `id-${i}`,
    }));
    fixture.componentRef.setInput('users', manyUsers);
    fixture.detectChanges();

    const select = document.createElement('select');
    const option = document.createElement('option');
    option.value = 'all';
    select.appendChild(option);
    select.value = 'all';

    const event = new Event('change');
    Object.defineProperty(event, 'target', { writable: false, value: select });

    component.onPageSizeChange(event);

    expect(component.pageSize()).toBe('all');
    expect(component.totalPages()).toBe(1);
    expect(component.paginatedUsers().length).toBe(60);
  });

  it('should reset to page 1 when users input changes', () => {
    const manyUsers = Array.from({ length: 60 }, (_, i) => ({
      ...mockUser,
      _id: `id-${i}`,
    }));
    fixture.componentRef.setInput('users', manyUsers);
    fixture.detectChanges();

    component.nextPage();
    expect(component.currentPage()).toBe(2);

    fixture.componentRef.setInput('users', manyUsers.slice(0, 10));
    fixture.detectChanges();

    expect(component.currentPage()).toBe(1);
    expect(component.totalPages()).toBe(1);
    expect(component.paginatedUsers().length).toBe(10);
  });
});
