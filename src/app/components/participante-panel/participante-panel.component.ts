import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ParticipanteColorService } from '../../services/participante-color.service';
import { Participante } from '../../transcricao/models/transcricao.types';

@Component({
  selector: 'app-participante-panel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './participante-panel.component.html',
  styleUrl: './participante-panel.component.scss'
})
export class ParticipantePanelComponent {
  @Input() participantes: Participante[] = [];
  @Input() painelVisivel: boolean = true;
  @Input() alteracoesHistorico: any[] = [];
  @Input() totalDialogos: number = 0;

  @Output() alternarPainel = new EventEmitter<void>();
  @Output() editarParticipante = new EventEmitter<Participante>();

  private participanteColorService = inject(ParticipanteColorService);

  getCorParticipante(nome: string): string {
    return this.participanteColorService.obterCorParticipante(nome);
  }

  onAlternarPainel(): void {
    this.alternarPainel.emit();
  }

  onEditarParticipante(participante: Participante): void {
    this.editarParticipante.emit(participante);
  }

  getHistoricoRecente(): any[] {
    return this.alteracoesHistorico.slice(0, 10);
  }
}