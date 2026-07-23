import { TestBed } from '@angular/core/testing';
import { ThemeService, Theme } from './theme.service';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('ThemeService', () => {
  let service: ThemeService;
  
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    
    // Clear dark class from document element
    document.documentElement.classList.remove('dark');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should be created', () => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ThemeService);
    expect(service).toBeTruthy();
  });

  describe('Initialization', () => {
    it('should default to light theme if no theme is in localStorage', () => {
      TestBed.configureTestingModule({});
      service = TestBed.inject(ThemeService);
      
      expect(service.currentTheme()).toBe('light');
      expect(localStorage.getItem('app-theme')).toBe('light');
      expect(document.documentElement.classList.contains('dark')).toBe(false);
    });

    it('should load dark theme from localStorage if valid', () => {
      localStorage.setItem('app-theme', 'dark');
      
      TestBed.configureTestingModule({});
      service = TestBed.inject(ThemeService);
      
      expect(service.currentTheme()).toBe('dark');
      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });

    it('should fallback to light theme if an invalid theme (e.g., system) is in localStorage', () => {
      localStorage.setItem('app-theme', 'system');
      
      TestBed.configureTestingModule({});
      service = TestBed.inject(ThemeService);
      
      expect(service.currentTheme()).toBe('light');
      expect(localStorage.getItem('app-theme')).toBe('light');
      expect(document.documentElement.classList.contains('dark')).toBe(false);
    });
  });

  describe('setTheme', () => {
    beforeEach(() => {
      TestBed.configureTestingModule({});
      service = TestBed.inject(ThemeService);
    });

    it('should update theme to dark', () => {
      service.setTheme('dark');
      
      expect(service.currentTheme()).toBe('dark');
      expect(localStorage.getItem('app-theme')).toBe('dark');
      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });

    it('should update theme back to light', () => {
      // First set to dark
      service.setTheme('dark');
      expect(document.documentElement.classList.contains('dark')).toBe(true);
      
      // Then set back to light
      service.setTheme('light');
      
      expect(service.currentTheme()).toBe('light');
      expect(localStorage.getItem('app-theme')).toBe('light');
      expect(document.documentElement.classList.contains('dark')).toBe(false);
    });
  });
});
