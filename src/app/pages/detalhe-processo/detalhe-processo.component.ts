import { Component, inject, OnInit, OnDestroy, signal, ViewChild, ElementRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DialogoTranscricao, NivelConfianca } from '../../transcricao/models/transcricao.types';
import { TranscricaoService, DialogoProcessado } from '../../services/transcricao.service';
import { ParticipanteColorService } from '../../services/participante-color.service';

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
  isNovoGrupo?: boolean; // Para marcar início de um novo grupo de 5 diálogos
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
  private participanteColorService = inject(ParticipanteColorService);
  
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
  dialogoParticipanteEditando = signal<string | null>(null);
  
  // Participantes e diálogos (carregados dinamicamente)
  participantes = signal<ParticipanteDetalhes[]>([]);
  dialogos = signal<DialogoDetalhe[]>([]);
  
  // Filtro por participante
  participanteFiltrado = signal<string | null>(null);
  dialogosFiltrados = signal<DialogoDetalhe[]>([]);
  
  // Segmentos coloridos para barra de progresso
  segmentosProgresso = signal<Array<{inicio: number, fim: number, cor: string, participante: string}>>([]);
  
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
  chatDestacado = signal<boolean>(false);
  
  // Controle da minuta PJe
  minutaEnviada = signal<boolean>(false);
  
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
    
    // O progresso agora é controlado pelo evento 'timeupdate' do vídeo real
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
    // Carregar participantes automaticamente usando o novo sistema
    const participantesTranscricao = this.transcricaoService.processarParticipantesParaIntegracao(dialogosProcessados);
    const participantesCarregados = this.participanteColorService.carregarParticipantesDeTranscricao(participantesTranscricao);
    
    // Converter para formato local (ParticipanteDetalhes)
    const participantesComCores = participantesCarregados.map((participante, index) => ({
      id: (index + 1).toString(),
      nome: participante.nome,
      papel: participante.tipo,
      cor: participante.cor
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
    
    // Gerar segmentos coloridos para barra de progresso
    this.gerarSegmentosProgresso(dialogosConvertidos, participantesComCores);
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

  private gerarSegmentosProgresso(dialogos: DialogoDetalhe[], participantes: ParticipanteDetalhes[]): void {
    const segmentos: Array<{inicio: number, fim: number, cor: string, participante: string}> = [];
    
    dialogos.forEach(dialogo => {
      const participante = participantes.find(p => p.id === dialogo.participanteId);
      if (participante) {
        segmentos.push({
          inicio: dialogo.timestampInicio,
          fim: dialogo.timestampFim,
          cor: participante.cor,
          participante: participante.nome
        });
      }
    });
    
    // Ordenar por tempo de início
    segmentos.sort((a, b) => a.inicio - b.inicio);
    
    this.segmentosProgresso.set(segmentos);
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
  
  navegarPara(timestamp: number, fazerScroll: boolean = true): void {
    this.timestampAtual.set(timestamp);
    if (this.videoPlayer) {
      this.videoPlayer.nativeElement.currentTime = timestamp;
    }
    if (fazerScroll) {
      this.scrollParaDialogo(timestamp);
    }
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
    
    // Usar duração real do vídeo para navegação
    if (this.videoPlayer && this.videoPlayer.nativeElement.duration) {
      const duracaoVideo = this.videoPlayer.nativeElement.duration;
      const novoTempo = (clickX / rect.width) * duracaoVideo;
      // Não fazer scroll quando navegar pela barra de progresso
      this.navegarPara(novoTempo, false);
    }
  }
  
  atualizarTempo(event: Event): void {
    const video = event.target as HTMLVideoElement;
    this.timestampAtual.set(video.currentTime);
    
    // Usar duração real do vídeo para calcular progresso - garantir que não exceda 100%
    if (video.duration && video.duration > 0 && isFinite(video.currentTime) && isFinite(video.duration)) {
      const progresso = Math.min(100, Math.max(0, (video.currentTime / video.duration) * 100));
      this.progressoPercent.set(progresso);
    }
    
    // Scroll automático para manter o diálogo ativo no centro
    this.scrollParaDialogoAtivo();
  }
  
  videoCarregado(event: Event): void {
    const video = event.target as HTMLVideoElement;
    const duracaoFormatada = this.formatarTimestamp(video.duration);
    this.duracaoTotal.set(duracaoFormatada);
    
    // Inicializar progresso como 0% quando o vídeo carrega
    this.progressoPercent.set(0);
  }

  obterDuracaoTotalSegundos(): number {
    const dialogos = this.dialogos();
    if (dialogos.length === 0) return 5025; // Fallback padrão
    
    const ultimoDialogo = dialogos[dialogos.length - 1];
    return ultimoDialogo.timestampFim || 5025;
  }

  obterPosicaoSegmento(inicio: number): number {
    if (this.videoPlayer && this.videoPlayer.nativeElement.duration) {
      return (inicio / this.videoPlayer.nativeElement.duration) * 100;
    }
    return (inicio / this.obterDuracaoTotalSegundos()) * 100;
  }

  obterLarguraSegmento(inicio: number, fim: number): number {
    if (this.videoPlayer && this.videoPlayer.nativeElement.duration) {
      return ((fim - inicio) / this.videoPlayer.nativeElement.duration) * 100;
    }
    return ((fim - inicio) / this.obterDuracaoTotalSegundos()) * 100;
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
    
    this.finalizarEdicaoParticipanteCompleta();
  }

  cancelarEdicaoParticipante(): void {
    this.finalizarEdicaoParticipanteCompleta();
  }

  private finalizarEdicaoParticipanteCompleta(): void {
    this.participanteEditando.set(null);
    this.nomeEditando.set('');
    this.papelEditando.set('');
  }

  // Novos métodos para edição de participante nos diálogos
  iniciarEdicaoParticipanteDialogo(dialogoId: string): void {
    this.dialogoParticipanteEditando.set(dialogoId);
  }
  
  finalizarEdicaoParticipante(): void {
    this.dialogoParticipanteEditando.set(null);
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
  
  toggleChatDestacado(): void {
    this.chatDestacado.update(estado => !estado);
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
    
    // Encontrar todos os diálogos do participante filtrado
    const dialogosDoParticipante = todosDialogos.filter(d => d.participanteId === participanteId);
    
    // Se não há diálogos do participante, retorna vazio
    if (dialogosDoParticipante.length === 0) {
      this.dialogosFiltrados.set([]);
      return;
    }
    
    const resultado: DialogoDetalhe[] = [];
    let ultimoIndiceProcessado = -10; // Garantir que não há sobreposição
    
    dialogosDoParticipante.forEach((dialogoPrincipal, grupoIndex) => {
      const indicePrincipal = todosDialogos.findIndex(d => d.id === dialogoPrincipal.id);
      
      // Só processar se não há sobreposição com grupo anterior
      if (indicePrincipal > ultimoIndiceProcessado + 2) {
      
        let inicioGrupo = Math.max(0, indicePrincipal - 2);
        let fimGrupo = Math.min(todosDialogos.length - 1, indicePrincipal + 2);
        
        // Verificar se algum dos diálogos de contexto posterior também pertence ao participante
        const dialogosContextoPosterior = [indicePrincipal + 1, indicePrincipal + 2];
        const temDialogoComplementar = dialogosContextoPosterior.some(indice => 
          indice < todosDialogos.length && 
          todosDialogos[indice].participanteId === participanteId
        );
        
        // Se há diálogo complementar, adicionar mais 2 diálogos de contexto posterior
        if (temDialogoComplementar) {
          fimGrupo = Math.min(todosDialogos.length - 1, fimGrupo + 2);
        }
        
        // Adicionar diálogos do grupo
        for (let i = inicioGrupo; i <= fimGrupo; i++) {
          const dialogo = todosDialogos[i];
          resultado.push({
            ...dialogo,
            isContexto: dialogo.participanteId !== participanteId,
            isNovoGrupo: i === inicioGrupo && grupoIndex > 0
          });
        }
        
        ultimoIndiceProcessado = fimGrupo;
      }
    });
    
    this.dialogosFiltrados.set(resultado);
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

  // ==================== AÇÕES DO HEADER ====================
  copiarNumeroProcesso(): void {
    const numero = this.numeroProcesso();
    navigator.clipboard.writeText(numero).then(() => {
      // Feedback visual - pode ser substituído por toast notification
      console.log('Número do processo copiado:', numero);
      
      // Opcional: mostrar feedback visual temporário
      const btnCopiar = document.querySelector('.btn-copiar i') as HTMLElement;
      if (btnCopiar) {
        const iconOriginal = btnCopiar.className;
        btnCopiar.className = 'fas fa-check';
        btnCopiar.style.color = '#27ae60';
        
        setTimeout(() => {
          btnCopiar.className = iconOriginal;
          btnCopiar.style.color = '';
        }, 1500);
      }
    }).catch(err => {
      console.error('Erro ao copiar número do processo:', err);
      // Fallback para navegadores mais antigos
      const textArea = document.createElement('textarea');
      textArea.value = numero;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    });
  }
  verResumo(): void {
    const numeroProcesso = this.numeroProcesso();
    const mapeamentoArquivos = this.obterArquivosProcesso(numeroProcesso);
    
    if (!mapeamentoArquivos) {
      alert('Processo não encontrado.');
      return;
    }
    
    // Construir caminho do arquivo de resumo baseado no arquivo de vídeo
    const nomeArquivo = mapeamentoArquivos.video.split('/').pop()?.replace('.mp4', '');
    const caminhoResumo = `assets/videos/${nomeArquivo}_resumo.txt`;
    
    // Carregar conteúdo do arquivo de resumo
    fetch(caminhoResumo)
      .then(response => {
        if (!response.ok) {
          throw new Error('Arquivo de resumo não encontrado');
        }
        return response.text();
      })
      .then(conteudoResumo => {
        // Gerar cabeçalho do resumo
        const cabecalho = this.gerarCabecalhoResumo(numeroProcesso);
        const resumoCompleto = cabecalho + '\n\n' + conteudoResumo;
        
        // Exibir modal com o resumo
        this.exibirModalResumo(resumoCompleto);
      })
      .catch(error => {
        console.error('Erro ao carregar resumo:', error);
        alert('Não foi possível carregar o resumo da audiência.');
      });
  }

  gerarMinutaPje(): void {
    // Verificar se a minuta já foi enviada
    if (this.minutaEnviada()) {
      return;
    }

    // Gerar minuta para upload no PJe
    const dialogos = this.dialogos();
    const participantes = this.participantes();
    
    if (dialogos.length === 0) {
      alert('Não há transcrição disponível para gerar a minuta.');
      return;
    }
    
    const minuta = this.gerarMinutaFormatada(dialogos, participantes);
    const transcricaoCompleta = this.gerarTranscricaoCompleta(dialogos, participantes);
    
    // Download dos dois arquivos
    this.downloadMinutaPje(minuta);
    
    // Pequeno delay para não conflitar os downloads
    setTimeout(() => {
      this.downloadTranscricaoCompleta(transcricaoCompleta);
      
      // Exibir popup de sucesso e marcar como enviada após downloads
      setTimeout(() => {
        alert('Minuta da degravação enviada para o PJe com sucesso!');
        this.minutaEnviada.set(true);
      }, 200);
    }, 500);
  }

  private gerarCabecalhoResumo(numeroProcesso: string): string {
    const duracao = this.duracaoTotal();
    const data = new Date();
    
    let cabecalho = `RESUMO DA AUDIÊNCIA\n\n`;
    cabecalho += `Processo: ${numeroProcesso}\n`;
    cabecalho += `Duração total: ${duracao}\n`;
    cabecalho += `Data/Hora: ${data.toLocaleDateString('pt-BR')}, ${data.toLocaleTimeString('pt-BR')}`;
    
    return cabecalho;
  }

  private gerarResumoAudiencia(dialogos: DialogoDetalhe[], participantes: ParticipanteDetalhes[]): string {
    const processo = this.numeroProcesso();
    const duracao = this.duracaoTotal();
    
    // Estatísticas dos participantes
    const estatisticas = participantes.map(p => {
      const falasParticipante = dialogos.filter(d => d.participanteId === p.id);
      return {
        nome: p.nome,
        papel: p.papel,
        totalFalas: falasParticipante.length,
        tempoTotal: this.calcularTempoFala(p.id)
      };
    });
    
    let resumo = `RESUMO DA AUDIÊNCIA\n\n`;
    resumo += `Processo: ${processo}\n`;
    resumo += `Duração total: ${duracao}\n`;
    resumo += `Data/Hora: ${new Date().toLocaleString('pt-BR')}\n\n`;
    
    resumo += `PARTICIPANTES:\n`;
    estatisticas.forEach(stat => {
      resumo += `• ${stat.nome} (${stat.papel}) - ${stat.totalFalas} falas - ${stat.tempoTotal}\n`;
    });
    
    resumo += `\nPONTOS PRINCIPAIS:\n`;
    resumo += `• Total de ${dialogos.length} interações registradas\n`;
    resumo += `• Transcrição completa disponível no sistema\n`;
    resumo += `• Audiência realizada e transcrita automaticamente\n\n`;
    
    resumo += `OBSERVAÇÕES:\n`;
    resumo += `• Transcrição gerada automaticamente pelo Sistema Anchieta\n`;
    resumo += `• Recomenda-se revisão manual para conferência\n`;
    
    return resumo;
  }

  private gerarMinutaFormatada(dialogos: DialogoDetalhe[], participantes: ParticipanteDetalhes[]): string {
    const processo = this.numeroProcesso();
    const juiz = participantes.find(p => p.papel.toLowerCase().includes('juiz'))?.nome || 'MM. Juiz(a)';
    const data = new Date();
    
    let minuta = `MINUTA DE ATA DE AUDIÊNCIA\n\n`;
    minuta += `PROCESSO Nº: ${processo}\n`;
    minuta += `DATA: ${data.toLocaleDateString('pt-BR')}\n`;
    minuta += `HORÁRIO: ${data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}\n\n`;
    
    minuta += `PRESENTES:\n`;
    participantes.forEach(p => {
      minuta += `${p.papel.toUpperCase()}: ${p.nome}\n`;
    });
    
    minuta += `\n`;
    minuta += `Aos ${data.getDate()} dias do mês de ${data.toLocaleDateString('pt-BR', { month: 'long' })} de ${data.getFullYear()}, `;
    minuta += `nesta cidade e Comarca, na sala de audiências da Vara do Trabalho, `;
    minuta += `sob a presidência do(a) ${juiz}, foi realizada audiência de instrução e julgamento.\n\n`;
    
    minuta += `OCORRÊNCIAS:\n`;
    minuta += `• A audiência foi gravada e transcrita automaticamente pelo Sistema Anchieta;\n`;
    minuta += `• Foram registradas ${dialogos.length} interações durante a sessão;\n`;
    minuta += `• A transcrição integral encontra-se disponível nos autos eletrônicos;\n`;
    minuta += `• Todos os participantes estiveram presentes e manifestaram-se adequadamente;\n\n`;
    
    minuta += `DECISÕES/DELIBERAÇÕES:\n`;
    minuta += `• [A ser preenchido pelo magistrado conforme desenvolvimento da audiência]\n`;
    minuta += `• [Inserir aqui as principais decisões tomadas]\n`;
    minuta += `• [Incluir eventuais acordos ou determinações]\n\n`;
    
    minuta += `ENCERRAMENTO:\n`;
    minuta += `Nada mais havendo, foi encerrada a audiência, lavrando-se a presente ata que, `;
    minuta += `lida e achada conforme, vai assinada por todos os presentes.\n\n`;
    
    minuta += `_________________________________\n`;
    minuta += `${juiz}\n`;
    minuta += `Juiz(a) do Trabalho\n\n`;
    
    participantes.forEach(p => {
      if (!p.papel.toLowerCase().includes('juiz')) {
        minuta += `_________________________________\n`;
        minuta += `${p.nome}\n`;
        minuta += `${p.papel}\n\n`;
      }
    });
    
    minuta += `\nOBSERVAÇÃO: Ata gerada automaticamente pelo Sistema Anchieta em ${data.toLocaleString('pt-BR')}.\n`;
    minuta += `A transcrição completa da audiência encontra-se anexa aos autos eletrônicos.\n`;
    
    return minuta;
  }

  private gerarTranscricaoCompleta(dialogos: DialogoDetalhe[], participantes: ParticipanteDetalhes[]): string {
    const processo = this.numeroProcesso();
    const data = new Date();
    
    let transcricao = `TRANSCRIÇÃO COMPLETA DA AUDIÊNCIA\n\n`;
    transcricao += `PROCESSO Nº: ${processo}\n`;
    transcricao += `DATA: ${data.toLocaleDateString('pt-BR')}\n`;
    transcricao += `HORÁRIO: ${data.toLocaleTimeString('pt-BR')}\n`;
    transcricao += `DURAÇÃO TOTAL: ${this.duracaoTotal()}\n\n`;
    
    transcricao += `PARTICIPANTES:\n`;
    participantes.forEach(p => {
      transcricao += `• ${p.nome} - ${p.papel}\n`;
    });
    
    transcricao += `\n${'='.repeat(80)}\n`;
    transcricao += `TRANSCRIÇÃO INTEGRAL\n`;
    transcricao += `${'='.repeat(80)}\n\n`;
    
    dialogos.forEach((dialogo, index) => {
      const participante = participantes.find(p => p.id === dialogo.participanteId);
      const timestamp = this.formatarTimestamp(dialogo.timestampInicio);
      
      if (participante) {
        transcricao += `[${timestamp}] ${participante.nome} (${participante.papel}):\n`;
        transcricao += `${dialogo.texto}\n\n`;
        
        // Adicionar separador a cada 10 diálogos para facilitar leitura
        if ((index + 1) % 10 === 0 && index < dialogos.length - 1) {
          transcricao += `${'-'.repeat(50)}\n\n`;
        }
      }
    });
    
    transcricao += `\n${'='.repeat(80)}\n`;
    transcricao += `FIM DA TRANSCRIÇÃO\n\n`;
    transcricao += `Total de interações: ${dialogos.length}\n`;
    transcricao += `Gerado automaticamente pelo Sistema Anchieta em ${data.toLocaleString('pt-BR')}\n`;
    transcricao += `Confiabilidade: Transcrição automática - recomenda-se conferência manual\n`;
    
    return transcricao;
  }

  private exibirModalResumo(resumo: string): void {
    // Por enquanto usar alert, mas pode ser substituído por um modal personalizado
    const modal = window.open('', '_blank', 'width=800,height=600,scrollbars=yes,resizable=yes');
    if (modal) {
      modal.document.write(`
        <html>
          <head>
            <title>Resumo da Audiência - ${this.numeroProcesso()}</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; line-height: 1.6; }
              pre { white-space: pre-wrap; background: #f5f5f5; padding: 15px; border-radius: 5px; }
            </style>
          </head>
          <body>
            <h1>Resumo da Audiência</h1>
            <pre>${resumo}</pre>
            <button onclick="window.print()" style="margin: 10px; padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer;">Imprimir</button>
            <button onclick="window.close()" style="margin: 10px; padding: 10px 20px; background: #6c757d; color: white; border: none; border-radius: 5px; cursor: pointer;">Fechar</button>
          </body>
        </html>
      `);
    }
  }

  private downloadMinutaPje(minuta: string): void {
    const blob = new Blob([minuta], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.href = url;
    link.download = `ata-audiencia-${this.numeroProcesso()}-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  private downloadTranscricaoCompleta(transcricao: string): void {
    const blob = new Blob([transcricao], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.href = url;
    link.download = `transcricao-completa-${this.numeroProcesso()}-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}
