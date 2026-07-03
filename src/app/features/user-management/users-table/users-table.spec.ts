import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { UsersTable } from './users-table';
import { User } from '../../../models/user.model';
import { UserRole } from '../../../enums/user-role.enum';
import { By } from '@angular/platform-browser';
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
          { path: 'login', component: UsersTable }
        ]),
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(UsersTable);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('users', [mockUser]);
    await fixture.whenStable();
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
});
