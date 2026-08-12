import { ChangeDetectionStrategy, Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CdkDragDrop, DragDropModule, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { Router } from '@angular/router';

interface WorkflowNode {
  id: string;
  type: string;
  name: string;
  icon?: string;
  config?: any;
}

@Component({
  selector: 'app-workflow-builder',
  standalone: true,
  imports: [CommonModule, DragDropModule],
  templateUrl: './workflow-builder.component.html',
  styleUrls: ['./workflow-builder.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkflowBuilderComponent {
  private router = inject(Router);

  protected readonly availableActions = signal<WorkflowNode[]>([
    { id: 'act-1', type: 'SAVE_TO_DRIVE', name: 'Save to Google Drive' },
    { id: 'act-2', type: 'SLACK_ALERT', name: 'Send Slack Alert' },
    { id: 'act-3', type: 'EMAIL_CUSTOMER', name: 'Email Customer' },
  ]);

  protected readonly trigger = signal<WorkflowNode>({
    id: 'trig-1',
    type: 'DOCUMENT_SIGNED',
    name: 'Document Signed',
  });

  protected readonly workflowSteps = signal<WorkflowNode[]>([]);

  drop(event: CdkDragDrop<WorkflowNode[]>) {
    if (event.previousContainer === event.container) {
      const steps = [...this.workflowSteps()];
      moveItemInArray(steps, event.previousIndex, event.currentIndex);
      this.workflowSteps.set(steps);
    } else {
      // Clone the item when dropping from available actions
      const item = event.previousContainer.data[event.previousIndex];
      const clone = { ...item, id: `${item.id}-${Date.now()}` };
      const steps = [...this.workflowSteps()];
      steps.splice(event.currentIndex, 0, clone);
      this.workflowSteps.set(steps);
    }
  }

  saveWorkflow() {
    // Integrate with GraphQL API here
    console.log('Saving workflow with steps:', this.workflowSteps());
    this.router.navigate(['/workflows']);
  }

  removeStep(index: number) {
    const steps = [...this.workflowSteps()];
    steps.splice(index, 1);
    this.workflowSteps.set(steps);
  }
}
