import { Component } from "@angular/core";
import { RouterOutlet, Router } from "@angular/router";

@Component({
  selector: "app-root",
  standalone: true,
  imports: [RouterOutlet],
  template: "<router-outlet></router-outlet>",
  styles: [],
})
export class AppComponent {
  title = "axa";

  constructor(private router: Router) {}
}
