import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { TopBarComponent } from '../top-bar/top-bar.component';
import { AuthService } from "@ng-console/shared/data-access";

@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, SidebarComponent, TopBarComponent],
  templateUrl: './shell.html',
  styleUrl: './shell.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShellComponent {
  private readonly authService = inject(AuthService);

  currentUser = this.authService.currentUser;
}

export { ShellComponent as Shell };
