import { Component, input, signal, inject, computed, ChangeDetectionStrategy } from "@angular/core";
import { RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs';
import { AuthResponse } from "@ng-console/shared/data-access";
import { ChatService } from "@ng-console/shared/data-access";
import { TranslatePipe } from "@ng-console/shared/util";
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { lucideFilePlus, lucideCreditCard, lucideChevronDown, lucideChevronUp, lucideBuilding2 } from '@ng-icons/lucide';

interface NavItem {
  label: string;
  labelKey: string;
  icon: string;
  route: string;
  adminOnly?: boolean;
  badge?: {
    text: string;
    labelKey?: string;
    classes: string;
  };
  children?: { label: string; labelKey?: string; route: string; icon?: string }[];
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive, NgIconComponent, TranslatePipe],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss',
  viewProviders: [provideIcons({ lucideFilePlus, lucideCreditCard, lucideChevronDown, lucideChevronUp, lucideBuilding2 })],
})
export class SidebarComponent {
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
      labelKey: 'NAV.DASHBOARD',
      icon: 'icon-dashboard.svg',
      route: '/dashboard',
    },
    {
      label: 'AI Assistant',
      labelKey: 'NAV.AI_ASSISTANT',
      icon: 'icon-ai-assistant.svg',
      route: '/ai-assistant',
      badge: { text: 'Beta', labelKey: 'BADGES.BETA', classes: 'sidebar-badge-green' },
    },
    {
      label: 'User Management',
      labelKey: 'NAV.USER_MANAGEMENT',
      icon: 'icon-users.svg',
      route: '/user-management',
    },
    {
      label: 'Customers',
      labelKey: 'NAV.CUSTOMERS',
      icon: 'lucideBuilding2',
      route: '/customers',
    },
    {
      label: 'Tickets',
      labelKey: 'NAV.TICKETS',
      icon: 'icon-tickets.svg',
      route: '/tickets',
      badge: { text: 'Preview', labelKey: 'BADGES.PREVIEW', classes: 'sidebar-badge-purple' },
    },
    {
      label: 'Documents',
      labelKey: 'NAV.DOCUMENTS',
      icon: 'icon-documents.svg',
      route: '/documents',
      badge: { text: 'New', labelKey: 'BADGES.NEW', classes: 'sidebar-badge-blue' },
      children: [
        { label: 'Generate Document', labelKey: 'NAV.GENERATE_DOCUMENT', route: '/documents/generate', icon: 'lucideFilePlus' }
      ]
    },
    {
      label: 'Chats',
      labelKey: 'NAV.CHATS',
      icon: 'icon-chats.svg',
      route: '/chats',
    },
    {
      label: 'Notifications',
      labelKey: 'NAV.NOTIFICATIONS',
      icon: 'icon-notifications.svg',
      route: '/notifications',
    },
    {
      label: 'Payments',
      labelKey: 'NAV.PAYMENTS',
      icon: 'lucideCreditCard',
      route: '/payments/subscriptions',
      children: [
        { label: 'Subscriptions', labelKey: 'NAV.SUBSCRIPTIONS', route: '/payments/subscriptions' },
        { label: 'Billing History', labelKey: 'NAV.BILLING_HISTORY', route: '/payments/billing-history' }
      ]
    },
    {
      label: 'Settings',
      labelKey: 'NAV.SETTINGS',
      icon: 'icon-settings.svg',
      route: '/settings',
    },
    {
      label: 'Audit Logs',
      labelKey: 'NAV.AUDIT_LOGS',
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

export { SidebarComponent as Sidebar };
