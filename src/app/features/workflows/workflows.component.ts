import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-workflows',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './workflows.component.html',
  styleUrls: ['./workflows.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkflowsComponent {
  protected readonly workflows = signal([
    { id: '1', name: 'Invoice Signed Flow', triggerType: 'DOCUMENT_SIGNED', isActive: true },
    { id: '2', name: 'Contract Approved', triggerType: 'DOCUMENT_APPROVED', isActive: false },
  ]);
}
