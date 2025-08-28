import { Component, Input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// Imports super limpos
import { DialogoTranscricao, Participante } from '../models/transcricao.types';
import { TRANSCRICAO_PIPES } from '../pipes/transcricao.pipes';
import { TRANSCRICAO_DIRECTIVES } from '../directives/transcricao.directives';
import { ValidacaoUtils } from '../utils/transcricao.utils';

@Component({
  selector: 'app-dialogo-ultra-limpo',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    ...TRANSCRICAO_PIPES, 
    ...TRANSCRICAO_DIRECTIVES
  ],
  template: `
    <div class="dialogo-item card-transcricao" 
         [class.editando]="editando()"
         [class.marcado]="dialogo.marcado"
         [highlightChange]="dialogo.texto">

      <!-- Mode Compacto -->
      <div *ngIf="compacto" class="flex items-center gap-sm">
        <div class="avatar-transcricao" 
             [style.background-color]="participante?.cor"
             tooltip="{{participante?.nome}} - {{participante?.tipo}}">
          {{ participante?.nome | avatar }}
        </div>
        
        <div class="flex-1">
          <span class="font-medium">{{ dialogo.participante }}:</span>
          <span [innerHTML]="dialogo.texto | destacarBusca:termoBusca"></span>
        </div>
        
        <div class="text-xs text-secondary">
          {{ dialogo.timestampSegundos | tempo }}
        </div>
      </div>

      <!-- Modo Detalhado -->
      <div *ngIf="!compacto" class="dialogo-detalhado">
        
        <!-- Header -->
        <header class="flex justify-between items-center mb-sm">
          <div class="flex items-center gap-sm">
            <div class="avatar-transcricao" 
                 [style.background-color]="participante?.cor"
                 tooltip="{{participante?.tipo}}">
              {{ participante?.nome | avatar }}
            </div>
            
            <div>
              <div class="font-medium cursor-pointer" 
                   (click)="editando.set(!editando())">
                {{ dialogo.participante }}
              </div>
              <div class="text-xs text-secondary">
                {{ participante?.tipo }}
              </div>
            </div>
          </div>

          <div class="flex items-center gap-xs text-xs text-secondary">
            <span tooltip="{{dialogo | intervaloTempo}}">
              {{ dialogo.timestampSegundos | tempo }}
            </span>
            
            <div class="badge-transcricao"
                 [class]="'confianca-' + (dialogo.confiancaValor | nivelConfianca)">
              {{ dialogo.confiancaValor | percent:'1.0-0' }}
            </div>
            
            <span *ngIf="dialogo.revisado" 
                  class="text-success" 
                  tooltip="Revisado">✓</span>
            
            <span *ngIf="dialogo.nota" 
                  tooltip="{{dialogo.nota}}">📋</span>
          </div>
        </header>

        <!-- Conteúdo -->
        <main class="dialogo-conteudo">
          <!-- Texto Normal -->
          <div *ngIf="!editando()" 
               class="cursor-pointer p-xs rounded hover:bg-gray-50"
               (click)="iniciarEdicao()">
            <p [innerHTML]="dialogo.texto | destacarBusca:termoBusca"></p>
          </div>

          <!-- Texto Editando -->
          <div *ngIf="editando()" 
               (clickOutside)="cancelarEdicao()">
            <textarea 
              [(ngModel)]="textoEdicao"
              class="input-transcricao"
              rows="3"
              autoFocus
              shortcut="ctrl+enter"
              [shortcutAction]="salvarEdicao"
              shortcut="escape"
              [shortcutAction]="cancelarEdicao">
            </textarea>
            
            <div class="flex justify-end gap-xs mt-xs">
              <button class="btn-transcricao ghost sm" 
                      (click)="cancelarEdicao()">
                Cancelar
              </button>
              <button class="btn-transcricao primary sm" 
                      (click)="salvarEdicao()"
                      [loading]="salvando()">
                Salvar
              </button>
            </div>
            
            <div class="text-xs text-muted mt-xs">
              <i class="fas fa-info-circle"></i>
              Ctrl+Enter para salvar, Esc para cancelar
            </div>
          </div>
        </main>

        <!-- Ações -->
        <footer class="flex justify-between items-center mt-sm pt-xs border-t border-gray-100">
          <div class="flex gap-xs">
            <button class="btn-transcricao ghost sm" 
                    tooltip="Reproduzir áudio"
                    (click)="onReproducao.emit(dialogo)">
              <i class="fas fa-play"></i>
            </button>
            
            <button class="btn-transcricao ghost sm"
                    tooltip="Marcar/Desmarcar" 
                    [class.text-warning]="dialogo.marcado"
                    (click)="onMarcar.emit()">
              <i class="fas fa-bookmark"></i>
            </button>
            
            <button class="btn-transcricao ghost sm"
                    tooltip="Adicionar nota"
                    [class.text-info]="dialogo.nota"
                    (click)="adicionarNota()">
              <i class="fas fa-sticky-note"></i>
            </button>
          </div>

          <div class="text-xs text-muted">
            {{ alteracoes().length | pluralizar:'alteração':'alterações' }}
          </div>
        </footer>

      </div>
    </div>
  `,
  styles: [`
    .dialogo-item {
      transition: all var(--transition-fast);
      
      &.editando {
        border-color: var(--transcricao-primary);
        box-shadow: 0 0 0 3px var(--transcricao-primary-light);
      }
      
      &.marcado {
        border-left: 4px solid var(--transcricao-warning);
      }
    }
  `]
})
export class DialogoItemUltraLimpoComponent {
  @Input() dialogo!: DialogoTranscricao;
  @Input() participante?: Participante;
  @Input() compacto = false;
  @Input() termoBusca = '';

  // Outputs tipados
  @Output() onTextoChange = new EventEmitter<string>();
  @Output() onReproducao = new EventEmitter<DialogoTranscricao>();
  @Output() onMarcar = new EventEmitter<void>();

  // Estado minimal com signals
  editando = signal(false);
  textoEdicao = signal('');
  salvando = signal(false);

  // Computed
  alteracoes = computed(() => this.dialogo.alteracoes || []);
  valido = computed(() => ValidacaoUtils.validarDialogo(this.dialogo).valido);

  // Métodos super limpos
  iniciarEdicao = () => {
    this.editando.set(true);
    this.textoEdicao.set(this.dialogo.texto);
  };

  cancelarEdicao = () => {
    this.editando.set(false);
    this.textoEdicao.set('');
  };

  salvarEdicao = async () => {
    const novoTexto = this.textoEdicao().trim();
    if (!novoTexto || novoTexto === this.dialogo.texto) {
      this.cancelarEdicao();
      return;
    }

    this.salvando.set(true);
    
    // Simular delay de salvamento
    await new Promise(resolve => setTimeout(resolve, 500));
    
    this.onTextoChange.emit(novoTexto);
    this.salvando.set(false);
    this.editando.set(false);
  };

  adicionarNota = () => {
    const nota = prompt('Digite uma nota:')?.trim();
    if (nota) {
      // Emit event para componente pai
      console.log('Nota adicionada:', nota);
    }
  };
}

// ==================== EXEMPLO DE USO ====================
/*
<app-dialogo-ultra-limpo
  [dialogo]="dialogo"
  [participante]="participante"
  [compacto]="modo === 'compacto'"
  [termoBusca]="busca"
  (onTextoChange)="salvarTexto($event)"
  (onReproducao)="reproduzirAudio($event)"
  (onMarcar)="marcarDialogo()">
</app-dialogo-ultra-limpo>
*/