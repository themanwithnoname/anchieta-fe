import { Injectable, signal, computed } from '@angular/core';
import { 
  DialogoTranscricao, 
  Participante, 
  UIState, 
  ResultadoBusca, 
  AlteracaoHistorico 
} from '../models/transcricao.types';

@Injectable({
  providedIn: 'root'
})
export class TranscricaoStateService {
  
  // Estados reativos principais
  private readonly _dialogos = signal<DialogoTranscricao[]>([]);
  private readonly _participantes = signal<Participante[]>([]);
  private readonly _uiState = signal<UIState>({
    dialogoEditando: null,
    modoVisualizacaoCompacto: false,
    painelParticipantesVisivel: true,
    modalMaximizado: false,
    termoBusca: '',
    filtroParticipante: ''
  });
  
  // Getters públicos (readonly)
  readonly dialogos = this._dialogos.asReadonly();
  readonly participantes = this._participantes.asReadonly();
  readonly uiState = this._uiState.asReadonly();
  
  // Computed values
  readonly dialogosFiltrados = computed(() => {
    const dialogos = this._dialogos();
    const filtro = this._uiState().filtroParticipante;
    
    if (!filtro) return dialogos;
    
    return dialogos.filter(d => d.participante === filtro);
  });
  
  readonly participantesComDialogos = computed(() => {
    const dialogos = this._dialogos();
    const participantes = this._participantes();
    
    return participantes.map(p => ({
      ...p,
      totalDialogos: dialogos.filter(d => d.participante === p.nome).length,
      falas: dialogos.filter(d => d.participante === p.nome).length
    }));
  });
  
  readonly alteracoesPendentes = computed(() => {
    return this._dialogos().reduce((count, dialogo) => {
      return count + dialogo.alteracoes.length;
    }, 0);
  });

  // Métodos para diálogos
  carregarDialogos(dialogos: DialogoTranscricao[]) {
    this._dialogos.set(dialogos);
  }
  
  editarDialogo(index: number) {
    this._uiState.update(state => ({
      ...state,
      dialogoEditando: state.dialogoEditando === index ? null : index
    }));
  }
  
  salvarDialogo(index: number, novoTexto: string) {
    this._dialogos.update(dialogos => {
      const dialogoAtualizado = { ...dialogos[index] };
      const valorAnterior = dialogoAtualizado.texto;
      
      dialogoAtualizado.texto = novoTexto;
      dialogoAtualizado.alteracoes.push(this.criarAlteracao('texto', valorAnterior, novoTexto));
      
      const novosDialogos = [...dialogos];
      novosDialogos[index] = dialogoAtualizado;
      return novosDialogos;
    });
    
    this.cancelarEdicao();
  }
  
  alterarParticipante(index: number, novoParticipante: string) {
    this._dialogos.update(dialogos => {
      const dialogoAtualizado = { ...dialogos[index] };
      const valorAnterior = dialogoAtualizado.participante;
      
      dialogoAtualizado.participante = novoParticipante;
      dialogoAtualizado.alteracoes.push(
        this.criarAlteracao('participante', valorAnterior, novoParticipante)
      );
      
      const novosDialogos = [...dialogos];
      novosDialogos[index] = dialogoAtualizado;
      return novosDialogos;
    });
  }
  
  marcarDialogo(index: number) {
    this._dialogos.update(dialogos => {
      const novosDialogos = [...dialogos];
      novosDialogos[index] = {
        ...novosDialogos[index],
        marcado: !novosDialogos[index].marcado
      };
      return novosDialogos;
    });
  }
  
  adicionarNota(index: number, nota: string) {
    this._dialogos.update(dialogos => {
      const dialogoAtualizado = { ...dialogos[index] };
      const valorAnterior = dialogoAtualizado.nota || '';
      
      dialogoAtualizado.nota = nota;
      dialogoAtualizado.alteracoes.push(
        this.criarAlteracao('nota', valorAnterior, nota)
      );
      
      const novosDialogos = [...dialogos];
      novosDialogos[index] = dialogoAtualizado;
      return novosDialogos;
    });
  }

  // Métodos para participantes
  carregarParticipantes(participantes: Participante[]) {
    this._participantes.set(participantes);
  }
  
  adicionarParticipante(participante: Participante) {
    this._participantes.update(participantes => [...participantes, participante]);
  }
  
  editarParticipante(nomeAntigo: string, dadosNovos: Partial<Participante>) {
    this._participantes.update(participantes => 
      participantes.map(p => 
        p.nome === nomeAntigo ? { ...p, ...dadosNovos } : p
      )
    );
    
    // Se o nome foi alterado, atualizar também nos diálogos
    if (dadosNovos.nome && dadosNovos.nome !== nomeAntigo) {
      this._dialogos.update(dialogos =>
        dialogos.map(d =>
          d.participante === nomeAntigo 
            ? { ...d, participante: dadosNovos.nome! }
            : d
        )
      );
    }
  }

  // Métodos para UI
  alternarModoVisualizacao() {
    this._uiState.update(state => ({
      ...state,
      modoVisualizacaoCompacto: !state.modoVisualizacaoCompacto
    }));
  }
  
  alternarPainelParticipantes() {
    this._uiState.update(state => ({
      ...state,
      painelParticipantesVisivel: !state.painelParticipantesVisivel
    }));
  }
  
  maximizarModal() {
    this._uiState.update(state => ({
      ...state,
      modalMaximizado: !state.modalMaximizado
    }));
  }
  
  definirTermoBusca(termo: string) {
    this._uiState.update(state => ({
      ...state,
      termoBusca: termo
    }));
  }
  
  definirFiltroParticipante(participante: string) {
    this._uiState.update(state => ({
      ...state,
      filtroParticipante: state.filtroParticipante === participante ? '' : participante
    }));
  }
  
  cancelarEdicao() {
    this._uiState.update(state => ({
      ...state,
      dialogoEditando: null
    }));
  }

  // Métodos para busca
  buscarNaTranscricao(termo: string): ResultadoBusca[] {
    if (!termo.trim()) return [];
    
    const resultados: ResultadoBusca[] = [];
    const termoLower = termo.toLowerCase();
    
    this._dialogos().forEach((dialogo, index) => {
      const texto = dialogo.texto.toLowerCase();
      let pos = texto.indexOf(termoLower);
      
      while (pos !== -1) {
        resultados.push({
          dialogoIndex: index,
          posicao: pos,
          contexto: this.extrairContexto(dialogo.texto, pos, termo.length)
        });
        pos = texto.indexOf(termoLower, pos + 1);
      }
    });
    
    return resultados;
  }
  
  destacarTermoBusca(texto: string, termo: string): string {
    if (!termo.trim()) return texto;
    
    const regex = new RegExp(`(${termo})`, 'gi');
    return texto.replace(regex, '<mark class="highlight">$1</mark>');
  }

  // Métodos utilitários
  formatarTempo(segundos: number): string {
    const horas = Math.floor(segundos / 3600);
    const minutos = Math.floor((segundos % 3600) / 60);
    const segs = Math.floor(segundos % 60);
    
    return `${horas.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}:${segs.toString().padStart(2, '0')}`;
  }
  
  formatarIntervaloTempo(dialogo: DialogoTranscricao): string {
    const tempoInicio = this.formatarTempo(dialogo.timestampSegundos);
    const tempoFim = this.formatarTempo(dialogo.timestampSegundos + dialogo.duracaoSegundos);
    return `${tempoInicio} - ${tempoFim}`;
  }

  // Métodos privados
  private criarAlteracao(
    tipo: AlteracaoHistorico['tipo'],
    valorAnterior: string,
    valorNovo: string,
    observacao?: string
  ): AlteracaoHistorico {
    return {
      id: `alt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      data: new Date(),
      usuario: 'Usuário Atual',
      tipo,
      valorAnterior,
      valorNovo,
      observacao
    };
  }
  
  private extrairContexto(texto: string, posicao: number, tamanhoTermo: number): string {
    const inicio = Math.max(0, posicao - 20);
    const fim = Math.min(texto.length, posicao + tamanhoTermo + 20);
    return texto.substring(inicio, fim);
  }
}