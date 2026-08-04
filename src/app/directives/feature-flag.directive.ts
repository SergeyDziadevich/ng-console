import { Directive, effect, inject, input, TemplateRef, ViewContainerRef } from '@angular/core';
import { FeatureFlagService } from '../services/feature-flag.service';

@Directive({
  selector: '[appFeatureFlag]',
})
export class FeatureFlagDirective {
  private readonly templateRef = inject(TemplateRef<unknown>);
  private readonly viewContainer = inject(ViewContainerRef);
  private readonly featureFlagService = inject(FeatureFlagService);

  /** Feature flag key passed to structural directive */
  appFeatureFlag = input.required<string>();

  constructor() {
    effect(() => {
      const flagKey = this.appFeatureFlag();
      const isEnabled = this.featureFlagService.getFlagSignal(flagKey)();

      if (isEnabled) {
        if (this.viewContainer.length === 0) {
          this.viewContainer.createEmbeddedView(this.templateRef);
        }
      } else {
        this.viewContainer.clear();
      }
    });
  }
}
