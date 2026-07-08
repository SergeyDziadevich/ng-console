import { Component, input, signal, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthResponse } from '../../services/auth.service';
import { ChatService } from '../../services/chat.service';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  adminOnly?: boolean;
}

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html',
  styles: ``,
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
    },
    {
      label: 'Users',
      icon: 'icon-users.svg',
      route: '/user-management',
    },
    {
      label: 'Documents',
      icon: 'icon-documents.svg',
      route: '/documents',
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
      label: 'Tickets',
      icon: 'icon-tickets.svg',
      route: '/tickets',
    },
    {
      label: 'Activity Logs',
      icon: 'icon-activity-log.svg',
      route: '/audit-logs',
      adminOnly: true,
    },
  ];

  toggle() {
    this.collapsed.update((v) => !v);
  }
}
