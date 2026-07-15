import { Component, input, signal, inject, computed } from '@angular/core';
import { RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs';
import { AuthResponse } from '@app/services/auth.service';
import { ChatService } from '@app/services/chat.service';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { lucideFilePlus, lucideCreditCard, lucideChevronDown, lucideChevronUp } from '@ng-icons/lucide';

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
  viewProviders: [provideIcons({ lucideFilePlus, lucideCreditCard, lucideChevronDown, lucideChevronUp })],
})
export class Sidebar {
  chatService = inject(ChatService);
  router = inject(Router);

  currentUrl = toSignal(
    this.router.events.pipe(
      filter((e) => e instanceof NavigationEnd),
      map((e) => (e as NavigationEnd).urlAfterRedirects)
    ),
    { initialValue: this.router.url }
  );

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

  isItemActive = computed(() => {
    const url = this.currentUrl() || '';
    const activeMap: Record<string, boolean> = {};
    for (const item of this.navItems) {
      activeMap[item.route] = item.children
        ? item.children.some((child) => url.includes(child.route))
        : false;
    }
    return activeMap;
  });

  planName = computed(() => {
    const planId = this.currentUser()?.planId;
    if (!planId) return '';
    if (planId === 'price_1Tsh1w3C6FGO2xjMcR62X9Po') return 'Pro';
    if (planId === 'price_1Tsh4Y3C6FGO2xjMaTpgehz2') return 'Premium';
    return 'Subscribed';
  });
}
