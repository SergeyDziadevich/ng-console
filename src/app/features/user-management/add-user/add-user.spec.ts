import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AddUser } from './add-user';
import { Router } from '@angular/router';
import { UserService } from '../../../services/user-service';
import { of, throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';

describe('AddUser', () => {
  let component: AddUser;
  let fixture: ComponentFixture<AddUser>;
  let mockUserService: Partial<UserService>;
  let mockRouter: Partial<Router>;

  beforeEach(async () => {
    mockUserService = {
      createUser: vi.fn().mockReturnValue(of({})),
      usersResource: { reload: vi.fn() } as unknown as UserService['usersResource'],
    };

    mockRouter = {
      navigate: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [AddUser],
      providers: [
        { provide: UserService, useValue: mockUserService },
        { provide: Router, useValue: mockRouter },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AddUser);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should navigate to user-management on close', () => {
    component.close();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/user-management']);
  });

  it('should create user and show toast on submit', async () => {
    vi.useFakeTimers();
    component.onSubmit();
    expect(mockUserService.createUser).toHaveBeenCalled();
    expect(component.showToast()).toBe(true);

    vi.advanceTimersByTime(500);
    expect(component.showToast()).toBe(false);
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/user-management']);
    expect(mockUserService.usersResource?.reload).toHaveBeenCalled();
    vi.useRealTimers();
  });

  it('should handle error on submit', () => {
    const errorResponse = new HttpErrorResponse({ error: 'Server error', status: 500 });
    mockUserService.createUser = vi.fn().mockReturnValue(throwError(() => errorResponse));

    component.onSubmit();
    expect(component.error()).toBe('Server error');
  });

  it('should handle FileReader onAvatarChange', () => {
    const file = new File(['test'], 'test.png', { type: 'image/png' });
    const event = { target: { files: [file] } } as unknown as Event;

    let instance: { readAsDataURL: ReturnType<typeof vi.fn>; onload: (() => void) | null; result: string } | undefined;
    class MockFileReader {
      readAsDataURL = vi.fn();
      onload: (() => void) | null = null;
      result = 'data:image/png;base64,mockdata';
      constructor() {
        instance = this;
      }
    }
    vi.stubGlobal('FileReader', MockFileReader);

    component.onAvatarChange(event);
    if (instance?.onload) {
      instance.onload();
    }

    expect(component.avatarPreview()).toContain('data:image/png;base64');
  });
});
