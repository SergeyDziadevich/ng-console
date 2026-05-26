import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Sidebar } from '../sidebar/sidebar';
import { TopBar } from '../top-bar/top-bar';
@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, Sidebar, TopBar],
  templateUrl: './shell.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Shell {}
