import { Component, input, signal, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthResponse } from '../../services/auth.service';
import { ChatService } from '../../services/chat.service';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  adminOnly?: boolean;
  badge?: {
    text: string;
    classes: string;
  };
}

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss',
})
export class Sidebar {
  chatService = inject(ChatService);
  collapsed = signal(false);

  currentUser = input.required<AuthResponse['user'] | null>();

  navItems: NavItem[] = [
    {
      label: 'Dashboard',
      icon: 'icon-dashboard.svg',
      route: '/dashboard',
    },
    {
      label: 'AI Assistant',
      icon: 'icon-ai-assistant.svg',
      route: '/ai-assistant',
      badge: { text: 'Beta', classes: 'sidebar-badge-green' },
    },
    {
      label: 'User Management',
      icon: 'icon-users.svg',
      route: '/user-management',
    },
    {
      label: 'Tickets',
      icon: 'icon-tickets.svg',
      route: '/tickets',
      badge: { text: 'Preview', classes: 'sidebar-badge-purple' },
    },
    {
      label: 'Documents',
      icon: 'icon-documents.svg',
      route: '/documents',
      badge: { text: 'New', classes: 'sidebar-badge-blue' },
    },
    {
      label: 'Chats',
      icon: 'icon-chats.svg',
      route: '/chats',
    },
    {
      label: 'Notifications',
      icon: 'icon-notifications.svg',
      route: '/notifications',
    },
    {
      label: 'Settings',
      icon: 'icon-settings.svg',
      route: '/settings',
    },
    {
      label: 'Audit Logs',
      icon: 'icon-activity-log.svg',
      route: '/audit-logs',
      adminOnly: true,
    },
  ];

  toggle() {
    this.collapsed.update((v) => !v);
  }
}
