import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserBar } from './user-bar';

describe('UserBar', () => {
  let component: UserBar;
  let fixture: ComponentFixture<UserBar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserBar],
    }).compileComponents();

    fixture = TestBed.createComponent(UserBar);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
