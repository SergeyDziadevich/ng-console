import { Component, Input, OnInit, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { UserService } from '../../../services/user-service';

export interface UserItem {
  name: string;
  username: string;
  role: string;
  avatar: string;
}

@Component({
  selector: 'app-users-widget',
  imports: [CommonModule],
  templateUrl: './users-widget.html',
  styleUrls: ['./users-widget.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UsersWidget implements OnInit {
  @Input() text = '';

  users: UserItem[] = [];

  private router = inject(Router);
  private userService = inject(UserService);

  ngOnInit() {
    this.parseUsers();
  }

  parseUsers() {
    const lines = this.text.split('\n');
    const parsedUsers: UserItem[] = [];

    for (const line of lines) {
      // General match: * **Name** (details) optionally followed by - Role
      const match = line.match(/\*\s+\*\*(.+?)\*\*\s+\((.+?)\)(?:\s+-\s+(.+))?/);
      if (match) {
        const name = match[1].trim();
        const detailsStr = match[2].trim();
        let role = match[3] ? match[3].trim() : 'user';
        let username = detailsStr;

        // If details contain commas, try to extract role and username
        if (detailsStr.includes(',')) {
          const parts = detailsStr.split(',');
          username = parts[0].trim();
          for (const p of parts) {
            if (p.toLowerCase().includes('role:')) {
              role = p.split(':')[1].trim();
            }
          }
        }

        parsedUsers.push({
          name: name,
          username: username,
          role: role,
          avatar: name.charAt(0).toUpperCase()
        });
      }
    }
    this.users = parsedUsers;
  }

  getRoleClasses(role: string): string {
    const r = role.toLowerCase();
    if (r.includes('admin')) return 'bg-red-500/20 text-red-700 border-red-500/30';
    if (r.includes('moderator')) return 'bg-purple-500/20 text-purple-700 border-purple-500/30';
    return 'bg-blue-500/20 text-blue-700 border-blue-500/30';
  }

  onUserClick(username: string) {
    const users = this.userService.usersResource.value();
    const user = users?.find(u => u.username === username);
    if (user) {
      this.router.navigate(['/user-management', 'edit-user', user._id]);
    } else {
      this.userService.users$.subscribe(allUsers => {
        const found = allUsers.find(u => u.username === username);
        if (found) {
          this.router.navigate(['/user-management', 'edit-user', found._id]);
        }
      });
    }
  }
}
