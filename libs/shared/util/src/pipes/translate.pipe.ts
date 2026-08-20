import { Pipe, PipeTransform, inject } from '@angular/core';
import { TranslationService } from "@ng-console/shared/data-access";

@Pipe({
  name: 'translate',
  pure: false,
})
export class TranslatePipe implements PipeTransform {
  private readonly translationService = inject(TranslationService);

  transform(key: string, params?: Record<string, string | number>): string {
    return this.translationService.translate(key, params);
  }
}
