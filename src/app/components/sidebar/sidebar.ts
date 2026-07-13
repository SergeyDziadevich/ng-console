import { Component, input, signal, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AuthResponse } from '../../services/auth.service';
import { ChatService } from '../../services/chat.service';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { lucideFilePlus, lucideCreditCard } from '@ng-icons/lucide';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  adminOnly?: boolean;
  badge?: {
    text: string;
    classes: string;
  };
  children?: { label: string; route: string; icon?: string }[];
}

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive, NgIconComponent],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss',
  viewProviders: [provideIcons({ lucideFilePlus, lucideCreditCard })],
})
export class Sidebar {
  chatService = inject(ChatService);
  router = inject(Router);
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
      children: [
        { label: 'Generate Document', route: '/documents/generate', icon: 'lucideFilePlus' }
      ]
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
      label: 'Payments',
      icon: 'lucideCreditCard',
      route: '/payments/subscriptions',
      children: [
        { label: 'Subscriptions', route: '/payments/subscriptions' },
        { label: 'Billing History', route: '/payments/billing-history' }
      ]
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

  isItemActive(item: NavItem, rlaActive: boolean): boolean {
    if (rlaActive) return true;
    if (item.children) {
      return item.children.some(child => this.router.url.includes(child.route));
    }
    return false;
  }

  getPlanName(planId?: string): string {
    if (!planId) return 'Free';
    if (planId === 'price_1Tsh1w3C6FGO2xjMcR62X9Po') return 'Pro';
    if (planId === 'price_1Tsh4Y3C6FGO2xjMaTpgehz2') return 'Premium';
    return 'Subscribed';
  }
}
