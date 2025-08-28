// Tipos base mais limpos
export type NivelConfianca = 'alta' | 'media' | 'baixa';
export type TipoAlteracao = 'texto' | 'participante' | 'timestamp' | 'nota';

export interface DialogoTranscricao {
  readonly id: string;
  timestamp: string; // formato HH:MM:SS
  timestampSegundos: number;
  duracaoSegundos: number;
  participante: string;
  tipo: string; // tipo do participante
  texto: string;
  confianca: NivelConfianca;
  confiancaValor: number;
  // Estados simples
  revisado: boolean;
  marcado: boolean;
  marcadoRevisao?: boolean;
  matchBusca?: boolean;
  // Dados opcionais
  nota?: string;
  notas?: string;
  alteracoes: AlteracaoHistorico[];
  historico?: AlteracaoHistorico[];
}

export interface AlteracaoHistorico {
  readonly id: string;
  readonly data: Date;
  readonly usuario: string;
  readonly tipo: TipoAlteracao;
  readonly valorAnterior: string;
  readonly valorNovo: string;
  readonly observacao?: string;
}

// Participante base - dados essenciais
export interface Participante {
  nome: string;
  tipo: string;
  cor: string;
  avatar: string;
  totalDialogos: number;
  falas: number;
}

export interface ProcessoInfo {
  numero: string;
  requerente: string;
  requerido: string;
  vara: string;
  dataAudiencia: Date;
  tipoAudiencia: string;
  duracao: string;
}

export interface ResultadoBusca {
  dialogoIndex: number;
  posicao: number;
  contexto: string;
}

// ==================== ESTADOS CONSOLIDADOS ====================
// Estado de áudio - agrupa todas as propriedades relacionadas ao áudio
export interface AudioState {
  tocando: boolean;
  disponivel: boolean;
  tempoAtual: number;
  tempoTotal: number;
  volume: number;
  dialogoTocando: string | null;
  dialogoAtivo: number | null;
}

// Estado da interface - agrupa controles de UI
export interface UIState {
  dialogoEditando: number | null;
  textoEditando: string;
  modoVisualizacaoCompacto: boolean;
  painelParticipantesVisivel: boolean;
  modalMaximizado: boolean;
  modalVisivel: boolean;
  termoBusca: string;
  filtroParticipante: string;
  resultadoAtual: number;
  alteracoesPendentes: number;
}

// Estado de busca - agrupa funcionalidades de busca
export interface BuscaState {
  termo: string;
  resultados: ResultadoBusca[];
  resultadoAtual: number;
  filtroParticipante: string;
}

// Estado de edição de locutor - agrupa toda lógica de edição de participantes
export interface EdicaoLocutorState {
  ativo: boolean;
  dialogoEditando: number | null;
  locutorOriginal: string;
  novoLocutor: string;
  popupNovoLocutor: boolean;
  popupEditarLocutor: boolean;
  edicaoNome: string;
  edicaoPapel: string;
  participanteEditando: Participante | null;
  editandoLocutorAtual: boolean;
  locutorAtualFoiEditado: boolean;
}

// Estado do modal de vídeo - agrupa funcionalidades de vídeo
export interface VideoState {
  modalAberto: boolean;
  dialogoAtual: DialogoTranscricao | null;
  carregado: boolean;
  url: string;
}

// Estado consolidado principal - agrupa todos os sub-estados
export interface TranscricaoModalState {
  audio: AudioState;
  ui: UIState;  
  busca: BuscaState;
  edicaoLocutor: EdicaoLocutorState;
  video: VideoState;
  processo: ProcessoInfo;
  dialogos: DialogoTranscricao[];
  participantes: Participante[];
}

// Props para componentes
export interface DialogosListProps {
  dialogos: DialogoTranscricao[];
  modoVisualizacaoCompacto: boolean;
  modoEdicaoLocutor: boolean;
  termoBusca: string;
}

export interface ParticipantePanelProps {
  participantes: Participante[];
  painelVisivel: boolean;
  alteracoesHistorico: AlteracaoHistorico[];
  totalDialogos: number;
}

export interface BuscaToolbarProps {
  termoBusca: string;
  modoVisualizacaoCompacto: boolean;
  resultadosCount: number;
  resultadoAtual: number;
}