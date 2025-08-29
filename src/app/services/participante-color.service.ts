import { Injectable } from '@angular/core';
import { Participante } from '../transcricao/models/transcricao.types';

@Injectable({
  providedIn: 'root'
})
export class ParticipanteColorService {
  
  private readonly participantesPreDefinidos: Participante[] = [
    { nome: 'Dr. Carlos Mendes', tipo: 'Juiz', cor: '#2c3e50', avatar: 'CM', totalDialogos: 8, falas: 8 },
    { nome: 'João Silva Santos', tipo: 'Requerente', cor: '#3498db', avatar: 'JS', totalDialogos: 12, falas: 12 },
    { nome: 'Dr. Ana Costa', tipo: 'Advogado Requerente', cor: '#27ae60', avatar: 'AC', totalDialogos: 10, falas: 10 },
    { nome: 'Maria Oliveira', tipo: 'Requerido', cor: '#e74c3c', avatar: 'MO', totalDialogos: 6, falas: 6 },
    { nome: 'Dr. Roberto Lima', tipo: 'Advogado Requerido', cor: '#f39c12', avatar: 'RL', totalDialogos: 9, falas: 9 },
    { nome: 'Sandra Ferreira', tipo: 'Testemunha', cor: '#9b59b6', avatar: 'SF', totalDialogos: 4, falas: 4 },
    { nome: 'Dra. Lucia Pereira', tipo: 'Perita', cor: '#1abc9c', avatar: 'LP', totalDialogos: 3, falas: 3 }
  ];

  private readonly paletaCores: string[] = [
    '#e67e22', // Laranja escuro
    '#16a085', // Verde água escuro
    '#8e44ad', // Roxo escuro
    '#d35400', // Laranja queimado
    '#2ecc71', // Verde claro
    '#f1c40f', // Amarelo
    '#c0392b', // Vermelho escuro
    '#34495e', // Azul acinzentado
    '#9b59b6', // Roxo claro
    '#1abc9c', // Verde água
    '#f39c12', // Laranja
    '#e74c3c', // Vermelho
    '#95a5a6', // Cinza
    '#2980b9', // Azul
    '#e67e22', // Laranja 2
    '#8e44ad'  // Roxo 2
  ];

  private participantesAdicionados: Participante[] = [];
  private readonly corPadrao: string = '#95a5a6';

  constructor() {}

  /**
   * Obtém a cor de um participante pelo nome
   */
  obterCorParticipante(nome: string): string {
    // Buscar em participantes pré-definidos
    const participantePreDefinido = this.participantesPreDefinidos.find(p => p.nome === nome);
    if (participantePreDefinido) {
      return participantePreDefinido.cor;
    }

    // Buscar em participantes adicionados
    const participanteAdicionado = this.participantesAdicionados.find(p => p.nome === nome);
    if (participanteAdicionado) {
      return participanteAdicionado.cor;
    }

    return this.corPadrao;
  }

  /**
   * Obtém todos os participantes (pré-definidos + adicionados)
   */
  obterTodosParticipantes(): Participante[] {
    return [...this.participantesPreDefinidos, ...this.participantesAdicionados];
  }

  /**
   * Obtém participantes únicos com estatísticas atualizadas
   */
  obterParticipantesUnicos(dialogos: any[]): Participante[] {
    const todosParticipantes = this.obterTodosParticipantes();
    
    return todosParticipantes.map(p => ({
      ...p,
      totalDialogos: dialogos.filter(d => d.participante === p.nome).length,
      falas: dialogos.filter(d => d.participante === p.nome).length
    })).filter(p => p.totalDialogos > 0);
  }

  /**
   * Adiciona um novo participante com cor automática
   */
  adicionarParticipante(nome: string, tipo: string): Participante {
    // Verificar se já existe
    const jaExiste = this.obterTodosParticipantes()
      .some(p => p.nome.toLowerCase() === nome.toLowerCase());
    
    if (jaExiste) {
      throw new Error('Participante já existe na lista');
    }

    // Gerar cor única
    const corDisponivel = this.obterProximaCorDisponivel();
    
    const novoParticipante: Participante = {
      nome: nome.trim(),
      tipo: tipo.trim(),
      cor: corDisponivel,
      avatar: this.gerarAvatar(nome),
      totalDialogos: 0,
      falas: 0
    };

    this.participantesAdicionados.push(novoParticipante);
    return novoParticipante;
  }

  /**
   * Carrega participantes automaticamente a partir dos dados da transcrição
   */
  carregarParticipantesDeTranscricao(participantesTranscricao: Array<{nome: string, tipo: string, totalFalas: number}>): Participante[] {
    const participantesCarregados: Participante[] = [];

    participantesTranscricao.forEach(participanteData => {
      // Verificar se já existe (pré-definido ou já adicionado)
      const jaExiste = this.obterTodosParticipantes()
        .some(p => p.nome.toLowerCase() === participanteData.nome.toLowerCase());
      
      if (!jaExiste) {
        // Adicionar novo participante
        const novoParticipante: Participante = {
          nome: participanteData.nome.trim(),
          tipo: participanteData.tipo.trim(),
          cor: this.obterProximaCorDisponivel(),
          avatar: this.gerarAvatar(participanteData.nome),
          totalDialogos: participanteData.totalFalas,
          falas: participanteData.totalFalas
        };

        this.participantesAdicionados.push(novoParticipante);
        participantesCarregados.push(novoParticipante);
      } else {
        // Atualizar estatísticas do participante existente
        const participanteExistente = this.obterTodosParticipantes()
          .find(p => p.nome.toLowerCase() === participanteData.nome.toLowerCase());
        
        if (participanteExistente) {
          participanteExistente.totalDialogos = participanteData.totalFalas;
          participanteExistente.falas = participanteData.totalFalas;
          participantesCarregados.push(participanteExistente);
        }
      }
    });

    console.log(`Carregados ${participantesCarregados.length} participantes da transcrição:`, 
                participantesCarregados.map(p => `${p.nome} (${p.tipo}) - ${p.totalDialogos} falas`));

    return participantesCarregados;
  }

  /**
   * Limpa participantes adicionados e recarrega a partir da transcrição
   */
  recarregarParticipantesDeTranscricao(participantesTranscricao: Array<{nome: string, tipo: string, totalFalas: number}>): Participante[] {
    // Limpar participantes que não são pré-definidos
    this.participantesAdicionados = [];
    
    // Recarregar a partir da transcrição
    return this.carregarParticipantesDeTranscricao(participantesTranscricao);
  }

  /**
   * Atualiza dados de um participante existente
   */
  atualizarParticipante(nomeAntigo: string, novoNome: string, novoTipo: string): void {
    // Buscar em pré-definidos
    const participantePreDefinido = this.participantesPreDefinidos.find(p => p.nome === nomeAntigo);
    if (participantePreDefinido) {
      participantePreDefinido.nome = novoNome;
      participantePreDefinido.tipo = novoTipo;
      return;
    }

    // Buscar em adicionados
    const participanteAdicionado = this.participantesAdicionados.find(p => p.nome === nomeAntigo);
    if (participanteAdicionado) {
      participanteAdicionado.nome = novoNome;
      participanteAdicionado.tipo = novoTipo;
      return;
    }

    throw new Error('Participante não encontrado para atualização');
  }

  /**
   * Obtém o papel/tipo de um participante
   */
  obterTipoParticipante(nome: string): string {
    const participante = this.obterTodosParticipantes().find(p => p.nome === nome);
    return participante?.tipo || '';
  }

  /**
   * Formata o nome completo do participante com tipo
   */
  formatarNomeParticipante(nome: string): string {
    if (!nome) return 'Participante não identificado';
    
    const tipo = this.obterTipoParticipante(nome);
    return tipo ? `${nome} - ${tipo}` : nome;
  }

  /**
   * Gera cores CSS para uso em templates
   */
  gerarEstilosCSS(participantes: Participante[]): { [key: string]: string } {
    const estilos: { [key: string]: string } = {};
    
    participantes.forEach(p => {
      const nomeLimpo = p.nome.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
      estilos[`--cor-${nomeLimpo}`] = p.cor;
    });

    return estilos;
  }

  // Métodos privados

  private obterProximaCorDisponivel(): string {
    const coresUsadas = this.obterTodosParticipantes().map(p => p.cor);
    const corDisponivel = this.paletaCores.find(cor => !coresUsadas.includes(cor));
    
    return corDisponivel || this.paletaCores[Math.floor(Math.random() * this.paletaCores.length)];
  }

  private gerarAvatar(nome: string): string {
    const palavras = nome.split(' ');
    if (palavras.length >= 2) {
      return (palavras[0][0] + palavras[1][0]).toUpperCase();
    }
    return nome.substring(0, 2).toUpperCase();
  }

  /**
   * Reset para testes ou reinicialização
   */
  resetParticipantesAdicionados(): void {
    this.participantesAdicionados = [];
  }
}