import { ChangeDetectionStrategy, Component } from "@angular/core";
import { RouterOutlet } from "@angular/router";

@Component({
  selector: "app-users-mfe-root",
  imports: [RouterOutlet],
  template: "<div><router-outlet></router-outlet></div>",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {}