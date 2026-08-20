import { Directive, effect, inject, input, linkedSignal, TemplateRef, ViewContainerRef } from '@angular/core';
import { FeatureFlagService } from "@ng-console/shared/data-access";

@Directive({
  selector: '[appFeatureFlag]',
})
export class FeatureFlagDirective {
  private readonly templateRef = inject(TemplateRef<unknown>);
  private readonly viewContainer = inject(ViewContainerRef);
  private readonly featureFlagService = inject(FeatureFlagService);

  /** Feature flag key passed to structural directive */
  appFeatureFlag = input.required<string>();

  /** Reactive state linked to input flag key and feature flag service state */
  readonly isEnabled = linkedSignal(() => {
    const flagKey = this.appFeatureFlag();
    return this.featureFlagService.getFlagSignal(flagKey)();
  });

  constructor() {
    effect(() => {
      if (this.isEnabled()) {
        if (this.viewContainer.length === 0) {
          this.viewContainer.createEmbeddedView(this.templateRef);
        }
      } else {
        this.viewContainer.clear();
      }
    });
  }
}
