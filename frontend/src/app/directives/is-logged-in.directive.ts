import { Directive, Input, TemplateRef, ViewContainerRef, OnInit, OnDestroy } from '@angular/core';
import { AuthService } from '../services/auth';
import { Subscription } from 'rxjs';

@Directive({
  selector: '[appIsLoggedIn]',
  standalone: true
})
export class IsLoggedInDirective implements OnInit, OnDestroy {
  private condition: boolean = false;
  private subscription?: Subscription;

  constructor(
    private templateRef: TemplateRef<any>,
    private viewContainer: ViewContainerRef,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.subscription = this.authService.currentUser$.subscribe(() => {
      this.updateView();
    });
    this.updateView();
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  @Input() set appIsLoggedIn(condition: boolean) {
    this.condition = condition;
    this.updateView();
  }

  private updateView(): void {
    const isLoggedIn = this.authService.isLoggedIn();
    const shouldShow = this.condition ? isLoggedIn : !isLoggedIn;
    
    if (shouldShow) {
      this.viewContainer.createEmbeddedView(this.templateRef);
    } else {
      this.viewContainer.clear();
    }
  }
}
