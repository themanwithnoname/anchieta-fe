import { Pipe, PipeTransform } from '@angular/core';
import { 
  TempoUtils, 
  ParticipanteUtils, 
  BuscaUtils, 
  ConfiancaUtils 
} from '../utils/transcricao.utils';
import { DialogoTranscricao, Participante, NivelConfianca } from '../models/transcricao.types';

// ==================== TEMPO ====================
@Pipe({
  name: 'tempo',
  standalone: true
})
export class TempoPipe implements PipeTransform {
  transform(segundos: number): string {
    return TempoUtils.formatarTempo(segundos);
  }
}

@Pipe({
  name: 'intervaloTempo',
  standalone: true
})
export class IntervaloTempoPipe implements PipeTransform {
  transform(dialogo: DialogoTranscricao): string {
    return TempoUtils.formatarIntervalo(dialogo);
  }
}

// ==================== PARTICIPANTE ====================
@Pipe({
  name: 'avatar',
  standalone: true
})
export class AvatarPipe implements PipeTransform {
  transform(nome: string): string {
    return ParticipanteUtils.gerarAvatar(nome);
  }
}

@Pipe({
  name: 'corParticipante',
  standalone: true
})
export class CorParticipantePipe implements PipeTransform {
  transform(participante: Participante | undefined): string {
    return participante?.cor || '#95a5a6';
  }
}

// ==================== BUSCA ====================
@Pipe({
  name: 'destacarBusca',
  standalone: true,
  pure: false // Para permitir mudanças na busca
})
export class DestacarBuscaPipe implements PipeTransform {
  transform(texto: string, termo: string): string {
    return BuscaUtils.destacarTermo(texto, termo);
  }
}

// ==================== CONFIANÇA ====================
@Pipe({
  name: 'nivelConfianca',
  standalone: true
})
export class NivelConfiancaPipe implements PipeTransform {
  transform(valor: number): NivelConfianca {
    return ConfiancaUtils.obterNivel(valor);
  }
}

@Pipe({
  name: 'corConfianca',
  standalone: true
})
export class CorConfiancaPipe implements PipeTransform {
  transform(nivel: NivelConfianca): string {
    return ConfiancaUtils.obterCor(nivel);
  }
}

@Pipe({
  name: 'iconeConfianca',
  standalone: true
})
export class IconeConfiancaPipe implements PipeTransform {
  transform(nivel: NivelConfianca): string {
    return ConfiancaUtils.obterIcone(nivel);
  }
}

// ==================== FORMATAÇÃO ====================
@Pipe({
  name: 'truncar',
  standalone: true
})
export class TruncarPipe implements PipeTransform {
  transform(texto: string, limite: number = 100, sufixo: string = '...'): string {
    if (!texto || texto.length <= limite) return texto;
    
    return texto.substring(0, limite).trim() + sufixo;
  }
}

@Pipe({
  name: 'pluralizar',
  standalone: true
})
export class PluralizarPipe implements PipeTransform {
  transform(count: number, singular: string, plural?: string): string {
    if (count === 1) return `${count} ${singular}`;
    
    const pluralForm = plural || `${singular}s`;
    return `${count} ${pluralForm}`;
  }
}

// ==================== ESTATÍSTICAS ====================
@Pipe({
  name: 'percentual',
  standalone: true
})
export class PercentualPipe implements PipeTransform {
  transform(valor: number, total: number, decimais: number = 1): string {
    if (total === 0) return '0%';
    
    const percentual = (valor / total) * 100;
    return `${percentual.toFixed(decimais)}%`;
  }
}

@Pipe({
  name: 'duracaoHumana',
  standalone: true
})
export class DuracaoHumanaPipe implements PipeTransform {
  transform(segundos: number): string {
    if (segundos < 60) return `${segundos}s`;
    
    const minutos = Math.floor(segundos / 60);
    const segs = segundos % 60;
    
    if (minutos < 60) {
      return segs > 0 ? `${minutos}m ${segs}s` : `${minutos}m`;
    }
    
    const horas = Math.floor(minutos / 60);
    const mins = minutos % 60;
    
    let resultado = `${horas}h`;
    if (mins > 0) resultado += ` ${mins}m`;
    if (segs > 0 && horas === 0) resultado += ` ${segs}s`;
    
    return resultado;
  }
}

// ==================== EXPORTAR TODOS OS PIPES ====================
export const TRANSCRICAO_PIPES = [
  TempoPipe,
  IntervaloTempoPipe,
  AvatarPipe,
  CorParticipantePipe,
  DestacarBuscaPipe,
  NivelConfiancaPipe,
  CorConfiancaPipe,
  IconeConfiancaPipe,
  TruncarPipe,
  PluralizarPipe,
  PercentualPipe,
  DuracaoHumanaPipe
] as const;