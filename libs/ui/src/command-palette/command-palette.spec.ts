import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommandPaletteComponent } from './command-palette';
import { AiService, ChatMessage } from '@app/services/ai.service';
import { signal, WritableSignal } from '@angular/core';
import { describe, it, expect, vi, beforeEach, afterEach, Mock } from 'vitest';

describe('CommandPaletteComponent', () => {
  let component: CommandPaletteComponent;
  let fixture: ComponentFixture<CommandPaletteComponent>;
  let mockAiService: {
    generate: Mock<(msg: string) => Promise<void>>;
    toggleCommandPalette: Mock<() => void>;
    closeCommandPalette: Mock<() => void>;
    messages: WritableSignal<ChatMessage[]>;
    isGenerating: WritableSignal<boolean>;
    isCommandPaletteOpen: WritableSignal<boolean>;
  };

  let mockMessages: WritableSignal<ChatMessage[]>;
  let mockIsGenerating: WritableSignal<boolean>;
  let mockIsCommandPaletteOpen: WritableSignal<boolean>;

  beforeEach(async () => {
    mockMessages = signal([]);
    mockIsGenerating = signal(false);
    mockIsCommandPaletteOpen = signal(false);

    mockAiService = {
      generate: vi.fn(),
      toggleCommandPalette: vi.fn(() => mockIsCommandPaletteOpen.update((v) => !v)),
      closeCommandPalette: vi.fn(() => mockIsCommandPaletteOpen.set(false)),
      messages: mockMessages,
      isGenerating: mockIsGenerating,
      isCommandPaletteOpen: mockIsCommandPaletteOpen,
    };

    await TestBed.configureTestingModule({
      imports: [CommandPaletteComponent],
      providers: [{ provide: AiService, useValue: mockAiService }],
    }).compileComponents();

    fixture = TestBed.createComponent(CommandPaletteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should be closed by default', () => {
    expect(component.isCommandPaletteOpen()).toBe(false);
    const palette = fixture.nativeElement.querySelector('.palette-container');
    expect(palette).toBeNull();
  });

  it('should open and clear current position when opened via service', () => {
    vi.useFakeTimers();
    mockIsCommandPaletteOpen.set(true);
    fixture.detectChanges();

    expect(component.isCommandPaletteOpen()).toBe(true);
    vi.advanceTimersByTime(50);

    expect(component.currentX).toBe(0);
    expect(component.currentY).toBe(0);

    const palette = fixture.nativeElement.querySelector('.palette-container');
    expect(palette).toBeTruthy();
  });

  it('should handle keyboard shortcuts to toggle', () => {
    const event = new KeyboardEvent('keydown', { key: 'k', metaKey: true });
    vi.spyOn(event, 'preventDefault');

    component.handleShortcut(event);
    expect(event.preventDefault).toHaveBeenCalled();
    expect(mockAiService.toggleCommandPalette).toHaveBeenCalled();
  });

  it('should close when calling close()', () => {
    component.close();
    expect(mockAiService.closeCommandPalette).toHaveBeenCalled();
  });

  it('should set prompt to example when clicked', () => {
    vi.useFakeTimers();
    mockIsCommandPaletteOpen.set(true);
    fixture.detectChanges();
    vi.advanceTimersByTime(50);

    const exampleCommand = component.examples[0];
    component.useExample(exampleCommand);

    expect(component.prompt()).toBe(exampleCommand);
  });

  it('should not submit if prompt is empty or generating', async () => {
    component.prompt.set('   ');
    await component.submitCommand();
    expect(mockAiService.generate).not.toHaveBeenCalled();

    component.prompt.set('test');
    mockIsGenerating.set(true);
    await component.submitCommand();
    expect(mockAiService.generate).not.toHaveBeenCalled();
  });

  it('should submit command and clear prompt', async () => {
    component.prompt.set('test query');
    await component.submitCommand();

    expect(mockAiService.generate).toHaveBeenCalledWith('test query');
    expect(component.prompt()).toBe('');
  });

  it('should handle dragging', () => {
    const target = document.createElement('div');
    target.className = 'palette-header';
    const mockEvent = new MouseEvent('mousedown', { clientX: 100, clientY: 100 });
    Object.defineProperty(mockEvent, 'target', { value: target });

    // Start drag
    component.onDragStart(mockEvent);
    expect(component.isDragging).toBe(true);
    expect(component.dragStartX).toBe(100);
    expect(component.dragStartY).toBe(100);

    // Move drag
    const moveEvent = new MouseEvent('mousemove', { clientX: 150, clientY: 120 });
    vi.spyOn(moveEvent, 'preventDefault');

    component.onDragMove(moveEvent);
    expect(moveEvent.preventDefault).toHaveBeenCalled();
    expect(component.currentX).toBe(50);
    expect(component.currentY).toBe(20);

    // End drag
    component.onDragEnd();
    expect(component.isDragging).toBe(false);
  });
});
