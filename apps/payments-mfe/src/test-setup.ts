import '@angular/compiler';
import '@angular/localize/init';
import '@analogjs/vitest-angular/setup-snapshots';
import { setupTestBed } from '@analogjs/vitest-angular/setup-testbed';

try {
  setupTestBed();
} catch {
  // TestBed environment already initialized
}