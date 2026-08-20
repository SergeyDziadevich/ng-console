import { Component, signal, ChangeDetectionStrategy } from "@angular/core";
import { RouterOutlet } from '@angular/router';
import { CommandPaletteComponent } from "@ng-console/shared/layout";

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-root',
  imports: [RouterOutlet, CommandPaletteComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly title = signal('ng console');
}
