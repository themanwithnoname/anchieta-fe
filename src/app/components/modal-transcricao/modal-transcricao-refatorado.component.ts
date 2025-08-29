import { Component, Input, Output, EventEmitter, ViewChild, ElementRef, inject, OnInit, OnDestroy, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ParticipanteColorService } from '../../services/participante-color.service';
import { TranscricaoService } from '../../services/transcricao.service';
import { DialogosListComponent } from '../dialogos-list/dialogos-list.component';
import { ParticipantePanelComponent } from '../participante-panel/participante-panel.component';
import { BuscaToolbarComponent } from '../busca-toolbar/busca-toolbar.component';
import { 
  DialogoTranscricao, 
  Participante, 
  ProcessoInfo, 
  ResultadoBusca
} from '../../transcricao/models/transcricao.types';

@Component({
  selector: 'app-modal-transcricao',
  standalone: true,
  imports: [CommonModule, FormsModule, DialogosListComponent, ParticipantePanelComponent, BuscaToolbarComponent],
  templateUrl: './modal-transcricao.component.html',
  styleUrl: './modal-transcricao.component.scss'
})
export class ModalTranscricaoComponent implements OnInit, OnDestroy {
  @Input() processo: any;
  @Input() visible = false;
  @Output() fechar = new EventEmitter<void>();
  @Output() salvar = new EventEmitter<DialogoTranscricao[]>();
  @ViewChild('videoPlayer') videoPlayer!: ElementRef<HTMLVideoElement>;
  @ViewChild('videoPlayerModal') videoPlayerModal!: ElementRef<HTMLVideoElement>;

  private participanteColorService = inject(ParticipanteColorService);
  private transcricaoService = inject(TranscricaoService);
  
  // Signals para estado reativo
  dialogos = signal<DialogoTranscricao[]>([]);
  participantes = signal<Participante[]>([]);
  audioTocando = signal(false);
  tempoAtual = signal(0);
  tempoTotal = signal(3600);
  dialogoEditando = signal<number | null>(null);
  textoEditando = signal('');
  termoBusca = signal('');
  resultadosBusca = signal<ResultadoBusca[]>([]);
  alteracoesPendentes = signal(0);
  modalMaximizado = signal(false);
  painelParticipantesVisivel = signal(true);
  
  // Computed properties
  temAlteracoes = computed(() => this.alteracoesPendentes() > 0);
  progressoAudio = computed(() => (this.tempoAtual() / this.tempoTotal()) * 100);
  participantesUnicos = computed(() => this.participanteColorService.obterParticipantesUnicos(this.dialogos()));
  
  readonly PAPEIS_PREDEFINIDOS = ['Testemunha', 'Advogado', 'Perito', 'Juiz', 'Promotor', 'Defensor', 'Escrivão'] as const;
  
  private audioInterval?: number;

  ngOnInit(): void {
    this.inicializarDados();
  }

  ngOnDestroy(): void {
    if (this.audioInterval) {
      clearInterval(this.audioInterval);
    }
  }

  private inicializarDados(): void {
    // Dados do processo
    const processoInfo: ProcessoInfo = {
      numero: '5001234-89.2023.5.02.0011',
      requerente: 'João Silva Santos',
      requerido: 'Empresa ABC Ltda',
      vara: '1ª Vara do Trabalho de Salvador',
      dataAudiencia: new Date('2024-01-15T14:00:00'),
      tipoAudiencia: 'Audiência de Instrução e Julgamento',
      duracao: '01:23:45'
    };

    // Participantes padrão
    this.participantes.set([
      { nome: 'Dr. Carlos Mendes', tipo: 'Juiz', cor: '#2c3e50', avatar: 'CM', totalDialogos: 8, falas: 8 },
      { nome: 'João Silva Santos', tipo: 'Requerente', cor: '#3498db', avatar: 'JS', totalDialogos: 12, falas: 12 },
      { nome: 'Dr. Ana Costa', tipo: 'Advogado Requerente', cor: '#27ae60', avatar: 'AC', totalDialogos: 10, falas: 10 },
      { nome: 'Maria Oliveira', tipo: 'Requerido', cor: '#e74c3c', avatar: 'MO', totalDialogos: 6, falas: 6 },
      { nome: 'Dr. Roberto Lima', tipo: 'Advogado Requerido', cor: '#f39c12', avatar: 'RL', totalDialogos: 9, falas: 9 }
    ]);

    // Gerar diálogos simulados
    this.dialogos.set(this.gerarDialogosSimulados());
  }

  private gerarDialogosSimulados(): DialogoTranscricao[] {
    const dialogosBase = [
      { participante: 'Dr. Carlos Mendes', texto: 'Declaro aberta a presente audiência de instrução e julgamento.' },
      { participante: 'João Silva Santos', texto: 'João Silva Santos, requerente nos autos, brasileiro, casado, operário.' },
      { participante: 'Dr. Ana Costa', texto: 'Dra. Ana Costa Silva, OAB/BA 12345, advogada constituída do requerente.' }
    ];

    return dialogosBase.map((item, index) => ({
      id: `dialogo_${index + 1}`,
      timestamp: this.formatarTempo(120 + (index * 180)),
      timestampSegundos: 120 + (index * 180),
      duracaoSegundos: 45 + Math.floor(Math.random() * 60),
      participante: item.participante,
      tipo: this.participantes().find(p => p.nome === item.participante)?.tipo || 'Participante',
      texto: item.texto,
      confianca: Math.random() > 0.7 ? 'alta' : Math.random() > 0.4 ? 'media' : 'baixa' as 'alta' | 'media' | 'baixa',
      confiancaValor: 0.7 + Math.random() * 0.3,
      revisado: Math.random() > 0.6,
      marcado: false,
      marcadoRevisao: false,
      matchBusca: false,
      alteracoes: [],
      historico: []
    }));
  }

  // Métodos de áudio simplificados
  toggleAudio(): void {
    const tocando = this.audioTocando();
    this.audioTocando.set(!tocando);
    
    if (!tocando) {
      this.iniciarSimulacaoAudio();
    } else {
      this.pararSimulacaoAudio();
    }
  }

  private iniciarSimulacaoAudio(): void {
    this.audioInterval = window.setInterval(() => {
      const atual = this.tempoAtual();
      const total = this.tempoTotal();
      
      if (atual < total) {
        this.tempoAtual.set(atual + 1);
      } else {
        this.pararSimulacaoAudio();
      }
    }, 1000);
  }

  private pararSimulacaoAudio(): void {
    this.audioTocando.set(false);
    if (this.audioInterval) {
      clearInterval(this.audioInterval);
      this.audioInterval = undefined;
    }
  }

  irParaTempo(event: MouseEvent): void {
    const progressBar = event.currentTarget as HTMLElement;
    const rect = progressBar.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const percentage = clickX / rect.width;
    this.tempoAtual.set(Math.floor(percentage * this.tempoTotal()));
  }

  // Métodos de edição simplificados
  editarDialogo(index: number): void {
    const editando = this.dialogoEditando();
    if (editando === index) {
      this.cancelarEdicao();
    } else {
      this.dialogoEditando.set(index);
      this.textoEditando.set(this.dialogos()[index].texto);
    }
  }

  salvarEdicao(): void {
    const index = this.dialogoEditando();
    if (index === null) return;
    
    const dialogos = this.dialogos();
    const dialogo = {...dialogos[index]};
    dialogo.texto = this.textoEditando();
    
    // Adicionar ao histórico
    dialogo.alteracoes.push({
      id: `alt_${Date.now()}`,
      data: new Date(),
      usuario: 'Usuário Atual',
      tipo: 'texto',
      valorAnterior: dialogos[index].texto,
      valorNovo: this.textoEditando(),
      observacao: 'Correção manual do texto'
    });

    const novosDialogos = [...dialogos];
    novosDialogos[index] = dialogo;
    this.dialogos.set(novosDialogos);
    
    this.alteracoesPendentes.update(count => count + 1);
    this.cancelarEdicao();
  }

  cancelarEdicao(): void {
    this.dialogoEditando.set(null);
    this.textoEditando.set('');
  }

  // Métodos de busca simplificados
  buscarNaTranscricao(): void {
    const termo = this.termoBusca().toLowerCase().trim();
    if (!termo) {
      this.resultadosBusca.set([]);
      return;
    }

    const resultados: ResultadoBusca[] = [];
    this.dialogos().forEach((dialogo, index) => {
      const texto = dialogo.texto.toLowerCase();
      let pos = texto.indexOf(termo);
      
      while (pos !== -1) {
        resultados.push({
          dialogoIndex: index,
          posicao: pos,
          contexto: texto.substring(Math.max(0, pos - 20), Math.min(texto.length, pos + termo.length + 20))
        });
        pos = texto.indexOf(termo, pos + 1);
      }
    });

    this.resultadosBusca.set(resultados);
  }

  limparBusca(): void {
    this.termoBusca.set('');
    this.resultadosBusca.set([]);
  }

  destacarTermoBusca(texto: string): string {
    const termo = this.termoBusca().trim();
    if (!termo) return texto;
    
    const regex = new RegExp(`(${termo})`, 'gi');
    return texto.replace(regex, '<span class="highlight">$1</span>');
  }

  // Métodos utilitários
  formatarTempo(segundos: number): string {
    const horas = Math.floor(segundos / 3600);
    const minutos = Math.floor((segundos % 3600) / 60);
    const segs = Math.floor(segundos % 60);
    return `${horas.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}:${segs.toString().padStart(2, '0')}`;
  }

  getCorParticipante(nome: string): string {
    return this.participanteColorService.obterCorParticipante(nome);
  }

  // Métodos do modal
  toggleMaximizar(): void {
    this.modalMaximizado.update(max => !max);
  }

  togglePainelParticipantes(): void {
    this.painelParticipantesVisivel.update(visivel => !visivel);
  }

  fecharModal(): void {
    if (this.temAlteracoes()) {
      const confirmar = confirm('Existem alterações não salvas. Deseja realmente fechar?');
      if (!confirmar) return;
    }
    this.fechar.emit();
  }

  salvarTranscricao(): void {
    this.salvar.emit(this.dialogos());
    this.alteracoesPendentes.set(0);
  }

  /**
   * Método para carregar participantes automaticamente a partir de arquivo de transcrição
   */
  carregarParticipantesDeArquivo(arquivoTranscricao: string): void {
    this.transcricaoService.carregarTranscricao(arquivoTranscricao).subscribe({
      next: (dialogosProcessados) => {
        // Processar participantes usando o novo sistema
        const participantesTranscricao = this.transcricaoService.processarParticipantesParaIntegracao(dialogosProcessados);
        const participantesCarregados = this.participanteColorService.recarregarParticipantesDeTranscricao(participantesTranscricao);
        
        // Atualizar participantes no modal
        this.participantes.set(participantesCarregados);
        
        // Converter diálogos para o formato do modal
        const dialogosConvertidos: DialogoTranscricao[] = dialogosProcessados.map(dialogo => {
          const participante = participantesCarregados.find(p => p.nome === dialogo.participanteNome);
          
          return {
            id: dialogo.id,
            timestamp: this.formatarTempo(dialogo.timestampInicio),
            timestampSegundos: dialogo.timestampInicio,
            duracaoSegundos: dialogo.timestampFim - dialogo.timestampInicio,
            participante: dialogo.participanteNome,
            tipo: participante?.tipo || 'Participante',
            texto: dialogo.texto,
            confianca: dialogo.nivelConfianca,
            confiancaValor: dialogo.percentualConfianca,
            revisado: false,
            marcado: false,
            alteracoes: []
          };
        });
        
        this.dialogos.set(dialogosConvertidos);
        
        console.log(`Modal: Carregados ${participantesCarregados.length} participantes e ${dialogosConvertidos.length} diálogos da transcrição`);
      },
      error: (error) => {
        console.error('Erro ao carregar transcrição no modal:', error);
      }
    });
  }
}