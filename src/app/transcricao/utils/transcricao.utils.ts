import { DialogoTranscricao, Participante, NivelConfianca } from '../models/transcricao.types';

// ==================== FORMATAÇÃO DE TEMPO ====================
export class TempoUtils {
  /**
   * Formata segundos em HH:MM:SS ou MM:SS
   */
  static formatarTempo(segundos: number): string {
    const horas = Math.floor(segundos / 3600);
    const minutos = Math.floor((segundos % 3600) / 60);
    const segs = Math.floor(segundos % 60);
    
    if (horas > 0) {
      return `${horas}:${minutos.toString().padStart(2, '0')}:${segs.toString().padStart(2, '0')}`;
    }
    
    return `${minutos}:${segs.toString().padStart(2, '0')}`;
  }

  /**
   * Converte tempo formatado de volta para segundos
   */
  static parseTempo(tempo: string): number {
    const partes = tempo.split(':').map(p => parseInt(p, 10));
    if (partes.length === 3) {
      return partes[0] * 3600 + partes[1] * 60 + partes[2];
    }
    if (partes.length === 2) {
      return partes[0] * 60 + partes[1];
    }
    return 0;
  }

  /**
   * Cria intervalo de tempo para um diálogo
   */
  static formatarIntervalo(dialogo: DialogoTranscricao): string {
    const inicio = this.formatarTempo(dialogo.timestampSegundos);
    const fim = this.formatarTempo(dialogo.timestampSegundos + dialogo.duracaoSegundos);
    return `${inicio} - ${fim}`;
  }
}

// ==================== PARTICIPANTES ====================
export class ParticipanteUtils {
  /**
   * Gera avatar das iniciais do nome
   */
  static gerarAvatar(nome: string): string {
    return nome
      .split(' ')
      .slice(0, 2)
      .map(palavra => palavra.charAt(0))
      .join('')
      .toUpperCase();
  }

  /**
   * Calcula estatísticas de participação
   */
  static calcularEstatisticas(participante: Participante, dialogos: DialogoTranscricao[]) {
    const dialogosParticipante = dialogos.filter(d => d.participante === participante.nome);
    
    return {
      ...participante,
      avatar: this.gerarAvatar(participante.nome),
      totalDialogos: dialogosParticipante.length,
      falas: dialogosParticipante.length,
      tempoTotalFala: dialogosParticipante.reduce((total, d) => total + d.duracaoSegundos, 0),
      percentualParticipacao: dialogos.length > 0 ? (dialogosParticipante.length / dialogos.length) * 100 : 0
    };
  }

  /**
   * Gera cor baseada no tipo de participante
   */
  static gerarCorPorTipo(tipo: string): string {
    const cores = {
      'Juiz': '#2c3e50',
      'Advogado': '#27ae60', 
      'Requerente': '#3498db',
      'Requerido': '#e74c3c',
      'Testemunha': '#9b59b6',
      'Perito': '#1abc9c',
      'Escrivão': '#f39c12',
      'Promotor': '#34495e'
    };
    
    return cores[tipo as keyof typeof cores] || '#95a5a6';
  }
}

// ==================== BUSCA E FILTROS ====================
export class BuscaUtils {
  /**
   * Destaca termo de busca no texto
   */
  static destacarTermo(texto: string, termo: string): string {
    if (!termo.trim()) return texto;
    
    const regex = new RegExp(`(${this.escaparRegex(termo)})`, 'gi');
    return texto.replace(regex, '<mark class="highlight">$1</mark>');
  }

  /**
   * Escapa caracteres especiais para regex
   */
  private static escaparRegex(texto: string): string {
    return texto.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Extrai contexto ao redor de um termo encontrado
   */
  static extrairContexto(texto: string, posicao: number, tamanhoTermo: number, tamanhoContexto = 30): string {
    const inicio = Math.max(0, posicao - tamanhoContexto);
    const fim = Math.min(texto.length, posicao + tamanhoTermo + tamanhoContexto);
    
    let contexto = texto.substring(inicio, fim);
    
    // Adicionar indicadores se o contexto foi cortado
    if (inicio > 0) contexto = '...' + contexto;
    if (fim < texto.length) contexto = contexto + '...';
    
    return contexto;
  }

  /**
   * Busca em múltiplos campos de um diálogo
   */
  static buscarEmDialogo(dialogo: DialogoTranscricao, termo: string): boolean {
    const termoLower = termo.toLowerCase();
    
    return dialogo.texto.toLowerCase().includes(termoLower) ||
           dialogo.participante.toLowerCase().includes(termoLower) ||
           dialogo.nota?.toLowerCase().includes(termoLower) ||
           false;
  }
}

// ==================== VALIDAÇÕES ====================
export class ValidacaoUtils {
  /**
   * Valida se um diálogo está bem formado
   */
  static validarDialogo(dialogo: DialogoTranscricao): { valido: boolean; erros: string[] } {
    const erros: string[] = [];
    
    if (!dialogo.id.trim()) erros.push('ID é obrigatório');
    if (!dialogo.texto.trim()) erros.push('Texto é obrigatório');
    if (!dialogo.participante.trim()) erros.push('Participante é obrigatório');
    if (dialogo.timestampSegundos < 0) erros.push('Timestamp deve ser positivo');
    if (dialogo.duracaoSegundos <= 0) erros.push('Duração deve ser maior que zero');
    if (dialogo.confiancaValor < 0 || dialogo.confiancaValor > 1) erros.push('Valor de confiança deve estar entre 0 e 1');
    
    return {
      valido: erros.length === 0,
      erros
    };
  }

  /**
   * Valida dados de participante
   */
  static validarParticipante(participante: Participante): { valido: boolean; erros: string[] } {
    const erros: string[] = [];
    
    if (!participante.nome.trim()) erros.push('Nome é obrigatório');
    if (!participante.tipo.trim()) erros.push('Tipo é obrigatório');
    if (!this.isCorValida(participante.cor)) erros.push('Cor deve ser um hex válido');
    
    return {
      valido: erros.length === 0,
      erros
    };
  }

  private static isCorValida(cor: string): boolean {
    return /^#([0-9A-F]{3}){1,2}$/i.test(cor);
  }
}

// ==================== CONFIANÇA ====================
export class ConfiancaUtils {
  /**
   * Converte valor numérico para nível de confiança
   */
  static obterNivel(valor: number): NivelConfianca {
    if (valor >= 0.8) return 'alta';
    if (valor >= 0.6) return 'media';
    return 'baixa';
  }

  /**
   * Obtém cor para o nível de confiança
   */
  static obterCor(nivel: NivelConfianca): string {
    const cores = {
      'alta': '#10b981',
      'media': '#f59e0b', 
      'baixa': '#ef4444'
    };
    return cores[nivel];
  }

  /**
   * Obtém ícone para o nível de confiança
   */
  static obterIcone(nivel: NivelConfianca): string {
    const icones = {
      'alta': '✓',
      'media': '⚠',
      'baixa': '⚠'
    };
    return icones[nivel];
  }
}

// ==================== IDS ÚNICOS ====================
export class IdUtils {
  /**
   * Gera ID único para diálogos
   */
  static gerarIdDialogo(): string {
    return `dialogo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Gera ID único para alterações
   */
  static gerarIdAlteracao(): string {
    return `alt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// ==================== EXPORTAÇÃO/IMPORTAÇÃO ====================
export class ExportUtils {
  /**
   * Prepara dados para exportação
   */
  static prepararDadosExportacao(dialogos: DialogoTranscricao[], participantes: Participante[]) {
    return {
      versao: '2.0',
      dataExportacao: new Date().toISOString(),
      totalDialogos: dialogos.length,
      participantes: participantes.map(p => ParticipanteUtils.calcularEstatisticas(p, dialogos)),
      dialogos: dialogos.map(d => ({
        ...d,
        timestamp: TempoUtils.formatarTempo(d.timestampSegundos),
        intervalo: TempoUtils.formatarIntervalo(d)
      })),
      estatisticas: {
        duracaoTotal: Math.max(...dialogos.map(d => d.timestampSegundos + d.duracaoSegundos)),
        participanteMaisAtivo: this.obterParticipanteMaisAtivo(dialogos),
        nivelConfiancaMedia: this.calcularConfiancaMedia(dialogos)
      }
    };
  }

  private static obterParticipanteMaisAtivo(dialogos: DialogoTranscricao[]): string {
    const contagem = dialogos.reduce((acc, d) => {
      acc[d.participante] = (acc[d.participante] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.keys(contagem).reduce((a, b) => 
      contagem[a] > contagem[b] ? a : b
    );
  }

  private static calcularConfiancaMedia(dialogos: DialogoTranscricao[]): number {
    if (dialogos.length === 0) return 0;
    
    const soma = dialogos.reduce((total, d) => total + d.confiancaValor, 0);
    return Number((soma / dialogos.length).toFixed(2));
  }
}