import { Directive, ElementRef, Input, HostListener, Renderer2, OnInit } from '@angular/core';

// ==================== CLICK OUTSIDE ====================
@Directive({
  selector: '[clickOutside]',
  standalone: true
})
export class ClickOutsideDirective {
  @Input() clickOutside!: () => void;

  constructor(private elementRef: ElementRef) {}

  @HostListener('document:click', ['$event'])
  onClick(event: MouseEvent) {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.clickOutside();
    }
  }
}

// ==================== AUTO FOCUS ====================
@Directive({
  selector: '[autoFocus]',
  standalone: true
})
export class AutoFocusDirective implements OnInit {
  @Input() autoFocus: boolean = true;
  @Input() delay: number = 0;

  constructor(private elementRef: ElementRef) {}

  ngOnInit() {
    if (this.autoFocus) {
      setTimeout(() => {
        this.elementRef.nativeElement.focus();
      }, this.delay);
    }
  }
}

// ==================== TOOLTIP SIMPLES ====================
@Directive({
  selector: '[tooltip]',
  standalone: true
})
export class TooltipDirective {
  @Input() tooltip: string = '';
  @Input() tooltipPosition: 'top' | 'bottom' | 'left' | 'right' = 'top';

  private tooltipElement: HTMLElement | null = null;

  constructor(
    private elementRef: ElementRef,
    private renderer: Renderer2
  ) {}

  @HostListener('mouseenter')
  onMouseEnter() {
    if (!this.tooltip) return;

    this.createTooltip();
  }

  @HostListener('mouseleave')
  onMouseLeave() {
    this.removeTooltip();
  }

  private createTooltip() {
    this.tooltipElement = this.renderer.createElement('div');
    this.renderer.addClass(this.tooltipElement, 'tooltip-transcricao');
    this.renderer.addClass(this.tooltipElement, `tooltip-${this.tooltipPosition}`);
    this.renderer.setProperty(this.tooltipElement, 'textContent', this.tooltip);
    
    // Estilos básicos
    this.renderer.setStyle(this.tooltipElement, 'position', 'absolute');
    this.renderer.setStyle(this.tooltipElement, 'background', '#1e293b');
    this.renderer.setStyle(this.tooltipElement, 'color', 'white');
    this.renderer.setStyle(this.tooltipElement, 'padding', '4px 8px');
    this.renderer.setStyle(this.tooltipElement, 'border-radius', '4px');
    this.renderer.setStyle(this.tooltipElement, 'font-size', '12px');
    this.renderer.setStyle(this.tooltipElement, 'z-index', '1000');
    this.renderer.setStyle(this.tooltipElement, 'white-space', 'nowrap');

    this.renderer.appendChild(document.body, this.tooltipElement);
    this.positionTooltip();
  }

  private positionTooltip() {
    if (!this.tooltipElement) return;

    const hostRect = this.elementRef.nativeElement.getBoundingClientRect();
    const tooltipRect = this.tooltipElement.getBoundingClientRect();

    let top = 0;
    let left = 0;

    switch (this.tooltipPosition) {
      case 'top':
        top = hostRect.top - tooltipRect.height - 8;
        left = hostRect.left + (hostRect.width / 2) - (tooltipRect.width / 2);
        break;
      case 'bottom':
        top = hostRect.bottom + 8;
        left = hostRect.left + (hostRect.width / 2) - (tooltipRect.width / 2);
        break;
      case 'left':
        top = hostRect.top + (hostRect.height / 2) - (tooltipRect.height / 2);
        left = hostRect.left - tooltipRect.width - 8;
        break;
      case 'right':
        top = hostRect.top + (hostRect.height / 2) - (tooltipRect.height / 2);
        left = hostRect.right + 8;
        break;
    }

    this.renderer.setStyle(this.tooltipElement, 'top', `${top + window.scrollY}px`);
    this.renderer.setStyle(this.tooltipElement, 'left', `${left + window.scrollX}px`);
  }

  private removeTooltip() {
    if (this.tooltipElement) {
      this.renderer.removeChild(document.body, this.tooltipElement);
      this.tooltipElement = null;
    }
  }
}

// ==================== LOADING STATE ====================
@Directive({
  selector: '[loading]',
  standalone: true
})
export class LoadingDirective {
  @Input() set loading(isLoading: boolean) {
    this.toggleLoading(isLoading);
  }

  private originalContent: string = '';
  private isCurrentlyLoading = false;

  constructor(
    private elementRef: ElementRef,
    private renderer: Renderer2
  ) {}

  private toggleLoading(isLoading: boolean) {
    if (isLoading && !this.isCurrentlyLoading) {
      this.showLoading();
    } else if (!isLoading && this.isCurrentlyLoading) {
      this.hideLoading();
    }
  }

  private showLoading() {
    this.originalContent = this.elementRef.nativeElement.innerHTML;
    this.isCurrentlyLoading = true;
    
    this.renderer.addClass(this.elementRef.nativeElement, 'loading-state');
    this.renderer.setProperty(this.elementRef.nativeElement, 'disabled', true);
    this.renderer.setProperty(
      this.elementRef.nativeElement, 
      'innerHTML', 
      '<div class="loading-transcricao"></div>'
    );
  }

  private hideLoading() {
    this.isCurrentlyLoading = false;
    
    this.renderer.removeClass(this.elementRef.nativeElement, 'loading-state');
    this.renderer.setProperty(this.elementRef.nativeElement, 'disabled', false);
    this.renderer.setProperty(
      this.elementRef.nativeElement, 
      'innerHTML', 
      this.originalContent
    );
  }
}

// ==================== HIGHLIGHT ON CHANGE ====================
@Directive({
  selector: '[highlightChange]',
  standalone: true
})
export class HighlightChangeDirective {
  @Input() highlightChange: any;
  @Input() highlightColor: string = '#fef3c7';
  @Input() highlightDuration: number = 2000;

  private previousValue: any;

  constructor(
    private elementRef: ElementRef,
    private renderer: Renderer2
  ) {}

  ngOnInit() {
    this.previousValue = this.highlightChange;
  }

  ngOnChanges() {
    if (this.previousValue !== this.highlightChange && this.previousValue !== undefined) {
      this.highlight();
    }
    this.previousValue = this.highlightChange;
  }

  private highlight() {
    const originalBackground = this.elementRef.nativeElement.style.backgroundColor;
    
    // Aplicar highlight
    this.renderer.setStyle(
      this.elementRef.nativeElement, 
      'background-color', 
      this.highlightColor
    );
    this.renderer.setStyle(
      this.elementRef.nativeElement, 
      'transition', 
      'background-color 0.3s ease'
    );

    // Remover highlight após duração
    setTimeout(() => {
      this.renderer.setStyle(
        this.elementRef.nativeElement, 
        'background-color', 
        originalBackground
      );
    }, this.highlightDuration);
  }
}

// ==================== KEYBOARD SHORTCUTS ====================
@Directive({
  selector: '[shortcut]',
  standalone: true
})
export class ShortcutDirective {
  @Input() shortcut: string = '';
  @Input() shortcutAction!: () => void;

  @HostListener('keydown', ['$event'])
  onKeyDown(event: KeyboardEvent) {
    if (this.matchesShortcut(event)) {
      event.preventDefault();
      this.shortcutAction();
    }
  }

  private matchesShortcut(event: KeyboardEvent): boolean {
    const shortcut = this.shortcut.toLowerCase();
    const keys = shortcut.split('+');
    
    let matches = true;
    
    keys.forEach(key => {
      switch(key.trim()) {
        case 'ctrl':
        case 'control':
          matches = matches && event.ctrlKey;
          break;
        case 'shift':
          matches = matches && event.shiftKey;
          break;
        case 'alt':
          matches = matches && event.altKey;
          break;
        case 'meta':
        case 'cmd':
          matches = matches && event.metaKey;
          break;
        default:
          matches = matches && event.key.toLowerCase() === key;
      }
    });

    return matches;
  }
}

// ==================== RESIZE OBSERVER ====================
@Directive({
  selector: '[observeResize]',
  standalone: true
})
export class ResizeObserverDirective implements OnInit {
  @Input() observeResize!: (entry: ResizeObserverEntry) => void;

  private resizeObserver?: ResizeObserver;

  constructor(private elementRef: ElementRef) {}

  ngOnInit() {
    if ('ResizeObserver' in window) {
      this.resizeObserver = new ResizeObserver(entries => {
        entries.forEach(entry => {
          this.observeResize(entry);
        });
      });

      this.resizeObserver.observe(this.elementRef.nativeElement);
    }
  }

  ngOnDestroy() {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
  }
}

// ==================== EXPORTAR TODAS AS DIRETIVAS ====================
export const TRANSCRICAO_DIRECTIVES = [
  ClickOutsideDirective,
  AutoFocusDirective,
  TooltipDirective,
  LoadingDirective,
  HighlightChangeDirective,
  ShortcutDirective,
  ResizeObserverDirective
] as const;