import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';
import { PermissionsService } from '../services/permissions.service';
import { canUserEdit } from './role.guard';
import { computed } from '@angular/core';
import { Mock, vi, describe, it, expect, beforeEach } from 'vitest';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';

describe('canUserEdit Guard', () => {
  let permissionsServiceMock: { hasPermission: Mock };
  let routerMock: { createUrlTree: Mock };

  beforeEach(() => {
    permissionsServiceMock = {
      hasPermission: vi.fn()
    };

    routerMock = {
      createUrlTree: vi.fn()
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: PermissionsService, useValue: permissionsServiceMock },
        { provide: Router, useValue: routerMock }
      ]
    });
  });

  it('should return true if user has edit-user permission', () => {
    // Mock the computed signal to return true
    permissionsServiceMock.hasPermission.mockReturnValue(computed(() => true));
    
    // Test the guard execution within injection context
    const result = TestBed.runInInjectionContext(() => canUserEdit(null as unknown as ActivatedRouteSnapshot, null as unknown as RouterStateSnapshot));
    
    expect(permissionsServiceMock.hasPermission).toHaveBeenCalledWith('edit-user');
    expect(result).toBe(true);
  });

  it('should return a UrlTree to root if user does not have edit-user permission', () => {
    const mockUrlTree = {} as UrlTree;
    routerMock.createUrlTree.mockReturnValue(mockUrlTree);
    
    // Mock the computed signal to return false
    permissionsServiceMock.hasPermission.mockReturnValue(computed(() => false));
    
    // Test the guard execution within injection context
    const result = TestBed.runInInjectionContext(() => canUserEdit(null as unknown as ActivatedRouteSnapshot, null as unknown as RouterStateSnapshot));
    
    expect(permissionsServiceMock.hasPermission).toHaveBeenCalledWith('edit-user');
    expect(routerMock.createUrlTree).toHaveBeenCalledWith(['/']);
    expect(result).toBe(mockUrlTree);
  });
});
