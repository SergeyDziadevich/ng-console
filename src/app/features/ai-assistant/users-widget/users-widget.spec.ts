import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UsersWidget } from './users-widget';

describe('UsersWidget', () => {
  let component: UsersWidget;
  let fixture: ComponentFixture<UsersWidget>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UsersWidget],
    }).compileComponents();

    fixture = TestBed.createComponent(UsersWidget);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
