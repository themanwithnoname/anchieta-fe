import { Component, Input, Output, EventEmitter, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// ==================== INTERFACES ====================
export interface DialogoTranscricao {
  id: string;
  timestamp: string;
  timestampSegundos: number;
  duracaoSegundos: number;
  participante: string;
  tipo: string;
  texto: string;
  confianca: 'alta' | 'media' | 'baixa';
  confiancaValor: number;
  revisado: boolean;
  marcado: boolean;
  marcadoRevisao?: boolean;
  matchBusca?: boolean;
  nota?: string;
  notas?: string;
  alteracoes: AlteracaoHistorico[];
  historico?: AlteracaoHistorico[];
}

interface AlteracaoHistorico {
  id: string;
  data: Date;
  usuario: string;
  tipo: 'texto' | 'participante' | 'timestamp' | 'nota';
  valorAnterior: string;
  valorNovo: string;
  observacao?: string;
}

interface Participante {
  nome: string;
  tipo: string;
  cor: string;
  avatar: string;
  totalDialogos: number;
  falas: number;
}

interface ProcessoInfo {
  numero: string;
  requerente: string;
  requerido: string;
  vara: string;
  dataAudiencia: Date;
  tipoAudiencia: string;
  duracao: string;
}

interface ResultadoBusca {
  dialogoIndex: number;
  posicao: number;
  contexto: string;
}

@Component({
  selector: 'app-modal-transcricao',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './modal-transcricao.component.html',
  styleUrl: './modal-transcricao.component.scss'
})
export class ModalTranscricaoComponent {
  @Input() processo: any;
  @Input() isVisible: boolean = false;
  @Output() fechar = new EventEmitter<void>();
  @Output() salvar = new EventEmitter<DialogoTranscricao[]>();
  @ViewChild('videoPlayer') videoPlayer!: ElementRef<HTMLVideoElement>;
  @ViewChild('videoPlayerModal') videoPlayerModal!: ElementRef<HTMLVideoElement>;

  // ==================== PROPRIEDADES DE ESTADO ====================
  dialogos: DialogoTranscricao[] = [];
  dialogoEditando: number | null = null;
  textoEditando: string = '';
  
  // Edição de locutor
  modoEdicaoLocutor: boolean = false;
  dialogoEditandoLocutor: number | null = null;
  locutorOriginal: string = '';
  novoLocutor: string = '';
  modoAdicionarNovoLocutor: boolean = false;
  
  // Popup de novo locutor
  showPopupNovoLocutor: boolean = false;
  novoLocutorNome: string = '';
  novoLocutorPapel: string = '';
  
  // Modal de vídeo
  modalVideoAberto: boolean = false;
  dialogoVideoModal: DialogoTranscricao | null = null;
  
  // Popup de editar locutor
  popupEditarLocutorVisivel: boolean = false;
  locutorEdicaoNome: string = '';
  locutorEdicaoPapel: string = '';
  locutorEdicaoParticipante: Participante | null = null;
  
  // Edição do locutor atual
  editandoLocutorAtual: boolean = false;
  locutorAtualNomeEdicao: string = '';
  locutorAtualPapelEdicao: string = '';
  locutorAtualFoiEditado: boolean = false;
  
  // Áudio e reprodução
  audioTocando: boolean = false;
  audioDisponivel: boolean = true;
  tempoAtualSegundos: number = 0;
  tempoTotalSegundos: number = 3600;
  volume: number = 75;
  dialogoTocando: string | null = null;
  dialogoAtivo: number | null = null;

  // Busca e filtros
  termoBusca: string = '';
  resultadosBusca: ResultadoBusca[] = [];
  resultadoAtual: number = 0;
  filtroParticipante: string = '';

  // Participantes
  editandoParticipante: { [key: number]: boolean } = {};
  participanteEditando: string = '';
  participantesDisponiveis: Participante[] = [];
  locutoresAdicionados: Participante[] = [];

  // Papéis predefinidos para dropdown
  papeisPredefinidos: string[] = [
    'Testemunha',
    'Advogado',
    'Perito',
    'Juiz',
    'Promotor',
    'Defensor',
    'Escrivão'
  ];

  // Histórico e alterações
  mostrarHistorico: { [key: number]: boolean } = {};
  
  // Modal state
  isMaximizado: boolean = false;
  alteracoesPendentes: number = 0;

  // Estados auxiliares
  processoInfo: ProcessoInfo = {
    numero: '',
    requerente: '',
    requerido: '',
    vara: '',
    dataAudiencia: new Date(),
    tipoAudiencia: '',
    duracao: ''
  };

  // Controle de vídeo integrado
  videoCarregado: boolean = false;
  videoUrl: string = '';
  dialogoVideoAtual: DialogoTranscricao | null = null;

  constructor() {
    this.inicializarDados();
  }

  // ==================== PROPRIEDADES COMPUTADAS ====================
  get temAlteracoes(): boolean {
    return this.alteracoesPendentes > 0;
  }

  get progressoAudio(): number {
    return this.getProgressoAudio();
  }

  get participantesUnicos(): Participante[] {
    const participantesComDialogos = this.participantesDisponiveis.map(p => ({
      ...p,
      totalDialogos: this.dialogos.filter(d => d.participante === p.nome).length,
      falas: this.dialogos.filter(d => d.participante === p.nome).length
    })).filter(p => p.totalDialogos > 0);

    // Adicionar TODOS os locutores criados manualmente (mesmo os não usados ainda)
    const locutoresComDialogos = this.locutoresAdicionados.map(p => ({
      ...p,
      totalDialogos: this.dialogos.filter(d => d.participante === p.nome).length,
      falas: this.dialogos.filter(d => d.participante === p.nome).length
    }));

    // Combinar e remover duplicatas
    const todosParticipantes = [...participantesComDialogos, ...locutoresComDialogos];
    const nomesUnicos = new Set();
    
    return todosParticipantes.filter(p => {
      if (nomesUnicos.has(p.nome)) {
        return false;
      }
      nomesUnicos.add(p.nome);
      return true;
    });
  }

  getParticipantePapel(nomeParticipante: string): string {
    // Procurar primeiro nos participantes disponíveis
    const participanteDisponivel = this.participantesDisponiveis.find(p => p.nome === nomeParticipante);
    if (participanteDisponivel) {
      return participanteDisponivel.tipo;
    }
    
    // Procurar nos locutores adicionados
    const locutorAdicionado = this.locutoresAdicionados.find(p => p.nome === nomeParticipante);
    if (locutorAdicionado) {
      return locutorAdicionado.tipo;
    }
    
    return '';
  }

  formatarNomeParticipante(nomeParticipante: string | undefined): string {
    if (!nomeParticipante) return 'Participante não identificado';
    const papel = this.getParticipantePapel(nomeParticipante);
    return papel ? `${nomeParticipante} - ${papel}` : nomeParticipante;
  }

  get dialogosFiltrados(): DialogoTranscricao[] {
    let dialogos = this.dialogos;
    if (this.filtroParticipante) {
      dialogos = dialogos.filter(d => d.participante === this.filtroParticipante);
    }
    return dialogos;
  }

  // ==================== INICIALIZAÇÃO ====================
  private inicializarDados(): void {
    this.processoInfo = {
      numero: '5001234-89.2023.5.02.0011',
      requerente: 'João Silva Santos',
      requerido: 'Empresa ABC Ltda',
      vara: '1ª Vara do Trabalho de Salvador',
      dataAudiencia: new Date('2024-01-15T14:00:00'),
      tipoAudiencia: 'Audiência de Instrução e Julgamento',
      duracao: '01:23:45'
    };

    this.participantesDisponiveis = [
      { nome: 'Dr. Carlos Mendes', tipo: 'Juiz', cor: '#2c3e50', avatar: 'CM', totalDialogos: 8, falas: 8 },
      { nome: 'João Silva Santos', tipo: 'Requerente', cor: '#3498db', avatar: 'JS', totalDialogos: 12, falas: 12 },
      { nome: 'Dr. Ana Costa', tipo: 'Advogado Requerente', cor: '#27ae60', avatar: 'AC', totalDialogos: 10, falas: 10 },
      { nome: 'Maria Oliveira', tipo: 'Requerido', cor: '#e74c3c', avatar: 'MO', totalDialogos: 6, falas: 6 },
      { nome: 'Dr. Roberto Lima', tipo: 'Advogado Requerido', cor: '#f39c12', avatar: 'RL', totalDialogos: 9, falas: 9 },
      { nome: 'Sandra Ferreira', tipo: 'Testemunha', cor: '#9b59b6', avatar: 'SF', totalDialogos: 4, falas: 4 },
      { nome: 'Dra. Lucia Pereira', tipo: 'Perita', cor: '#1abc9c', avatar: 'LP', totalDialogos: 3, falas: 3 }
    ];

    this.dialogos = this.gerarDialogosSimulados();
  }

  private gerarDialogosSimulados(): DialogoTranscricao[] {
    const dialogosBase = [
      { participante: 'Dr. Carlos Mendes', texto: 'Declaro aberta a presente audiência de instrução e julgamento. Solicito que todos se identifiquem devidamente para os registros da ata.' },
      { participante: 'João Silva Santos', texto: 'João Silva Santos, requerente nos autos, brasileiro, casado, operário, portador da identidade número 1234567 SSP/BA.' },
      { participante: 'Dr. Ana Costa', texto: 'Dra. Ana Costa Silva, OAB/BA 12345, advogada constituída do requerente, com escritório na Rua das Flores, 123.' },
      { participante: 'Maria Oliveira', texto: 'Maria Oliveira Santos, representante legal da empresa requerida, brasileira, administradora, identidade 9876543 SSP/BA.' },
      { participante: 'Dr. Roberto Lima', texto: 'Dr. Roberto Lima Pereira, OAB/BA 67890, advogado constituído da empresa requerida, com escritório na Avenida Principal, 456.' },
      { participante: 'Sandra Ferreira', texto: 'Sandra Ferreira da Silva, testemunha arrolada pelo requerente, brasileira, solteira, auxiliar administrativo, identidade 5555555.' },
      { participante: 'Dra. Lucia Pereira', texto: 'Dra. Lucia Pereira dos Santos, perita judicial nomeada pelo juízo, especialista em medicina do trabalho, CRM/BA 98765.' },
      
      { participante: 'Dr. Carlos Mendes', texto: 'Verifico que as partes estão devidamente representadas e presentes. Declaro aberta a instrução. Passo a palavra ao advogado do requerente para exposição inicial dos fatos.' },
      { participante: 'Dr. Ana Costa', texto: 'Meritíssimo, o requerente João Silva trabalhou na empresa ré por cinco anos consecutivos, de 2018 a 2023, sem qualquer registro em carteira de trabalho, fazendo jus ao reconhecimento do vínculo empregatício e seus reflexos.' },
      { participante: 'Dr. Roberto Lima', texto: 'Contesto veementemente, Excelência. O requerente prestava serviços como autônomo especializado, conforme contrato de prestação de serviços e documentação fiscal apresentada nos autos, não havendo subordinação ou exclusividade.' },
      
      { participante: 'Dr. Carlos Mendes', texto: 'Passo a ouvir o depoimento pessoal do requerente. Senhor João, o senhor prestou compromisso de dizer a verdade. Relate como era sua rotina de trabalho na empresa.' },
      { participante: 'João Silva Santos', texto: 'Sim, doutor. Eu trabalhava de segunda a sexta-feira, das 8h às 17h, com uma hora de almoço das 12h às 13h. Tinha que bater ponto todos os dias no relógio da empresa, igual aos outros funcionários.' },
      { participante: 'João Silva Santos', texto: 'Recebia ordens diretas do supervisor de manutenção, senhor Carlos, e não podia faltar sem avisar. Usava uniforme da empresa e todas as ferramentas eram fornecidas por eles.' },
      { participante: 'Dr. Ana Costa', texto: 'O senhor tinha liberdade para trabalhar para outras empresas durante esse período?' },
      { participante: 'João Silva Santos', texto: 'Não, doutora. Eles falaram que eu não podia trabalhar para concorrente nenhum. Era exclusivo deles. Só trabalhava lá durante a semana toda.' },
      
      { participante: 'Dr. Roberto Lima', texto: 'Senhor João, o senhor emitia nota fiscal pelos serviços prestados, não é verdade?' },
      { participante: 'João Silva Santos', texto: 'Sim, mas era a própria empresa que me orientava como fazer. Eles até me deram o contador deles para abrir o MEI.' },
      { participante: 'Dr. Roberto Lima', texto: 'E o senhor tinha CNPJ ativo durante todo o período, correto?' },
      { participante: 'João Silva Santos', texto: 'Tinha sim, mas só porque eles exigiram. Eu nem sabia direito o que era isso. Só queria trabalhar.' },
      
      { participante: 'Dr. Carlos Mendes', texto: 'Como pode observar, Excelência, havia clara subordinação e horário rígido, características inequívocas do vínculo empregatício, independentemente da emissão de notas fiscais.' },
      { participante: 'Dr. Ana Costa', texto: 'Exatamente, Meritíssimo. A subordinação era evidente, com controle de horário, uso de uniforme, exclusividade e dependência econômica total.' },
      
      { participante: 'Dr. Carlos Mendes', texto: 'Chamo a representante da empresa para prestar depoimento. Senhora Maria, a empresa controláva efetivamente o horário do senhor João?' },
      { participante: 'Maria Oliveira', texto: 'Vossa Excelência, o João prestava serviços técnicos especializados em manutenção. Ele tinha horário porque nossa fábrica funciona em horário comercial normal.' },
      { participante: 'Maria Oliveira', texto: 'Ele emitia notas fiscais mensalmente no valor de R$ 3.500,00 e tinha total liberdade para organizar seu trabalho dentro do setor de manutenção.' },
      { participante: 'Dr. Ana Costa', texto: 'Mas a empresa fornecia uniforme, ferramentas e controlava a jornada rigorosamente, não é verdade?' },
      { participante: 'Maria Oliveira', texto: 'O uniforme era por questão de segurança do trabalho, exigida pelas normas. As ferramentas eram especializadas que ele não tinha. Quanto ao controle, era apenas organização.' },
      
      { participante: 'Dr. Roberto Lima', texto: 'Vossa Excelência, a prestação de serviços especializados em horário determinado não configura vínculo empregatício, conforme jurisprudência consolidada do TST.' },
      { participante: 'Dr. Ana Costa', texto: 'Mas havia subordinação evidente, Excelência. O requerente recebia ordens diretas, não podia se ausentar e era tratado como empregado em todos os aspectos práticos.' },
      
      { participante: 'Dr. Carlos Mendes', texto: 'Passo a ouvir a testemunha. Senhora Sandra, a senhora conhece a rotina de trabalho do senhor João na empresa?' },
      { participante: 'Sandra Ferreira', texto: 'Conheço sim, doutor. Trabalhei na mesma empresa por três anos e posso confirmar que o João seguia exatamente as mesmas regras que nós, empregados registrados.' },
      { participante: 'Sandra Ferreira', texto: 'Ele batia ponto igual a gente, usava o mesmo uniforme, almoçava no mesmo horário no refeitório da empresa e recebia ordens do mesmo supervisor.' },
      { participante: 'Sandra Ferreira', texto: 'A única diferença é que no final do mês ele levava uma nota fiscal para o RH, mas todo mundo sabia que ele era funcionário igual aos outros.' },
      
      { participante: 'Dr. Roberto Lima', texto: 'A testemunha trabalhava no setor administrativo e não acompanhava diretamente a rotina técnica do requerente no setor de manutenção, não tendo conhecimento específico.' },
      { participante: 'Sandra Ferreira', texto: 'Mas doutor, eu via ele todo dia. A empresa não é grande. O setor de manutenção fica do lado do administrativo. Eu via tudo.' },
      
      { participante: 'Dr. Carlos Mendes', texto: 'Passo a palavra à perita judicial. Doutora Lucia, qual a conclusão de sua análise pericial?' },
      { participante: 'Dra. Lucia Pereira', texto: 'Meritíssimo, após análise detalhada dos documentos e cartões de ponto, há evidências claras de controle rígido de jornada e subordinação hierárquica.' },
      { participante: 'Dra. Lucia Pereira', texto: 'Os cartões de ponto demonstram frequência regular de 8h diárias, com intervalos padronizados. O controle era idêntico ao dos empregados registrados.' },
      { participante: 'Dra. Lucia Pereira', texto: 'Ademais, a análise das ordens de serviço comprova que o requerente recebia determinações específicas sobre quando, como e onde executar suas atividades.' },
      
      { participante: 'Dr. Roberto Lima', texto: 'A perícia não considerou adequadamente a natureza técnica especializada dos serviços, que naturalmente exige coordenação temporal com as atividades fabris.' },
      { participante: 'Dra. Lucia Pereira', texto: 'Doutor, analisei também contratos similares de prestadores genuinamente autônomos. O padrão é completamente diferente. Há autonomia real, sem controle de jornada.' },
      
      { participante: 'Dr. Carlos Mendes', texto: 'Analisando todo o conjunto probatório produzido nos autos, verifico elementos suficientes e convincentes para reconhecer a existência de vínculo empregatício.' },
      { participante: 'Dr. Carlos Mendes', texto: 'Ficaram demonstrados os requisitos da subordinação, pessoalidade, não eventualidade e onerosidade, conforme artigos 2º e 3º da CLT.' },
      { participante: 'Dr. Ana Costa', texto: 'Diante do reconhecimento do vínculo, requeiro a condenação da ré ao pagamento de FGTS com 40% de multa, 13º salário proporcional, férias proporcionais com 1/3 e aviso prévio.' },
      { participante: 'Dr. Ana Costa', texto: 'Requeiro também o pagamento de horas extras pelos trabalhos em sábados eventualmente prestados, conforme documentos juntados, com adicional de 50%.' },
      
      { participante: 'Dr. Roberto Lima', texto: 'Excelência, reitero que não houve vínculo empregatício. Em caso de eventual reconhecimento, contesto os valores pleiteados por ausência de prova específica dos danos.' },
      { participante: 'Dr. Carlos Mendes', texto: 'As alegações finais ficam dispensadas tendo em vista a manifestação das partes. Declaro encerrada a instrução e dou por conclusos os autos para sentença.' },
      { participante: 'Dr. Carlos Mendes', texto: 'A sentença será proferida no prazo legal. Declaro encerrada a presente audiência. Nada mais havendo, determino o encerramento da ata.' }
    ];

    return dialogosBase.map((item, index) => {
      const timestampSegundos = 120 + (index * 180);
      const participanteInfo = this.participantesDisponiveis.find(p => p.nome === item.participante);
      
      return {
        id: `dialogo_${index + 1}`,
        timestamp: this.formatarTempo(timestampSegundos),
        timestampSegundos,
        duracaoSegundos: 45 + Math.floor(Math.random() * 60),
        participante: item.participante,
        tipo: participanteInfo?.tipo || 'Participante',
        texto: item.texto,
        confianca: this.gerarNivelConfianca() as 'alta' | 'media' | 'baixa',
        confiancaValor: 0.7 + Math.random() * 0.3,
        revisado: Math.random() > 0.6,
        marcado: Math.random() > 0.8,
        marcadoRevisao: Math.random() > 0.7,
        matchBusca: false,
        nota: Math.random() > 0.8 ? 'Nota de exemplo' : undefined,
        notas: Math.random() > 0.8 ? 'Nota de exemplo' : undefined,
        alteracoes: this.gerarHistoricoAlteracoes(),
        historico: this.gerarHistoricoAlteracoes()
      };
    });
  }

  private gerarNivelConfianca(): string {
    const rand = Math.random();
    if (rand > 0.7) return 'alta';
    if (rand > 0.4) return 'media';
    return 'baixa';
  }

  private gerarHistoricoAlteracoes(): AlteracaoHistorico[] {
    const alteracoes: AlteracaoHistorico[] = [];
    const shouldHaveHistory = Math.random() > 0.7;
    
    if (shouldHaveHistory) {
      alteracoes.push({
        id: `alt_${Date.now()}`,
        data: new Date(Date.now() - Math.floor(Math.random() * 86400000)),
        usuario: 'Sistema Automático',
        tipo: 'texto',
        valorAnterior: 'Texto transcrito automaticamente...',
        valorNovo: 'Texto corrigido manualmente...',
        observacao: 'Correção de transcrição automática'
      });
    }
    
    return alteracoes;
  }

  // ==================== MÉTODOS DE ÁUDIO ====================
  reproduzirAudio(): void {
    this.audioTocando = !this.audioTocando;
    if (this.audioTocando) {
      this.simularReproducao();
    }
  }

  pausarAudio(): void {
    this.audioTocando = false;
    this.dialogoTocando = null;
  }

  pararAudio(): void {
    this.audioTocando = false;
    this.dialogoTocando = null;
    this.tempoAtualSegundos = 0;
  }

  reproduzirDialogo(dialogo: DialogoTranscricao): void {
    this.dialogoTocando = this.dialogoTocando === dialogo.id ? null : dialogo.id;
    if (this.dialogoTocando) {
      this.tempoAtualSegundos = dialogo.timestampSegundos;
      this.audioTocando = true;
      setTimeout(() => {
        this.dialogoTocando = null;
      }, dialogo.duracaoSegundos * 1000);
    }
  }

  irParaTempo(event: MouseEvent): void {
    const progressBar = event.currentTarget as HTMLElement;
    const rect = progressBar.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const percentage = clickX / rect.width;
    this.tempoAtualSegundos = Math.floor(percentage * this.tempoTotalSegundos);
  }

  private simularReproducao(): void {
    if (this.audioTocando && this.tempoAtualSegundos < this.tempoTotalSegundos) {
      setTimeout(() => {
        this.tempoAtualSegundos += 1;
        this.simularReproducao();
      }, 1000);
    } else {
      this.audioTocando = false;
    }
  }

  getProgressoAudio(): number {
    return (this.tempoAtualSegundos / this.tempoTotalSegundos) * 100;
  }

  getPositionMarker(timestampSegundos: number): number {
    return (timestampSegundos / this.tempoTotalSegundos) * 100;
  }

  // ==================== MÉTODOS DE FORMATAÇÃO ====================
  formatarTempo(segundos: number): string {
    const horas = Math.floor(segundos / 3600);
    const minutos = Math.floor((segundos % 3600) / 60);
    const segs = Math.floor(segundos % 60);
    
    // Sempre retorna formato HH:MM:SS
    return `${horas.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}:${segs.toString().padStart(2, '0')}`;
  }

  formatarIntervaloTempo(dialogo: DialogoTranscricao): string {
    const tempoInicio = this.formatarTempo(dialogo.timestampSegundos);
    const tempoFim = this.formatarTempo(dialogo.timestampSegundos + dialogo.duracaoSegundos);
    return `${tempoInicio} - ${tempoFim}`;
  }

  // ==================== MÉTODOS DE BUSCA ====================
  buscarNaTranscricao(): void {
    this.resultadosBusca = [];
    this.resultadoAtual = 0;
    
    if (!this.termoBusca.trim()) {
      return;
    }

    const termo = this.termoBusca.toLowerCase();
    this.dialogos.forEach((dialogo, index) => {
      const texto = dialogo.texto.toLowerCase();
      let pos = texto.indexOf(termo);
      
      while (pos !== -1) {
        this.resultadosBusca.push({
          dialogoIndex: index,
          posicao: pos,
          contexto: this.extrairContexto(dialogo.texto, pos, termo.length)
        });
        pos = texto.indexOf(termo, pos + 1);
      }
    });
  }

  private extrairContexto(texto: string, posicao: number, tamanhoTermo: number): string {
    const inicio = Math.max(0, posicao - 20);
    const fim = Math.min(texto.length, posicao + tamanhoTermo + 20);
    return texto.substring(inicio, fim);
  }

  limparBusca(): void {
    this.termoBusca = '';
    this.resultadosBusca = [];
    this.resultadoAtual = 0;
  }

  irParaResultado(direcao: 'anterior' | 'proximo'): void {
    if (this.resultadosBusca.length === 0) return;
    
    if (direcao === 'anterior' && this.resultadoAtual > 0) {
      this.resultadoAtual--;
    } else if (direcao === 'proximo' && this.resultadoAtual < this.resultadosBusca.length - 1) {
      this.resultadoAtual++;
    }
    
    const resultado = this.resultadosBusca[this.resultadoAtual];
    this.destacarDialogo(resultado.dialogoIndex);
  }

  destacarTermoBusca(texto: string): string {
    if (!this.termoBusca.trim()) {
      return texto;
    }
    
    const regex = new RegExp(`(${this.termoBusca})`, 'gi');
    return texto.replace(regex, '<span class="highlight">$1</span>');
  }

  // ==================== MÉTODOS DE PARTICIPANTES ====================
  getCorParticipante(nome: string): string {
    const participante = this.participantesDisponiveis.find(p => p.nome === nome);
    return participante?.cor || '#95a5a6';
  }

  filtrarPorParticipante(nome: string): void {
    this.filtroParticipante = this.filtroParticipante === nome ? '' : nome;
  }

  editarParticipante(participante: Participante): void {
    console.log('Editando participante:', participante);
  }

  adicionarParticipante(): void {
    console.log('Adicionando novo participante');
  }

  editarParticipanteDialogo(index: number): void {
    this.editandoParticipante[index] = true;
    this.participanteEditando = this.dialogos[index].participante;
  }

  salvarParticipante(index: number): void {
    const dialogo = this.dialogos[index];
    const valorAnterior = dialogo.participante;
    
    dialogo.participante = this.participanteEditando;
    dialogo.alteracoes.push({
      id: `alt_${Date.now()}`,
      data: new Date(),
      usuario: 'Usuário Atual',
      tipo: 'participante',
      valorAnterior,
      valorNovo: this.participanteEditando,
      observacao: 'Correção de identificação do participante'
    });
    
    this.editandoParticipante[index] = false;
    this.alteracoesPendentes++;
  }

  cancelarEdicaoParticipante(index: number): void {
    this.editandoParticipante[index] = false;
    this.participanteEditando = '';
  }

  // ==================== MÉTODOS DE DIÁLOGOS ====================
  editarDialogo(index: number): void {
    if (this.dialogoEditando === index) {
      this.dialogoEditando = null;
      this.textoEditando = '';
    } else {
      this.dialogoEditando = index;
      this.textoEditando = this.dialogos[index].texto;
    }
  }

  salvarEdicao(): void {
    if (this.dialogoEditando === null) return;
    
    const dialogo = this.dialogos[this.dialogoEditando];
    const valorAnterior = dialogo.texto;
    
    dialogo.texto = this.textoEditando;
    dialogo.alteracoes.push({
      id: `alt_${Date.now()}`,
      data: new Date(),
      usuario: 'Usuário Atual',
      tipo: 'texto',
      valorAnterior,
      valorNovo: this.textoEditando,
      observacao: 'Correção manual do texto'
    });
    
    this.dialogoEditando = null;
    this.textoEditando = '';
    this.alteracoesPendentes++;
  }

  cancelarEdicao(): void {
    this.dialogoEditando = null;
    this.textoEditando = '';
  }

  // ==================== MÉTODOS DE EDIÇÃO DE LOCUTOR ====================
  iniciarEdicaoLocutor(index: number): void {
    this.modoEdicaoLocutor = true;
    this.dialogoEditandoLocutor = index;
    this.locutorOriginal = this.dialogos[index].participante;
    this.novoLocutor = '';
    this.locutorAtualFoiEditado = false; // Reset da variável
  }

  iniciarTrocaLocutor(index: number): void {
    this.modoEdicaoLocutor = true;
    this.dialogoEditandoLocutor = index;
    this.locutorOriginal = this.dialogos[index].participante;
    this.novoLocutor = '';
    this.locutorAtualFoiEditado = false;
  }

  selecionarSugestao(nomeLocutor: string): void {
    if (nomeLocutor === this.locutorOriginal) return;
    this.selecionarLocutorExistente(nomeLocutor);
  }

  limparCampo(): void {
    this.novoLocutor = '';
  }

  cancelarEdicaoLocutor(): void {
    this.modoEdicaoLocutor = false;
    this.dialogoEditandoLocutor = null;
    this.locutorOriginal = '';
    this.novoLocutor = '';
    this.modoAdicionarNovoLocutor = false;
    this.showPopupNovoLocutor = false;
    this.novoLocutorNome = '';
    this.novoLocutorPapel = '';
    this.locutorAtualFoiEditado = false; // Reset da variável
    // Não limpar locutoresAdicionados aqui para manter os novos locutores
  }

  ativarModoAdicionarNovoLocutor(): void {
    this.showPopupNovoLocutor = true;
    this.novoLocutorNome = '';
    this.novoLocutorPapel = '';
  }

  cancelarNovoLocutor(): void {
    this.showPopupNovoLocutor = false;
    this.novoLocutorNome = '';
    this.novoLocutorPapel = '';
  }

  salvarNovoLocutor(): void {
    if (!this.novoLocutorNome.trim() || !this.novoLocutorPapel.trim()) return;
    
    const nomeCompleto = this.novoLocutorNome.trim();
    const papel = this.novoLocutorPapel.trim();
    
    // Verificar se já existe
    const jaExiste = [...this.participantesDisponiveis, ...this.locutoresAdicionados]
      .some(p => p.nome.toLowerCase() === nomeCompleto.toLowerCase());
    
    if (jaExiste) {
      alert('Este locutor já existe na lista!');
      return;
    }
    
    // Adicionar à lista de locutores adicionados manualmente
    const novoParticipante: Participante = {
      nome: nomeCompleto,
      tipo: papel,
      cor: '#007bff',
      avatar: '',
      totalDialogos: 0,
      falas: 0
    };
    
    this.locutoresAdicionados.push(novoParticipante);
    
    // Selecionar automaticamente o novo locutor
    this.novoLocutor = nomeCompleto;
    
    // Fechar popup
    this.showPopupNovoLocutor = false;
    this.novoLocutorNome = '';
    this.novoLocutorPapel = '';
  }

  selecionarPapel(papel: string): void {
    this.novoLocutorPapel = papel;
  }

  // ==================== MÉTODOS POPUP EDITAR LOCUTOR ====================
  abrirEdicaoLocutor(nomeParticipante: string): void {
    // Encontrar o participante pela string do nome
    const participante = this.participantesDisponiveis.find(p => p.nome === nomeParticipante) ||
                        this.locutoresAdicionados.find(p => p.nome === nomeParticipante);
    
    if (!participante) {
      // Se não encontrar, criar um participante temporário
      const participanteTemp: Participante = {
        nome: nomeParticipante,
        tipo: this.getParticipantePapel(nomeParticipante),
        cor: '#007bff',
        avatar: '',
        totalDialogos: 0,
        falas: 0
      };
      this.locutorEdicaoParticipante = participanteTemp;
    } else {
      this.locutorEdicaoParticipante = participante;
    }
    
    this.popupEditarLocutorVisivel = true;
    this.locutorEdicaoNome = this.locutorEdicaoParticipante.nome;
    this.locutorEdicaoPapel = this.locutorEdicaoParticipante.tipo;
  }

  cancelarEdicaoLocutorPopup(): void {
    this.popupEditarLocutorVisivel = false;
    this.locutorEdicaoNome = '';
    this.locutorEdicaoPapel = '';
    this.locutorEdicaoParticipante = null;
  }

  selecionarPapelEdicao(papel: string): void {
    this.locutorEdicaoPapel = papel;
  }

  salvarEdicaoLocutor(): void {
    if (!this.locutorEdicaoNome.trim() || !this.locutorEdicaoPapel.trim() || !this.locutorEdicaoParticipante) return;
    
    const nomeAntigo = this.locutorEdicaoParticipante.nome;
    const nomeNovo = this.locutorEdicaoNome.trim();
    const papelNovo = this.locutorEdicaoPapel.trim();
    
    // Atualizar o participante na lista original
    const participanteEncontrado = this.participantesDisponiveis.find(p => p.nome === nomeAntigo);
    if (participanteEncontrado) {
      participanteEncontrado.nome = nomeNovo;
      participanteEncontrado.tipo = papelNovo;
    }
    
    // Atualizar também na lista de adicionados se existir
    const participanteAdicionado = this.locutoresAdicionados.find(p => p.nome === nomeAntigo);
    if (participanteAdicionado) {
      participanteAdicionado.nome = nomeNovo;
      participanteAdicionado.tipo = papelNovo;
    }
    
    // Atualizar todos os diálogos que usam este locutor
    this.dialogos.forEach(dialogo => {
      if (dialogo.participante === nomeAntigo) {
        dialogo.participante = nomeNovo;
      }
    });
    
    // Fechar popup
    this.cancelarEdicaoLocutorPopup();
  }

  // ==================== MÉTODOS PARA VÍDEO INTEGRADO ====================
  carregarVideoDialogo(dialogo: DialogoTranscricao): void {
    this.dialogoVideoAtual = dialogo;
    this.videoUrl = 'assets/video.mp4';
    this.videoCarregado = true;
  }

  onVideoLoaded(): void {
    if (this.videoPlayer && this.dialogoVideoAtual) {
      // Quando o vídeo carrega, posiciona no timestamp correto
      const tempoSegundos = this.dialogoVideoAtual.timestampSegundos || 0;
      this.videoPlayer.nativeElement.currentTime = tempoSegundos;
    }
  }

  playFromTimestamp(): void {
    if (this.videoPlayer && this.dialogoVideoAtual) {
      const tempoSegundos = this.dialogoVideoAtual.timestampSegundos || 0;
      this.videoPlayer.nativeElement.currentTime = tempoSegundos;
      this.videoPlayer.nativeElement.play();
    }
  }

  fecharVideo(): void {
    this.videoCarregado = false;
    this.videoUrl = '';
    this.dialogoVideoAtual = null;
    if (this.videoPlayer) {
      this.videoPlayer.nativeElement.pause();
      this.videoPlayer.nativeElement.currentTime = 0;
    }
  }

  // Método para abrir vídeo em modal interno (para qualquer diálogo)
  abrirVideoEmJanela(dialogo: DialogoTranscricao): void {
    this.dialogoVideoModal = dialogo;
    this.modalVideoAberto = true;
    
    // Aguardar o DOM atualizar para posicionar o vídeo
    setTimeout(() => {
      if (this.videoPlayerModal && this.videoPlayerModal.nativeElement) {
        const video = this.videoPlayerModal.nativeElement;
        const tempoInicioSegundos = dialogo.timestampSegundos || 0;
        
        video.currentTime = tempoInicioSegundos;
        video.play().catch(err => {
          console.log('Erro ao reproduzir vídeo:', err);
        });
      }
    }, 100);
  }

  // Método para fechar modal de vídeo
  fecharModalVideo(): void {
    this.modalVideoAberto = false;
    this.dialogoVideoModal = null;
    
    // Pausar o vídeo
    if (this.videoPlayerModal && this.videoPlayerModal.nativeElement) {
      this.videoPlayerModal.nativeElement.pause();
    }
  }

  // ==================== MÉTODOS AUXILIARES ====================
  selecionarLocutorExistente(nomeLocutor: string): void {
    if (this.dialogoEditandoLocutor === null) return;
    
    const dialogo = this.dialogos[this.dialogoEditandoLocutor];
    const valorAnterior = dialogo.participante;
    
    dialogo.participante = nomeLocutor;
    dialogo.alteracoes.push({
      id: `dialogo_${Date.now()}`,
      data: new Date(),
      usuario: 'Usuário Atual',
      tipo: 'participante',
      valorAnterior,
      valorNovo: nomeLocutor,
      observacao: 'Alteração de locutor'
    });
    
    this.alteracoesPendentes++;
    this.cancelarEdicaoLocutor();
  }

  destacarDialogo(index: number): void {
    this.dialogoAtivo = index;
    setTimeout(() => {
      const elemento = document.querySelector(`#dialogo-${index}`);
      if (elemento) {
        elemento.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  }

  marcarDialogo(index: number): void {
    this.dialogos[index].marcado = !this.dialogos[index].marcado;
  }

  anotarDialogo(index: number): void {
    const nota = prompt('Digite uma anotação para este diálogo:');
    if (nota) {
      this.dialogos[index].nota = nota;
      this.alteracoesPendentes++;
    }
  }

  aplicarFormatacao(tipo: 'negrito' | 'italico' | 'sublinhado'): void {
    if (this.dialogoEditando === null) return;
    
    const textarea = document.querySelector('.textarea-edicao') as HTMLTextAreaElement;
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const textoSelecionado = this.textoEditando.substring(start, end);
    
    if (textoSelecionado) {
      let textoFormatado = '';
      switch (tipo) {
        case 'negrito':
          textoFormatado = `**${textoSelecionado}**`;
          break;
        case 'italico':
          textoFormatado = `*${textoSelecionado}*`;
          break;
        case 'sublinhado':
          textoFormatado = `_${textoSelecionado}_`;
          break;
      }
      
      this.textoEditando = this.textoEditando.substring(0, start) + textoFormatado + this.textoEditando.substring(end);
    }
  }

  inserirTimestamp(): void {
    const timestamp = `[${this.formatarTempo(this.tempoAtualSegundos)}]`;
    this.textoEditando += ` ${timestamp}`;
  }

  // ==================== MÉTODOS DE HISTÓRICO ====================
  toggleHistorico(index: number): void {
    this.mostrarHistorico[index] = !this.mostrarHistorico[index];
  }

  getIconeAlteracao(tipo: string): string {
    switch (tipo) {
      case 'texto': return '📝';
      case 'participante': return '👤';
      case 'timestamp': return '⏰';
      case 'nota': return '📋';
      default: return '✏️';
    }
  }

  // ==================== MÉTODOS DE EXPORTAÇÃO ====================
  exportarTranscricao(): void {
    const dadosExportacao = {
      processo: this.processoInfo,
      dialogos: this.dialogos,
      participantes: this.participantesUnicos,
      metadados: {
        dataExportacao: new Date(),
        totalDialogos: this.dialogos.length,
        duracaoTotal: this.tempoTotalSegundos,
        versao: '1.0'
      }
    };

    const dataStr = JSON.stringify(dadosExportacao, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    const a = link;
    a.download = `transcricao_${this.processoInfo.numero.replace(/[^\w]/g, '_')}.json`;
    link.click();
  }

  // ==================== MÉTODOS DE MODAL ====================
  maximizarModal(): void {
    this.isMaximizado = !this.isMaximizado;
  }

  fecharModal(): void {
    if (this.temAlteracoes) {
      const confirmar = confirm('Existem alterações não salvas. Deseja realmente fechar?');
      if (!confirmar) return;
    }
    this.fechar.emit();
  }

  salvarTranscricao(): void {
    this.salvar.emit(this.dialogos);
    this.alteracoesPendentes = 0;
  }

  // ==================== MÉTODOS DO CICLO DE VIDA ====================
  ngOnInit(): void {
    this.inicializarDados();
  }

  // ==================== MÉTODOS FALTANTES ====================
  
  // Método para alternar maximização do modal
  toggleMaximizar(): void {
    this.isMaximizado = !this.isMaximizado;
  }

  // Método para verificar se é novo locutor
  isNovoLocutor(nomeLocutor: string): boolean {
    // Verificar se o locutor foi adicionado recentemente
    return this.participantesUnicos.some((p: Participante) => p.nome === nomeLocutor && p.nome.includes('NOVO'));
  }

  // Métodos para edição de locutor atual
  iniciarEdicaoLocutorAtual(): void {
    this.modoEdicaoLocutor = true;
  }

  selecionarPapelLocutorAtual(papel: string): void {
    this.locutorEdicaoPapel = papel;
  }

  cancelarEdicaoLocutorAtual(): void {
    this.modoEdicaoLocutor = false;
    this.dialogoEditandoLocutor = null;
    this.locutorOriginal = '';
    this.novoLocutor = '';
  }

  salvarEdicaoLocutorAtual(): void {
    if (this.dialogoEditandoLocutor !== null && this.novoLocutor.trim()) {
      this.selecionarLocutorExistente(this.novoLocutor.trim());
      this.cancelarEdicaoLocutorAtual();
    }
  }

  // Método para confirmar edição de locutor
  confirmarEdicaoLocutor(): void {
    this.salvarEdicaoLocutorAtual();
  }

  // Método para obter histórico geral
  getHistoricoGeral(): AlteracaoHistorico[] {
    const historico: AlteracaoHistorico[] = [];
    
    this.dialogos.forEach(dialogo => {
      if (dialogo.alteracoes && dialogo.alteracoes.length > 0) {
        historico.push(...dialogo.alteracoes);
      }
    });
    
    // Ordenar por data mais recente primeiro
    return historico.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
  }

  ngOnDestroy(): void {
    if (this.audioTocando) {
      this.pausarAudio();
    }
  }
}
