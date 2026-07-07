import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuditLogsService } from './audit-logs.service';

@Component({
  selector: 'app-audit-logs',
  imports: [CommonModule, FormsModule],
  templateUrl: './audit-logs.component.html',
  styleUrls: ['./audit-logs.component.scss']
})
export class AuditLogsComponent implements OnInit {
  auditService = inject(AuditLogsService);
  searchQuery = signal<string>('');
  startDate = signal<string>('');
  endDate = signal<string>('');

  retentionOptions = [
    { value: 30, label: '30 Days' },
    { value: 60, label: '60 Days' },
    { value: 90, label: '90 Days' },
    { value: 365, label: '1 Year' }
  ];

  ngOnInit() {
    this.auditService.fetchLogs();
  }

  onSearchChange(query: string) {
    this.searchQuery.set(query);
    this.auditService.fetchLogs(1, 50, query, this.startDate(), this.endDate());
  }

  onDateChange() {
    this.auditService.fetchLogs(1, 50, this.searchQuery(), this.startDate(), this.endDate());
  }

  showRetentionModal = signal<boolean>(false);
  pendingRetentionDays = signal<number>(30);

  exportLogs() {
    const logs = this.auditService.logs();
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(logs, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "audit_logs.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  }

  onRetentionChange(days: number) {
    this.pendingRetentionDays.set(Number(days));
    this.showRetentionModal.set(true);
  }

  confirmRetentionChange() {
    this.auditService.setRetentionDays(this.pendingRetentionDays());
    this.showRetentionModal.set(false);
  }

  cancelRetentionChange() {
    // We just hide the modal. The select element might need a tick to revert visually,
    // but binding to [ngModel]="auditService.retentionDays()" should reset it when we don't save.
    this.showRetentionModal.set(false);
  }
}
