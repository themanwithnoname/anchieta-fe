import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ParticipanteColorService } from '../../services/participante-color.service';
import { DialogoTranscricao } from '../../transcricao/models/transcricao.types';

@Component({
  selector: 'app-dialogos-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dialogos-list.component.html',
  styleUrl: './dialogos-list.component.scss'
})
export class DialogosListComponent {
  @Input() dialogos: DialogoTranscricao[] = [];
  @Input() modoVisualizacaoCompacto: boolean = false;
  @Input() modoEdicaoLocutor: boolean = false;
  @Input() termoBusca: string = '';
  
  @Output() editarDialogo = new EventEmitter<number>();
  @Output() iniciarTrocaLocutor = new EventEmitter<number>();
  @Output() abrirEdicaoLocutor = new EventEmitter<string>();
  @Output() abrirVideoEmJanela = new EventEmitter<DialogoTranscricao>();

  private participanteColorService = inject(ParticipanteColorService);

  formatarNomeParticipante(nome: string): string {
    return this.participanteColorService.formatarNomeParticipante(nome);
  }

  getCorParticipante(nome: string): string {
    return this.participanteColorService.obterCorParticipante(nome);
  }

  formatarIntervaloTempo(dialogo: DialogoTranscricao): string {
    const tempoInicio = this.formatarTempo(dialogo.timestampSegundos);
    const tempoFim = this.formatarTempo(dialogo.timestampSegundos + dialogo.duracaoSegundos);
    return `${tempoInicio} - ${tempoFim}`;
  }

  private formatarTempo(segundos: number): string {
    const horas = Math.floor(segundos / 3600);
    const minutos = Math.floor((segundos % 3600) / 60);
    const segs = Math.floor(segundos % 60);
    return `${horas.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}:${segs.toString().padStart(2, '0')}`;
  }

  destacarTermoBusca(texto: string): string {
    if (!this.termoBusca.trim()) {
      return texto;
    }
    const regex = new RegExp(`(${this.termoBusca})`, 'gi');
    return texto.replace(regex, '<span class="highlight">$1</span>');
  }

  onEditarDialogo(index: number): void {
    this.editarDialogo.emit(index);
  }

  onIniciarTrocaLocutor(index: number): void {
    this.iniciarTrocaLocutor.emit(index);
  }

  onAbrirEdicaoLocutor(participante: string): void {
    this.abrirEdicaoLocutor.emit(participante);
  }

  onAbrirVideoEmJanela(dialogo: DialogoTranscricao): void {
    this.abrirVideoEmJanela.emit(dialogo);
  }
}