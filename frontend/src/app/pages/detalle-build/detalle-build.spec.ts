import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DetalleBuild } from './detalle-build';

describe('DetalleBuild', () => {
  let component: DetalleBuild;
  let fixture: ComponentFixture<DetalleBuild>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [DetalleBuild]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DetalleBuild);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
