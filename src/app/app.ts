import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommandPaletteComponent } from '@ng-console-platform/ui';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, CommandPaletteComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly title = signal('ng console');
}
