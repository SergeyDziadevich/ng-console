import { Component, ChangeDetectionStrategy, ElementRef, ViewChild, inject, signal, HostListener, effect } from '@angular/core';
import { AiService } from '../../services/ai.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-command-palette',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './command-palette.html',
  styleUrls: ['./command-palette.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:keydown.meta.k)': 'handleShortcut($event)',
    '(document:keydown.ctrl.k)': 'handleShortcut($event)',
    '(document:keydown.escape)': 'close()'
  }
})
export class CommandPaletteComponent {
  private readonly aiService = inject(AiService);

  readonly isCommandPaletteOpen = this.aiService.isCommandPaletteOpen;
  readonly prompt = signal('');
  
  readonly messages = this.aiService.messages;
  readonly isGenerating = this.aiService.isGenerating;

  isDragging = false;
  dragStartX = 0;
  dragStartY = 0;
  currentX = 0;
  currentY = 0;

  constructor() {
    effect(() => {
      if (this.isCommandPaletteOpen()) {
        this.currentX = 0;
        this.currentY = 0;
        setTimeout(() => this.searchInput?.nativeElement?.focus(), 50);
      }
    });
  }

  readonly examples = [
    "Summarize all of our latest posts.",
    "Can you list all the tickets we currently have?",
    "What tickets are currently marked as TODO?",
    "Mark tickets 1 and 2 as IN_PROGRESS."
  ];

  @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;

  useExample(cmd: string) {
    this.prompt.set(cmd);
    setTimeout(() => this.searchInput?.nativeElement?.focus(), 50);
  }

  handleShortcut(event: Event) {
    event.preventDefault();
    this.aiService.toggleCommandPalette();
  }

  close() {
    this.aiService.closeCommandPalette();
  }

  onDragStart(event: MouseEvent) {
    if ((event.target as HTMLElement).closest('.palette-header')) {
      this.isDragging = true;
      this.dragStartX = event.clientX - this.currentX;
      this.dragStartY = event.clientY - this.currentY;
    }
  }

  @HostListener('document:mousemove', ['$event'])
  onDragMove(event: MouseEvent) {
    if (!this.isDragging) return;
    event.preventDefault();
    this.currentX = event.clientX - this.dragStartX;
    this.currentY = event.clientY - this.dragStartY;
  }

  @HostListener('document:mouseup')
  onDragEnd() {
    this.isDragging = false;
  }

  async submitCommand() {
    const text = this.prompt().trim();
    if (!text || this.isGenerating()) return;

    this.prompt.set('');
    await this.aiService.generate(text);
  }
}
