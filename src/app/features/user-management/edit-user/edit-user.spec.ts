import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EditUser } from './edit-user';
import { Router, ActivatedRoute } from '@angular/router';
import { UserService } from '../../../services/user-service';
import { of, throwError } from 'rxjs';
import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { UserRole } from '../../../enums/user-role.enum';
import { environment } from '../../../../environments/environment';

describe('EditUser', () => {
  let component: EditUser;
  let fixture: ComponentFixture<EditUser>;
  let mockUserService: Partial<UserService>;
  let mockRouter: Partial<Router>;
  let httpTestingController: HttpTestingController;

  beforeEach(async () => {
    mockUserService = {
      updateUser: vi.fn().mockReturnValue(of({})),
      usersResource: { reload: vi.fn() } as unknown as UserService['usersResource'],
    };

    mockRouter = {
      navigate: vi.fn(),
    };

    const mockActivatedRoute = {
      paramMap: of(new Map([['id', '123']])),
    };

    await TestBed.configureTestingModule({
      imports: [EditUser],
      providers: [
        { provide: UserService, useValue: mockUserService },
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EditUser);
    component = fixture.componentInstance;
    httpTestingController = TestBed.inject(HttpTestingController);
    fixture.detectChanges();

    // Flush the httpResource initial request
    const req = httpTestingController.expectOne(`${environment.apiUrl}/api/users/123`);
    req.flush({ id: '123', username: 'testuser', email: 'test@example.com', role: UserRole.User });
    fixture.detectChanges();
  });

  afterEach(() => {
    httpTestingController.verify();
    TestBed.resetTestingModule();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
    expect(component.editModel().username).toBe('testuser');
  });

  it('should navigate to user-management on close', () => {
    component.close();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/user-management']);
  });

  it('should update user and show toast on submit', async () => {
    vi.useFakeTimers();
    component.onSubmit();
    expect(mockUserService.updateUser).toHaveBeenCalled();
    expect(component.showToast()).toBe(true);

    vi.advanceTimersByTime(500);
    expect(component.showToast()).toBe(false);
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/user-management']);
    expect(mockUserService.usersResource?.reload).toHaveBeenCalled();
    vi.useRealTimers();
  });

  it('should handle error on submit', () => {
    const errorResponse = new HttpErrorResponse({ error: 'Server error', status: 500 });
    mockUserService.updateUser = vi.fn().mockReturnValue(throwError(() => errorResponse));

    component.onSubmit();
    expect(component.error()).toBe('Server error');
  });

  it('should handle FileReader onAvatarChange', async () => {
    vi.useFakeTimers();
    const file = new File(['test'], 'test.png', { type: 'image/png' });
    const event = { target: { files: [file] } } as unknown as Event;

    component.onAvatarChange(event);

    vi.advanceTimersByTime(100);
    expect(component.avatarPreview()).toContain('data:image/png;base64');
    vi.useRealTimers();
  });
});
