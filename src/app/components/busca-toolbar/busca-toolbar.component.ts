import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-busca-toolbar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './busca-toolbar.component.html',
  styleUrl: './busca-toolbar.component.scss'
})
export class BuscaToolbarComponent {
  @Input() termoBusca: string = '';
  @Input() modoVisualizacaoCompacto: boolean = false;
  @Input() resultadosCount: number = 0;
  @Input() resultadoAtual: number = 0;

  @Output() termoBuscaChange = new EventEmitter<string>();
  @Output() buscarNaTranscricao = new EventEmitter<void>();
  @Output() limparBusca = new EventEmitter<void>();
  @Output() alternarModoVisualizacao = new EventEmitter<void>();
  @Output() irParaResultado = new EventEmitter<'anterior' | 'proximo'>();

  onTermoBuscaChange(valor: string): void {
    this.termoBusca = valor;
    this.termoBuscaChange.emit(valor);
  }

  onBuscar(): void {
    this.buscarNaTranscricao.emit();
  }

  onLimparBusca(): void {
    this.limparBusca.emit();
  }

  onAlternarModoVisualizacao(): void {
    this.alternarModoVisualizacao.emit();
  }

  onIrParaResultadoAnterior(): void {
    this.irParaResultado.emit('anterior');
  }

  onIrParaResultadoProximo(): void {
    this.irParaResultado.emit('proximo');
  }
}