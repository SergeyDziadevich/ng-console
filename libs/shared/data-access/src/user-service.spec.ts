import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { UserService } from './user-service';
import { environment } from "@env/environment";
import { CreateUser, UpdateUser } from "@ng-console/shared/models";
import { UserRole } from "@ng-console/shared/models";

describe('UserService', () => {
  let service: UserService;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(UserService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should create user', () => {
    const newUser: CreateUser = {
      username: 'test',
      email: 't@t.com',
      password: '123',
      role: UserRole.User,
    };
    const mockRes = { _id: '1', ...newUser };

    service.createUser(newUser).subscribe((res) => {
      expect(res).toEqual(mockRes);
    });

    const req = httpTestingController.expectOne(`${environment.apiUrl}/api/users`);
    expect(req.request.method).toBe('POST');
    req.flush(mockRes);
  });

  it('should delete user', () => {
    service.deleteUser('1').subscribe((res) => {
      expect(res).toBeNull();
    });

    const req = httpTestingController.expectOne(`${environment.apiUrl}/api/users/1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });

  it('should get user by id', () => {
    service.getUserById('1').subscribe((res) => {
      expect(res._id).toBe('1');
    });

    const req = httpTestingController.expectOne(`${environment.apiUrl}/api/users/1`);
    expect(req.request.method).toBe('GET');
    req.flush({ _id: '1' });
  });

  it('should update user', () => {
    const update: UpdateUser = { username: 'updated' };
    service.updateUser('1', update).subscribe((res) => {
      expect(res.username).toBe('updated');
    });

    const req = httpTestingController.expectOne(`${environment.apiUrl}/api/users/1`);
    expect(req.request.method).toBe('PATCH');
    req.flush({ _id: '1', username: 'updated' });
  });
});
