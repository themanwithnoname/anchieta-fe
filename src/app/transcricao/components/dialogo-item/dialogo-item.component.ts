import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DialogoTranscricao, Participante } from '../../models/transcricao.types';
import { TranscricaoStateService } from '../../services/transcricao-state.service';
import { AudioControlService } from '../../services/audio-control.service';

@Component({
  selector: 'app-dialogo-item',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dialogo-item.component.html',
  styleUrl: './dialogo-item.component.scss'
})
export class DialogoItemComponent {
  @Input() dialogo!: DialogoTranscricao;
  @Input() index!: number;
  @Input() participantes: Participante[] = [];
  @Input() modoCompacto = false;
  @Input() termoBusca = '';
  
  @Output() editarParticipante = new EventEmitter<{ index: number, novoParticipante: string }>();
  @Output() adicionarNota = new EventEmitter<{ index: number, nota: string }>();
  @Output() marcar = new EventEmitter<number>();
  @Output() reproduzir = new EventEmitter<DialogoTranscricao>();
  @Output() abrirVideo = new EventEmitter<DialogoTranscricao>();

  // Estado local do componente
  editandoTexto = signal(false);
  textoEdicao = signal('');
  editandoParticipante = signal(false);
  participanteSelecionado = signal('');
  mostrandoHistorico = signal(false);

  constructor(
    private transcricaoState: TranscricaoStateService,
    private audioControl: AudioControlService
  ) {}

  // Computed properties
  get estaEditandoTexto() {
    return this.transcricaoState.uiState().dialogoEditando === this.index;
  }

  get estaReproduzinoAudio() {
    return this.audioControl.estaReproduzinoDialogo(this.dialogo.id);
  }

  get dialogoEstaAtivo() {
    return this.audioControl.dialogoEstaAtivo(this.index);
  }

  get participanteInfo() {
    return this.participantes.find(p => p.nome === this.dialogo.participante);
  }

  get corParticipante() {
    return this.participanteInfo?.cor || '#6b7280';
  }

  get avatarParticipante() {
    return this.participanteInfo?.avatar || this.dialogo.participante.substring(0, 2).toUpperCase();
  }

  get textoComDestaque() {
    if (!this.termoBusca) return this.dialogo.texto;
    return this.transcricaoState.destacarTermoBusca(this.dialogo.texto, this.termoBusca);
  }

  get nivelConfiancaClasse() {
    return `confianca-${this.dialogo.confianca}`;
  }

  get tempoFormatado() {
    return this.audioControl.formatarTempo(this.dialogo.timestampSegundos);
  }

  get intervaloFormatado() {
    return this.audioControl.formatarIntervaloTempo(this.dialogo);
  }

  // Métodos de edição de texto
  iniciarEdicaoTexto() {
    if (this.estaEditandoTexto) {
      this.transcricaoState.cancelarEdicao();
    } else {
      this.transcricaoState.editarDialogo(this.index);
      this.textoEdicao.set(this.dialogo.texto);
    }
  }

  salvarTexto() {
    const novoTexto = this.textoEdicao().trim();
    if (novoTexto && novoTexto !== this.dialogo.texto) {
      this.transcricaoState.salvarDialogo(this.index, novoTexto);
    } else {
      this.transcricaoState.cancelarEdicao();
    }
  }

  cancelarEdicaoTexto() {
    this.transcricaoState.cancelarEdicao();
    this.textoEdicao.set('');
  }

  // Métodos de edição de participante
  iniciarEdicaoParticipante() {
    this.editandoParticipante.set(true);
    this.participanteSelecionado.set(this.dialogo.participante);
  }

  salvarParticipante() {
    const novoParticipante = this.participanteSelecionado().trim();
    if (novoParticipante && novoParticipante !== this.dialogo.participante) {
      this.transcricaoState.alterarParticipante(this.index, novoParticipante);
    }
    this.cancelarEdicaoParticipante();
  }

  cancelarEdicaoParticipante() {
    this.editandoParticipante.set(false);
    this.participanteSelecionado.set('');
  }

  // Métodos de ações
  marcarDialogo() {
    this.transcricaoState.marcarDialogo(this.index);
  }

  reproduzirDialogo() {
    this.audioControl.reproduzirDialogo(this.dialogo);
  }

  ativarDialogo() {
    this.audioControl.ativarDialogo(this.index);
  }

  abrirVideoDialogo() {
    this.abrirVideo.emit(this.dialogo);
  }

  adicionarNotaDialogo() {
    const nota = prompt('Digite uma nota para este diálogo:');
    if (nota?.trim()) {
      this.transcricaoState.adicionarNota(this.index, nota.trim());
    }
  }

  // Métodos utilitários
  alternarHistorico() {
    this.mostrandoHistorico.set(!this.mostrandoHistorico());
  }

  obterIconeAlteracao(tipo: string): string {
    const icones = {
      'texto': '📝',
      'participante': '👤', 
      'timestamp': '⏰',
      'nota': '📋'
    };
    return icones[tipo as keyof typeof icones] || '✏️';
  }

  // Métodos para keyboard navigation
  onKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' && event.ctrlKey) {
      this.salvarTexto();
    } else if (event.key === 'Escape') {
      this.cancelarEdicaoTexto();
    }
  }
}
