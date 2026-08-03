import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuditLogsService } from './audit-logs.service';

import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-audit-logs',
  imports: [CommonModule, FormsModule, TranslatePipe],
  templateUrl: './audit-logs.component.html',
  styleUrls: ['./audit-logs.component.scss'],
})
export class AuditLogsComponent implements OnInit {
  auditService = inject(AuditLogsService);
  searchQuery = signal<string>('');
  startDate = signal<string>('');
  endDate = signal<string>('');
  showDetails = signal<boolean>(false);
  selectedActions = signal<string[]>([]);
  dropdownOpen = signal<boolean>(false);
  actionSearchQuery = signal<string>('');

  filteredAvailableActions = computed(() => {
    const query = this.actionSearchQuery().toLowerCase();
    const selected = new Set(this.selectedActions());
    return this.auditService
      .availableActions()
      .filter((a) => !selected.has(a) && a.toLowerCase().includes(query));
  });

  retentionOptions = [
    { value: 30, label: '30 Days' },
    { value: 60, label: '60 Days' },
    { value: 90, label: '90 Days' },
    { value: 365, label: '1 Year' },
  ];

  ngOnInit() {
    this.auditService.fetchLogs();
    this.auditService.fetchAvailableActions();
  }

  onSearchChange(query: string) {
    this.searchQuery.set(query);
    this.fetchLogs();
  }

  onDateChange() {
    this.fetchLogs();
  }

  toggleActionFilter(action: string) {
    this.selectedActions.update((current) =>
      current.includes(action) ? current.filter((a) => a !== action) : [...current, action],
    );
    this.fetchLogs();
  }

  private fetchLogs() {
    this.auditService.fetchLogs(
      1,
      50,
      this.searchQuery(),
      this.startDate(),
      this.endDate(),
      this.selectedActions(),
    );
  }

  showRetentionModal = signal<boolean>(false);
  pendingRetentionDays = signal<number>(30);

  exportLogs() {
    const logs = this.auditService.logs();
    const dataStr =
      'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(logs, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute('href', dataStr);
    downloadAnchorNode.setAttribute('download', 'audit_logs.json');
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
