import { Component, Input, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DialogoTranscricao } from '../../models/transcricao.types';
import { AudioControlService } from '../../services/audio-control.service';

@Component({
  selector: 'app-audio-timeline',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './audio-timeline.component.html',
  styleUrl: './audio-timeline.component.scss'
})
export class AudioTimelineComponent {
  @Input() dialogos: DialogoTranscricao[] = [];
  @Input() showControls = true;
  @Input() compacto = false;
  
  @ViewChild('progressBar') progressBar!: ElementRef<HTMLDivElement>;

  constructor(private audioControl: AudioControlService) {}

  // Getters para acessar estado do áudio
  get audioState() {
    return this.audioControl.audioState();
  }

  get tempoFormatado() {
    return this.audioControl.tempoFormatado();
  }

  get progressoPercentual() {
    return this.audioControl.progressoPercentual();
  }

  get estaDisponivel() {
    return this.audioControl.estaDisponivel();
  }

  get volumeIcon() {
    const volume = this.audioState.volume;
    if (volume === 0) return 'fa-volume-mute';
    if (volume < 30) return 'fa-volume-down';
    if (volume < 70) return 'fa-volume-up';
    return 'fa-volume-up';
  }

  // Métodos de controle
  alternarReproducao() {
    this.audioControl.alternarReproducao();
  }

  pararAudio() {
    this.audioControl.parar();
  }

  avancarTempo() {
    this.audioControl.avancar(10);
  }

  retrocederTempo() {
    this.audioControl.retroceder(10);
  }

  ajustarVolume(event: Event) {
    const input = event.target as HTMLInputElement;
    this.audioControl.definirVolume(Number(input.value));
  }

  // Navegação na timeline
  onProgressClick(event: MouseEvent) {
    if (!this.progressBar) return;
    
    const rect = this.progressBar.nativeElement.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const largura = rect.width;
    const percentual = (clickX / largura) * 100;
    
    this.audioControl.irParaPercentual(Math.max(0, Math.min(100, percentual)));
  }

  // Marcadores de diálogos na timeline
  obterPosicaoMarker(dialogo: DialogoTranscricao): number {
    return this.audioControl.obterPosicaoMarker(dialogo.timestampSegundos);
  }

  reproduzirDialogo(dialogo: DialogoTranscricao) {
    this.audioControl.reproduzirDialogo(dialogo);
  }

  // Formatação de tempo
  formatarTempo(segundos: number): string {
    return this.audioControl.formatarTempo(segundos);
  }

  // Verificações de estado
  dialogoEstaReproduziindo(dialogo: DialogoTranscricao): boolean {
    return this.audioControl.estaReproduzinoDialogo(dialogo.id);
  }

  // Métodos para keyboard shortcuts
  onKeydown(event: KeyboardEvent) {
    switch (event.code) {
      case 'Space':
        event.preventDefault();
        this.alternarReproducao();
        break;
      case 'ArrowLeft':
        event.preventDefault();
        this.retrocederTempo();
        break;
      case 'ArrowRight':
        event.preventDefault();
        this.avancarTempo();
        break;
      case 'ArrowUp':
        event.preventDefault();
        const volumeAtual = this.audioState.volume;
        this.audioControl.definirVolume(Math.min(100, volumeAtual + 5));
        break;
      case 'ArrowDown':
        event.preventDefault();
        const volumeAtualDown = this.audioState.volume;
        this.audioControl.definirVolume(Math.max(0, volumeAtualDown - 5));
        break;
    }
  }
}
