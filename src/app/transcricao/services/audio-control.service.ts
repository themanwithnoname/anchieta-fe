import { Injectable, signal, computed } from '@angular/core';
import { AudioState, DialogoTranscricao } from '../models/transcricao.types';

@Injectable({
  providedIn: 'root'
})
export class AudioControlService {
  
  // Estado reativo do áudio
  private readonly _audioState = signal<AudioState>({
    tocando: false,
    tempoAtual: 0,
    tempoTotal: 3600, // 1 hora padrão
    volume: 75,
    dialogoTocando: null,
    dialogoAtivo: null
  });
  
  // Getter público (readonly)
  readonly audioState = this._audioState.asReadonly();
  
  // Computed values
  readonly progressoPercentual = computed(() => {
    const state = this._audioState();
    return state.tempoTotal > 0 ? (state.tempoAtual / state.tempoTotal) * 100 : 0;
  });
  
  readonly tempoFormatado = computed(() => {
    return {
      atual: this.formatarTempo(this._audioState().tempoAtual),
      total: this.formatarTempo(this._audioState().tempoTotal)
    };
  });
  
  readonly estaDisponivel = signal(true);

  // Timer para simulação de reprodução
  private reproduzindo: boolean = false;
  private intervalId: number | null = null;

  // Métodos de controle básico
  reproduzir() {
    this._audioState.update(state => ({ ...state, tocando: true }));
    this.iniciarSimulacao();
  }
  
  pausar() {
    this._audioState.update(state => ({
      ...state,
      tocando: false,
      dialogoTocando: null
    }));
    this.pararSimulacao();
  }
  
  parar() {
    this._audioState.update(state => ({
      ...state,
      tocando: false,
      tempoAtual: 0,
      dialogoTocando: null,
      dialogoAtivo: null
    }));
    this.pararSimulacao();
  }
  
  alternarReproducao() {
    const tocando = this._audioState().tocando;
    if (tocando) {
      this.pausar();
    } else {
      this.reproduzir();
    }
  }

  // Métodos de navegação
  irParaTempo(segundos: number) {
    this._audioState.update(state => ({
      ...state,
      tempoAtual: Math.max(0, Math.min(segundos, state.tempoTotal))
    }));
  }
  
  irParaPercentual(percentual: number) {
    const state = this._audioState();
    const novoTempo = Math.floor((percentual / 100) * state.tempoTotal);
    this.irParaTempo(novoTempo);
  }
  
  avancar(segundos: number = 10) {
    const state = this._audioState();
    this.irParaTempo(state.tempoAtual + segundos);
  }
  
  retroceder(segundos: number = 10) {
    const state = this._audioState();
    this.irParaTempo(state.tempoAtual - segundos);
  }

  // Métodos para diálogos específicos
  reproduzirDialogo(dialogo: DialogoTranscricao) {
    const state = this._audioState();
    const jaTocando = state.dialogoTocando === dialogo.id;
    
    if (jaTocando) {
      this.pausar();
      return;
    }
    
    this._audioState.update(state => ({
      ...state,
      dialogoTocando: dialogo.id,
      tempoAtual: dialogo.timestampSegundos,
      tocando: true
    }));
    
    this.iniciarSimulacao();
    
    // Parar automaticamente após a duração do diálogo
    setTimeout(() => {
      this._audioState.update(state => ({
        ...state,
        dialogoTocando: null
      }));
    }, dialogo.duracaoSegundos * 1000);
  }
  
  ativarDialogo(index: number) {
    this._audioState.update(state => ({
      ...state,
      dialogoAtivo: state.dialogoAtivo === index ? null : index
    }));
  }

  // Métodos de configuração
  definirVolume(volume: number) {
    this._audioState.update(state => ({
      ...state,
      volume: Math.max(0, Math.min(100, volume))
    }));
  }
  
  definirTempoTotal(segundos: number) {
    this._audioState.update(state => ({
      ...state,
      tempoTotal: Math.max(1, segundos),
      tempoAtual: Math.min(state.tempoAtual, segundos)
    }));
  }
  
  definirDisponibilidade(disponivel: boolean) {
    this.estaDisponivel.set(disponivel);
    if (!disponivel) {
      this.parar();
    }
  }

  // Métodos utilitários para timeline
  obterPosicaoMarker(timestampSegundos: number): number {
    const state = this._audioState();
    return state.tempoTotal > 0 ? (timestampSegundos / state.tempoTotal) * 100 : 0;
  }
  
  calcularTempoClique(event: MouseEvent, elementoLargura: number): number {
    const clickX = event.offsetX;
    const percentual = (clickX / elementoLargura) * 100;
    const state = this._audioState();
    return Math.floor((percentual / 100) * state.tempoTotal);
  }

  // Métodos para formatação
  formatarTempo(segundos: number): string {
    const horas = Math.floor(segundos / 3600);
    const minutos = Math.floor((segundos % 3600) / 60);
    const segs = Math.floor(segundos % 60);
    
    if (horas > 0) {
      return `${horas}:${minutos.toString().padStart(2, '0')}:${segs.toString().padStart(2, '0')}`;
    }
    
    return `${minutos}:${segs.toString().padStart(2, '0')}`;
  }
  
  formatarIntervaloTempo(dialogo: DialogoTranscricao): string {
    const tempoInicio = this.formatarTempo(dialogo.timestampSegundos);
    const tempoFim = this.formatarTempo(dialogo.timestampSegundos + dialogo.duracaoSegundos);
    return `${tempoInicio} - ${tempoFim}`;
  }

  // Métodos para verificação de estado
  estaReproduzinoDialogo(dialogoId: string): boolean {
    return this._audioState().dialogoTocando === dialogoId;
  }
  
  dialogoEstaAtivo(index: number): boolean {
    return this._audioState().dialogoAtivo === index;
  }

  // Métodos privados para simulação
  private iniciarSimulacao() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    
    this.reproduzindo = true;
    
    this.intervalId = window.setInterval(() => {
      if (!this.reproduzindo) return;
      
      this._audioState.update(state => {
        if (!state.tocando || state.tempoAtual >= state.tempoTotal) {
          this.pararSimulacao();
          return { ...state, tocando: false };
        }
        
        return { ...state, tempoAtual: state.tempoAtual + 1 };
      });
    }, 1000);
  }
  
  private pararSimulacao() {
    this.reproduzindo = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  // Cleanup
  ngOnDestroy() {
    this.pararSimulacao();
  }
}