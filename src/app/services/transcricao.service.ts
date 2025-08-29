import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

export interface TranscricaoItem {
  start: string;
  end: string;
  speaker: string;
  text: string;
}

export interface TranscricaoResponse {
  transcription: TranscricaoItem[];
}

export interface DialogoProcessado {
  id: string;
  timestampInicio: number;
  timestampFim: number;
  participanteNome: string;
  texto: string;
  nivelConfianca: 'alta' | 'media' | 'baixa';
  percentualConfianca: number;
}

@Injectable({
  providedIn: 'root'
})
export class TranscricaoService {

  constructor(private http: HttpClient) { }

  carregarTranscricao(arquivo: string): Observable<DialogoProcessado[]> {
    return this.http.get<TranscricaoResponse>(`/${arquivo}`).pipe(
      map(response => this.processarTranscricao(response.transcription)),
      catchError(error => {
        console.error('Erro ao carregar transcrição:', error);
        return of([]);
      })
    );
  }

  private processarTranscricao(items: TranscricaoItem[]): DialogoProcessado[] {
    return items.map((item, index) => {
      const inicio = this.converterTimestampParaSegundos(item.start);
      const fim = this.converterTimestampParaSegundos(item.end);
      
      // Debug temporário
      if (index < 3) {
        console.log(`Item ${index + 1}:`, {
          start: item.start,
          end: item.end,
          inicioSegundos: inicio,
          fimSegundos: fim,
          speaker: item.speaker,
          text: item.text.substring(0, 50) + '...'
        });
      }
      
      return {
        id: (index + 1).toString(),
        timestampInicio: inicio,
        timestampFim: fim,
        participanteNome: item.speaker,
        texto: item.text,
        nivelConfianca: this.calcularNivelConfianca(item.text),
        percentualConfianca: this.calcularPercentualConfianca(item.text)
      };
    });
  }

  private converterTimestampParaSegundos(timestamp: string): number {
    // Formatos possíveis: "MM:SS:mmm", "MM:SS", "SS.mmm", ou "HH:MM:SS"
    const parts = timestamp.split(':');
    
    if (parts.length === 3) {
      const primeira = parseInt(parts[0], 10);
      const segunda = parseInt(parts[1], 10);
      const terceira = parseFloat(parts[2]);
      
      // Analisando os valores para determinar o formato
      if (terceira < 1000 && primeira < 60) {
        // MM:SS:mmm ou MM:SS:cc (minutos:segundos:milissegundos ou centésimos)
        const fator = terceira < 100 ? 100 : 1000; // Se < 100, é centésimos; se >= 100, é milésimos
        return primeira * 60 + segunda + (terceira / fator);
      } else {
        // HH:MM:SS (horas:minutos:segundos)
        return primeira * 3600 + segunda * 60 + terceira;
      }
    } else if (parts.length === 2) {
      // MM:SS
      const minutos = parseInt(parts[0], 10);
      const segundos = parseFloat(parts[1]);
      return minutos * 60 + segundos;
    } else {
      // SS.mmm ou apenas número
      return parseFloat(timestamp);
    }
  }

  private calcularNivelConfianca(texto: string): 'alta' | 'media' | 'baixa' {
    // Lógica simples baseada no tamanho do texto e caracteres especiais
    if (texto.length > 50 && !texto.includes('...') && !texto.includes('eh,')) {
      return 'alta';
    } else if (texto.length > 20) {
      return 'media';
    }
    return 'baixa';
  }

  private calcularPercentualConfianca(texto: string): number {
    // Lógica baseada na qualidade do texto
    let pontuacao = 95;
    
    if (texto.includes('...')) pontuacao -= 10;
    if (texto.includes('eh,')) pontuacao -= 5;
    if (texto.includes('né?')) pontuacao -= 3;
    if (texto.length < 10) pontuacao -= 15;
    if (texto.includes('Não')) pontuacao -= 5;
    
    return Math.max(60, Math.min(100, pontuacao));
  }

  obterParticipantesUnicos(dialogos: DialogoProcessado[]): string[] {
    const participantes = new Set(dialogos.map(d => d.participanteNome));
    return Array.from(participantes);
  }

  /**
   * Agrupa participantes únicos da transcrição com contagem de falas
   */
  agruparParticipantes(dialogos: DialogoProcessado[]): Array<{nome: string, totalFalas: number, primeiraFala: string}> {
    const agrupamento = new Map<string, {totalFalas: number, primeiraFala: string}>();
    
    dialogos.forEach(dialogo => {
      const nome = dialogo.participanteNome.trim();
      
      if (agrupamento.has(nome)) {
        agrupamento.get(nome)!.totalFalas++;
      } else {
        agrupamento.set(nome, {
          totalFalas: 1,
          primeiraFala: dialogo.texto.substring(0, 50) + '...'
        });
      }
    });

    return Array.from(agrupamento.entries())
      .map(([nome, dados]) => ({
        nome,
        totalFalas: dados.totalFalas,
        primeiraFala: dados.primeiraFala
      }))
      .sort((a, b) => b.totalFalas - a.totalFalas); // Ordenar por número de falas (desc)
  }

  /**
   * Identifica tipo de participante baseado no nome
   */
  private identificarTipoParticipante(nome: string): string {
    const nomeMinusculo = nome.toLowerCase();
    
    // Padrões para identificação de tipos
    if (nomeMinusculo.includes('juiz') || nomeMinusculo.includes('magistrado')) {
      return 'Juiz';
    }
    if (nomeMinusculo.includes('dr.') || nomeMinusculo.includes('dra.') || 
        nomeMinusculo.includes('advogad')) {
      return 'Advogado';
    }
    if (nomeMinusculo.includes('perit') || nomeMinusculo.includes('expert')) {
      return 'Perito';
    }
    if (nomeMinusculo.includes('testemunha') || nomeMinusculo.includes('depoente')) {
      return 'Testemunha';
    }
    if (nomeMinusculo.includes('requerente') || nomeMinusculo.includes('autor')) {
      return 'Requerente';
    }
    if (nomeMinusculo.includes('requerido') || nomeMinusculo.includes('réu')) {
      return 'Requerido';
    }
    
    return 'Participante'; // Tipo genérico
  }

  /**
   * Processa participantes da transcrição para integração com ParticipanteColorService
   */
  processarParticipantesParaIntegracao(dialogos: DialogoProcessado[]): Array<{nome: string, tipo: string, totalFalas: number}> {
    return this.agruparParticipantes(dialogos).map(participante => ({
      nome: participante.nome,
      tipo: this.identificarTipoParticipante(participante.nome),
      totalFalas: participante.totalFalas
    }));
  }
}