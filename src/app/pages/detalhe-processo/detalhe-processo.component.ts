import { Component, inject, OnInit, OnDestroy, signal, ViewChild, ElementRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DialogoTranscricao, NivelConfianca } from '../../transcricao/models/transcricao.types';
import { TranscricaoService, DialogoProcessado } from '../../services/transcricao.service';

interface ParticipanteDetalhes {
  id: string;
  nome: string;
  papel: string;
  cor: string;
}

interface MensagemChat {
  id: string;
  autor: string;
  texto: string;
  timestamp: number;
  proprio: boolean;
}

// Interface simplificada para os diálogos
interface DialogoDetalhe {
  id: string;
  participanteId: string;
  participanteObj?: ParticipanteDetalhes;
  timestampInicio: number;
  timestampFim: number;
  texto: string;
  observacoes?: string;
  nivelConfianca: NivelConfianca;
  percentualConfianca: number;
  isContexto?: boolean; // Para marcar diálogos de contexto no filtro
}

@Component({
  selector: 'app-detalhe-processo',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './detalhe-processo.component.html',
  styleUrl: './detalhe-processo.component.scss'
})
export class DetalheProcessoComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private transcricaoService = inject(TranscricaoService);
  
  @ViewChild('videoPlayer') videoPlayer!: ElementRef<HTMLVideoElement>;
  @ViewChild('dialogosContainer') dialogosContainer!: ElementRef<HTMLDivElement>;
  @ViewChild('chatContainer') chatContainer!: ElementRef<HTMLDivElement>;
  @ViewChild('inputNome') inputNome!: ElementRef<HTMLInputElement>;
  
  // Dados básicos
  numeroProcesso = signal<string>('');
  duracaoTotal = signal<string>('01:23:45');
  urlVideo = signal<string>('');
  carregando = signal<boolean>(false);
  
  // Controles de reprodução
  reproduzindo = signal<boolean>(false);
  timestampAtual = signal<number>(0);
  progressoPercent = signal<number>(0);
  
  // Busca
  mostrarBusca = signal<boolean>(false);
  termoBusca = signal<string>('');
  resultadosBusca = signal<number>(0);
  
  // Edição
  modoEdicao = signal<boolean>(false);
  dialogoEditando = signal<string | null>(null);
  
  // Edição de participantes
  participanteEditando = signal<string | null>(null);
  nomeEditando = signal<string>('');
  papelEditando = signal<string>('');
  
  // Participantes e diálogos (carregados dinamicamente)
  participantes = signal<ParticipanteDetalhes[]>([]);
  dialogos = signal<DialogoDetalhe[]>([]);
  
  // Filtro por participante
  participanteFiltrado = signal<string | null>(null);
  dialogosFiltrados = signal<DialogoDetalhe[]>([]);
  
  // Chat
  mensagensChat = signal<MensagemChat[]>([
    {
      id: '1',
      autor: 'Sistema',
      texto: 'Bem-vindo ao chat de dúvidas sobre a transcrição!',
      timestamp: Date.now() - 300000,
      proprio: false
    }
  ]);
  novaMensagem = signal<string>('');
  
  // Controle de reprodução de segmento
  private timeoutSegmento: any;
  private scrollThrottle: any;
  reproduzindoSegmento = signal<boolean>(false);
  
  ngOnInit() {
    const numero = this.route.snapshot.paramMap.get('numero');
    if (numero) {
      this.numeroProcesso.set(numero);
      this.carregarDadosProcesso(numero);
    }
    
    // Simular progresso de reprodução
    setInterval(() => {
      if (this.reproduzindo()) {
        const novoTempo = this.timestampAtual() + 1;
        this.timestampAtual.set(novoTempo);
        this.progressoPercent.set((novoTempo / 5025) * 100); // 5025 = duração total em segundos
      }
    }, 1000);
  }

  private carregarDadosProcesso(numeroProcesso: string): void {
    this.carregando.set(true);
    
    // Mapear número do processo para arquivos correspondentes
    const mapeamentoArquivos = this.obterArquivosProcesso(numeroProcesso);
    
    if (mapeamentoArquivos) {
      // Definir URL do vídeo
      this.urlVideo.set(mapeamentoArquivos.video);
      
      // Carregar transcrição
      this.transcricaoService.carregarTranscricao(mapeamentoArquivos.transcricao)
        .subscribe({
          next: (dialogos) => {
            this.processarDialogos(dialogos);
            this.carregando.set(false);
          },
          error: (error) => {
            console.error('Erro ao carregar transcrição:', error);
            this.carregando.set(false);
          }
        });
    } else {
      this.carregando.set(false);
    }
  }

  private obterArquivosProcesso(numeroProcesso: string): { video: string, transcricao: string } | null {
    // Mapeamento baseado nos processos configurados
    const mapeamentos: { [key: string]: { video: string, transcricao: string } } = {
      '1001234-56.2023.5.02.0001': {
        video: 'assets/videos/01d83e38-77b9-4185-80e1-020c2e23b9c9.mp4',
        transcricao: 'assets/videos/01d83e38-77b9-4185-80e1-020c2e23b9c9.txt'
      },
      '1002345-67.2023.5.02.0002': {
        video: 'assets/videos/0b451510-12da-4282-8a84-a900d5cc495d.mp4',
        transcricao: 'assets/videos/0b451510-12da-4282-8a84-a900d5cc495d.txt'
      }
    };
    
    return mapeamentos[numeroProcesso] || null;
  }

  private processarDialogos(dialogosProcessados: DialogoProcessado[]): void {
    // Gerar participantes únicos com cores
    const participantesUnicos = this.transcricaoService.obterParticipantesUnicos(dialogosProcessados);
    const coresParticipantes = ['#8B4513', '#FF6B35', '#4ECDC4', '#45B7D1', '#96CEB4', '#E74C3C'];
    
    const participantesComCores = participantesUnicos.map((nome, index) => ({
      id: (index + 1).toString(),
      nome: nome,
      papel: this.determinarPapel(nome),
      cor: coresParticipantes[index % coresParticipantes.length]
    }));
    
    this.participantes.set(participantesComCores);
    
    // Converter para formato DialogoDetalhe
    const dialogosConvertidos: DialogoDetalhe[] = dialogosProcessados.map(dialogo => {
      const participante = participantesComCores.find(p => p.nome === dialogo.participanteNome);
      
      return {
        id: dialogo.id,
        participanteId: participante?.id || '1',
        participanteObj: participante,
        timestampInicio: dialogo.timestampInicio,
        timestampFim: dialogo.timestampFim,
        texto: dialogo.texto,
        observacoes: '',
        nivelConfianca: dialogo.nivelConfianca,
        percentualConfianca: dialogo.percentualConfianca
      };
    });
    
    this.dialogos.set(dialogosConvertidos);
    
    // Calcular duração total
    if (dialogosConvertidos.length > 0) {
      const ultimoDialogo = dialogosConvertidos[dialogosConvertidos.length - 1];
      const duracaoSegundos = ultimoDialogo.timestampFim;
      this.duracaoTotal.set(this.formatarTimestamp(duracaoSegundos));
    }
  }

  private determinarPapel(nomeParticipante: string): string {
    const nome = nomeParticipante.toLowerCase();
    
    if (nome.includes('juiz') || nome.includes('excelência')) {
      return 'Juiz';
    } else if (nome.includes('advogado') || nome.includes('advogada') || nome.includes('doutora')) {
      return 'Advogado';
    } else if (nome.includes('reclamante') || nome.includes('depoente')) {
      return 'Requerente';
    } else if (nome.includes('interrogador')) {
      return 'Juiz';
    }
    
    return 'Participante';
  }
  
  // ==================== CONTROLES DE REPRODUÇÃO ====================
  toggleReproducao(): void {
    this.reproduzindo.set(!this.reproduzindo());
    if (this.videoPlayer) {
      if (this.reproduzindo()) {
        this.videoPlayer.nativeElement.play();
      } else {
        this.videoPlayer.nativeElement.pause();
      }
    }
  }
  
  navegarPara(timestamp: number): void {
    this.timestampAtual.set(timestamp);
    if (this.videoPlayer) {
      this.videoPlayer.nativeElement.currentTime = timestamp;
    }
    this.scrollParaDialogo(timestamp);
  }

  reproduzirDialogo(dialogo: DialogoDetalhe): void {
    if (!this.videoPlayer) return;
    
    const video = this.videoPlayer.nativeElement;
    
    // Limpar timeout anterior se existir
    if (this.timeoutSegmento) {
      clearTimeout(this.timeoutSegmento);
    }
    
    // Pausar vídeo se estiver reproduzindo
    if (!video.paused) {
      video.pause();
    }
    
    // Navegar para o início do diálogo
    video.currentTime = dialogo.timestampInicio;
    this.timestampAtual.set(dialogo.timestampInicio);
    
    // Marcar como reproduzindo segmento
    this.reproduzindoSegmento.set(true);
    this.reproduzindo.set(true);
    
    // Iniciar reprodução
    video.play().then(() => {
      // Calcular duração do diálogo
      const duracao = (dialogo.timestampFim - dialogo.timestampInicio) * 1000; // em milissegundos
      
      // Definir timeout para pausar no final
      this.timeoutSegmento = setTimeout(() => {
        video.pause();
        this.reproduzindo.set(false);
        this.reproduzindoSegmento.set(false);
        this.timeoutSegmento = null;
      }, duracao);
    }).catch(error => {
      console.error('Erro ao reproduzir vídeo:', error);
      this.reproduzindoSegmento.set(false);
    });
    
    // Scroll para o diálogo ativo
    this.scrollParaDialogo(dialogo.timestampInicio);
  }
  
  navegarParaTempo(event: MouseEvent): void {
    const barra = event.currentTarget as HTMLElement;
    const rect = barra.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const novoTempo = (clickX / rect.width) * 5025;
    this.navegarPara(novoTempo);
  }
  
  atualizarTempo(event: Event): void {
    const video = event.target as HTMLVideoElement;
    this.timestampAtual.set(video.currentTime);
    this.progressoPercent.set((video.currentTime / video.duration) * 100);
    
    // Scroll automático para manter o diálogo ativo no centro
    this.scrollParaDialogoAtivo();
  }
  
  videoCarregado(event: Event): void {
    const video = event.target as HTMLVideoElement;
    const duracaoFormatada = this.formatarTimestamp(video.duration);
    this.duracaoTotal.set(duracaoFormatada);
  }
  
  // ==================== BUSCA ====================
  toggleBusca(): void {
    this.mostrarBusca.set(!this.mostrarBusca());
    if (!this.mostrarBusca()) {
      this.termoBusca.set('');
      this.resultadosBusca.set(0);
    }
  }
  
  buscarNaTranscricao(): void {
    const termo = this.termoBusca().toLowerCase();
    if (termo) {
      const resultados = this.dialogos().filter(dialogo => 
        dialogo.texto.toLowerCase().includes(termo)
      ).length;
      this.resultadosBusca.set(resultados);
    } else {
      this.resultadosBusca.set(0);
    }
  }
  
  destacarBusca(texto: string): string {
    const termo = this.termoBusca();
    if (!termo) return texto;
    
    const regex = new RegExp(`(${termo})`, 'gi');
    return texto.replace(regex, '<mark class="destaque-busca">$1</mark>');
  }
  
  // ==================== EDIÇÃO ====================
  toggleEdicao(): void {
    this.modoEdicao.set(!this.modoEdicao());
    if (!this.modoEdicao()) {
      this.dialogoEditando.set(null);
    }
  }
  
  iniciarEdicao(dialogo: DialogoDetalhe): void {
    if (this.modoEdicao()) {
      this.dialogoEditando.set(dialogo.id);
    }
  }
  
  salvarEdicaoDialogo(dialogo: DialogoDetalhe): void {
    this.dialogoEditando.set(null);
    // Aqui você salvaria as alterações no backend
    console.log('Salvando edição:', dialogo);
  }
  
  atualizarParticipante(dialogo: DialogoDetalhe): void {
    const participante = this.participantes().find(p => p.id === dialogo.participanteId);
    if (participante) {
      dialogo.participanteObj = participante;
    }
  }
  
  salvarTranscricao(): void {
    console.log('Salvando transcrição completa:', this.dialogos());
    alert('Transcrição salva com sucesso!');
  }
  
  // ==================== EDIÇÃO DE PARTICIPANTES ====================
  iniciarEdicaoParticipante(participante: ParticipanteDetalhes): void {
    this.participanteEditando.set(participante.id);
    this.nomeEditando.set(participante.nome);
    this.papelEditando.set(participante.papel);
    
    // Focar no input após a próxima atualização do DOM
    setTimeout(() => {
      if (this.inputNome) {
        this.inputNome.nativeElement.focus();
        this.inputNome.nativeElement.select();
      }
    }, 0);
  }
  
  salvarEdicaoParticipante(participante: ParticipanteDetalhes): void {
    const novoNome = this.nomeEditando().trim();
    const novoPapel = this.papelEditando().trim();
    
    if (novoNome && novoPapel) {
      // Atualizar o participante
      participante.nome = novoNome;
      participante.papel = novoPapel;
      
      // Atualizar todos os diálogos que usam este participante
      const dialogosAtualizados = this.dialogos().map(dialogo => {
        if (dialogo.participanteId === participante.id) {
          return {
            ...dialogo,
            participanteObj: { ...participante }
          };
        }
        return dialogo;
      });
      
      this.dialogos.set(dialogosAtualizados);
      
      // Força atualização do array de participantes
      const participantesAtualizados = this.participantes().map(p => 
        p.id === participante.id ? participante : p
      );
      this.participantes.set(participantesAtualizados);
      
      console.log('Participante atualizado:', participante);
    }
    
    this.participanteEditando.set(null);
    this.nomeEditando.set('');
    this.papelEditando.set('');
  }
  
  // ==================== CHAT ====================
  enviarMensagem(): void {
    const texto = this.novaMensagem().trim();
    if (texto) {
      const novaMensagem: MensagemChat = {
        id: Date.now().toString(),
        autor: 'Você',
        texto: texto,
        timestamp: Date.now(),
        proprio: true
      };
      
      const mensagensAtuais = this.mensagensChat();
      this.mensagensChat.set([...mensagensAtuais, novaMensagem]);
      this.novaMensagem.set('');
      
      setTimeout(() => this.scrollChatParaBaixo(), 100);
    }
  }
  
  limparChat(): void {
    this.mensagensChat.set([]);
  }
  
  // ==================== UTILITÁRIOS ====================
  formatarTimestamp(segundos: number): string {
    const horas = Math.floor(segundos / 3600);
    const minutos = Math.floor((segundos % 3600) / 60);
    const segs = Math.floor(segundos % 60);
    
    if (horas > 0) {
      return `${horas.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}:${segs.toString().padStart(2, '0')}`;
    }
    return `${minutos.toString().padStart(2, '0')}:${segs.toString().padStart(2, '0')}`;
  }
  
  formatarHora(timestamp: number): string {
    return new Date(timestamp).toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }
  
  calcularTempoFala(participanteId: string): string {
    const dialogosParticipante = this.dialogos().filter(d => d.participanteId === participanteId);
    const tempoTotal = dialogosParticipante.reduce((total, dialogo) => {
      return total + (dialogo.timestampFim - dialogo.timestampInicio);
    }, 0);
    return this.formatarTimestamp(tempoTotal);
  }
  
  // ==================== FILTRO POR PARTICIPANTE ====================
  filtrarPorParticipante(participanteId: string): void {
    if (this.participanteFiltrado() === participanteId) {
      // Se já está filtrado pelo mesmo participante, remove o filtro
      this.participanteFiltrado.set(null);
      this.dialogosFiltrados.set(this.dialogos());
    } else {
      // Aplica o filtro
      this.participanteFiltrado.set(participanteId);
      this.aplicarFiltroComContexto(participanteId);
    }
  }
  
  private aplicarFiltroComContexto(participanteId: string): void {
    const todosDialogos = this.dialogos();
    const dialogosComContexto: DialogoDetalhe[] = [];
    
    todosDialogos.forEach((dialogo, index) => {
      if (dialogo.participanteId === participanteId) {
        // Adiciona 2 diálogos anteriores
        for (let i = Math.max(0, index - 2); i < index; i++) {
          if (!dialogosComContexto.includes(todosDialogos[i])) {
            dialogosComContexto.push({
              ...todosDialogos[i],
              isContexto: true
            });
          }
        }
        
        // Adiciona o diálogo principal
        dialogosComContexto.push({
          ...dialogo,
          isContexto: false
        });
        
        // Adiciona 2 diálogos posteriores
        for (let i = index + 1; i <= Math.min(todosDialogos.length - 1, index + 2); i++) {
          if (!dialogosComContexto.includes(todosDialogos[i])) {
            dialogosComContexto.push({
              ...todosDialogos[i],
              isContexto: true
            });
          }
        }
      }
    });
    
    // Remove duplicatas e ordena por timestamp
    const dialogosUnicos = dialogosComContexto
      .filter((dialogo, index, arr) => arr.findIndex(d => d.id === dialogo.id) === index)
      .sort((a, b) => a.timestampInicio - b.timestampInicio);
    
    this.dialogosFiltrados.set(dialogosUnicos);
  }
  
  obterDialogosParaExibicao(): DialogoDetalhe[] {
    return this.participanteFiltrado() ? this.dialogosFiltrados() : this.dialogos();
  }
  
  obterNomeParticipanteFiltrado(): string {
    const id = this.participanteFiltrado();
    if (!id) return '';
    const participante = this.participantes().find(p => p.id === id);
    return participante?.nome || '';
  }
  
  limparFiltro(): void {
    this.participanteFiltrado.set(null);
    this.dialogosFiltrados.set(this.dialogos());
  }
  
  private scrollParaDialogo(timestamp: number): void {
    if (this.dialogosContainer) {
      const dialogoAtivo = this.dialogosContainer.nativeElement.querySelector('.dialogo-item.ativo');
      if (dialogoAtivo) {
        dialogoAtivo.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center',
          inline: 'nearest'
        });
      }
    }
  }
  
  private scrollParaDialogoAtivo(): void {
    // Throttle para não executar muito frequentemente
    if (!this.scrollThrottle) {
      this.scrollThrottle = setTimeout(() => {
        if (this.dialogosContainer) {
          const dialogoAtivo = this.dialogosContainer.nativeElement.querySelector('.dialogo-item.ativo');
          if (dialogoAtivo) {
            // Verifica se o diálogo ativo está fora da área visível
            const container = this.dialogosContainer.nativeElement;
            const containerRect = container.getBoundingClientRect();
            const dialogoRect = dialogoAtivo.getBoundingClientRect();
            
            const isVisible = (
              dialogoRect.top >= containerRect.top &&
              dialogoRect.bottom <= containerRect.bottom
            );
            
            // Só faz scroll se o diálogo não estiver visível
            if (!isVisible) {
              dialogoAtivo.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'center',
                inline: 'nearest'
              });
            }
          }
        }
        this.scrollThrottle = null;
      }, 500); // Throttle de 500ms
    }
  }
  
  private scrollChatParaBaixo(): void {
    if (this.chatContainer) {
      this.chatContainer.nativeElement.scrollTop = this.chatContainer.nativeElement.scrollHeight;
    }
  }

  ngOnDestroy(): void {
    // Limpar timeouts ao destruir o componente
    if (this.timeoutSegmento) {
      clearTimeout(this.timeoutSegmento);
    }
    if (this.scrollThrottle) {
      clearTimeout(this.scrollThrottle);
    }
  }
}
