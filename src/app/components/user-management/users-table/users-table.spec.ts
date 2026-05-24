import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UsersTable } from './users-table';

describe('UsersTable', () => {
  let component: UsersTable;
  let fixture: ComponentFixture<UsersTable>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UsersTable],
    }).compileComponents();

    fixture = TestBed.createComponent(UsersTable);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
