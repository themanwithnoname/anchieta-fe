import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModalTranscricaoComponent, DialogoTranscricao } from '../../components/modal-transcricao/modal-transcricao.component';

export interface ProcessoTrabalhista {
  id: string;
  numeroProcesso: string;
  assunto: string;
  requerente: string;
  requerido: string;
  dataAudiencia: Date;
  duracaoVideo: string;
  statusTranscricao: 'pendente' | 'transcrevendo' | 'concluido' | 'erro';
  percentualTranscricao: number;
  arquivoVideo?: string;
  arquivoTranscricao?: string;
  observacoes?: string;
}

@Component({
  selector: 'app-processos',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalTranscricaoComponent],
  templateUrl: './processos.component.html',
  styleUrls: ['./processos.component.scss']
})
export class ProcessosComponent implements OnInit {
  processos: ProcessoTrabalhista[] = [];
  processosFiltrados: ProcessoTrabalhista[] = [];
  carregando = false;
  
  // Filtros
  filtroTexto = '';
  filtroStatus = 'todos';
  
  // Paginação
  paginaAtual = 1;
  itensPorPagina = 10;
  
  // Visualização
  visualizacao: 'cards' | 'lista' = 'lista';

  // Modal
  modalVisivel = false;
  processoSelecionado: ProcessoTrabalhista | null = null;

  constructor() {}

  ngOnInit(): void {
    this.carregarProcessos();
  }

  carregarProcessos(): void {
    this.carregando = true;
    
    // Simulação de dados - em produção viria do backend/PJe
    setTimeout(() => {
      this.processos = [
        {
          id: '1',
          numeroProcesso: '0000123-45.2024.5.02.0001',
          assunto: 'Rescisão Indireta - Falta de Pagamento',
          requerente: 'João Silva Santos',
          requerido: 'Empresa ABC Ltda',
          dataAudiencia: new Date('2024-01-15T14:30:00'),
          duracaoVideo: '01:45:32',
          statusTranscricao: 'concluido',
          percentualTranscricao: 100,
          arquivoVideo: 'video_123.mp4',
          arquivoTranscricao: 'transcricao_123.txt'
        },
        {
          id: '2',
          numeroProcesso: '0000456-78.2024.5.02.0001',
          assunto: 'Horas Extras - Banco de Horas',
          requerente: 'Maria Oliveira Costa',
          requerido: 'Indústria XYZ S/A',
          dataAudiencia: new Date('2024-01-16T09:00:00'),
          duracaoVideo: '02:15:45',
          statusTranscricao: 'transcrevendo',
          percentualTranscricao: 65,
          arquivoVideo: 'video_456.mp4'
        },
        {
          id: '3',
          numeroProcesso: '0000789-01.2024.5.02.0001',
          assunto: 'Acidente de Trabalho - Responsabilidade Civil',
          requerente: 'Carlos Alberto Souza',
          requerido: 'Construtora DEF Ltda',
          dataAudiencia: new Date('2024-01-17T15:30:00'),
          duracaoVideo: '03:22:15',
          statusTranscricao: 'pendente',
          percentualTranscricao: 0,
          arquivoVideo: 'video_789.mp4'
        },
        {
          id: '4',
          numeroProcesso: '0000234-56.2024.5.02.0001',
          assunto: 'Assédio Moral - Danos Morais',
          requerente: 'Ana Paula Lima',
          requerido: 'Empresa GHI Ltda',
          dataAudiencia: new Date('2024-01-18T10:15:00'),
          duracaoVideo: '01:58:33',
          statusTranscricao: 'erro',
          percentualTranscricao: 25,
          arquivoVideo: 'video_234.mp4',
          observacoes: 'Erro na qualidade do áudio'
        },
        {
          id: '5',
          numeroProcesso: '0000567-89.2024.5.02.0001',
          assunto: 'Equiparação Salarial',
          requerente: 'Roberto Fernandes',
          requerido: 'Tech Solutions Ltd',
          dataAudiencia: new Date('2024-01-19T13:45:00'),
          duracaoVideo: '01:32:18',
          statusTranscricao: 'transcrevendo',
          percentualTranscricao: 89,
          arquivoVideo: 'video_567.mp4'
        },
        {
          id: '6',
          numeroProcesso: '0000890-12.2024.5.02.0001',
          assunto: 'FGTS - Diferenças de Depósito',
          requerente: 'Fernanda Rodrigues',
          requerido: 'Comércio JKL Ltda',
          dataAudiencia: new Date('2024-01-20T11:00:00'),
          duracaoVideo: '00:45:12',
          statusTranscricao: 'pendente',
          percentualTranscricao: 0,
          arquivoVideo: 'video_890.mp4'
        },
        {
          id: '7',
          numeroProcesso: '0000345-67.2024.5.02.0001',
          assunto: 'Adicional de Insalubridade',
          requerente: 'Pedro Henrique Silva',
          requerido: 'Química MNO S/A',
          dataAudiencia: new Date('2024-01-22T14:00:00'),
          duracaoVideo: '02:33:45',
          statusTranscricao: 'concluido',
          percentualTranscricao: 100,
          arquivoVideo: 'video_345.mp4',
          arquivoTranscricao: 'transcricao_345.txt'
        },
        {
          id: '8',
          numeroProcesso: '0000678-90.2024.5.02.0001',
          assunto: 'Jornada de Trabalho - Intervalo Intrajornada',
          requerente: 'Luciana Santos Oliveira',
          requerido: 'Restaurante PQR Ltda',
          dataAudiencia: new Date('2024-01-23T16:30:00'),
          duracaoVideo: '01:15:28',
          statusTranscricao: 'pendente',
          percentualTranscricao: 0,
          arquivoVideo: 'video_678.mp4'
        }
      ];
      
      this.aplicarFiltros();
      this.carregando = false;
    }, 1000);
  }

  aplicarFiltros(): void {
    let processosFiltrados = [...this.processos];
    
    // Filtro por texto
    if (this.filtroTexto.trim()) {
      const texto = this.filtroTexto.toLowerCase();
      processosFiltrados = processosFiltrados.filter(processo => 
        processo.numeroProcesso.toLowerCase().includes(texto) ||
        processo.assunto.toLowerCase().includes(texto) ||
        processo.requerente.toLowerCase().includes(texto) ||
        processo.requerido.toLowerCase().includes(texto)
      );
    }
    
    // Filtro por status
    if (this.filtroStatus !== 'todos') {
      processosFiltrados = processosFiltrados.filter(processo => 
        processo.statusTranscricao === this.filtroStatus
      );
    }
    
    this.processosFiltrados = processosFiltrados;
    this.paginaAtual = 1; // Reset para primeira página
  }

  filtrarPorStatus(status: string): void {
    this.filtroStatus = status;
    this.aplicarFiltros();
  }

  getTotalProcessos(): number {
    return this.processos.length;
  }

  getProcessosPorStatus(status: string): number {
    return this.processos.filter(p => p.statusTranscricao === status).length;
  }

  getTotalPaginas(): number {
    return Math.ceil(this.processosFiltrados.length / this.itensPorPagina);
  }

  irParaPagina(pagina: number): void {
    if (pagina >= 1 && pagina <= this.getTotalPaginas()) {
      this.paginaAtual = pagina;
    }
  }

  alterarVisualizacao(tipo: 'cards' | 'lista'): void {
    this.visualizacao = tipo;
  }

  getStatusIcon(status: string): string {
    const icons = {
      'pendente': 'fas fa-clock',
      'transcrevendo': 'fas fa-microphone',
      'concluido': 'fas fa-check-circle',
      'erro': 'fas fa-exclamation-triangle'
    };
    return icons[status as keyof typeof icons] || 'fas fa-question';
  }

  getStatusLabel(status: string): string {
    const labels = {
      'pendente': 'Pendente',
      'transcrevendo': 'Transcrevendo',
      'concluido': 'Concluído',
      'erro': 'Erro'
    };
    return labels[status as keyof typeof labels] || 'Desconhecido';
  }

  // Ações
  atualizarProcessos(): void {
    this.carregarProcessos();
  }

  importarProcessos(): void {
    // Simulação de importação do PJe
    alert('Funcionalidade de importação do PJe será implementada.');
  }

  visualizarProcesso(processo: ProcessoTrabalhista): void {
    this.processoSelecionado = processo;
    this.modalVisivel = true;
  }

  fecharModal(): void {
    this.modalVisivel = false;
    this.processoSelecionado = null;
  }

  salvarTranscricao(dialogos: DialogoTranscricao[]): void {
    console.log('Salvando transcrição:', dialogos);
    // Aqui você implementaria a lógica para salvar no backend
    alert('Transcrição salva com sucesso!');
  }

  gerenciarTranscricao(processo: ProcessoTrabalhista): void {
    if (processo.statusTranscricao === 'concluido') {
      // Download da transcrição
      alert(`Download da transcrição do processo: ${processo.numeroProcesso}`);
    } else if (processo.statusTranscricao === 'pendente') {
      // Iniciar transcrição
      processo.statusTranscricao = 'transcrevendo';
      processo.percentualTranscricao = 0;
      
      // Simulação de progresso
      this.simularProgresso(processo);
    } else if (processo.statusTranscricao === 'erro') {
      // Tentar novamente
      processo.statusTranscricao = 'transcrevendo';
      processo.percentualTranscricao = 0;
      this.simularProgresso(processo);
    }
  }

  private simularProgresso(processo: ProcessoTrabalhista): void {
    const interval = setInterval(() => {
      processo.percentualTranscricao += Math.random() * 10;
      
      if (processo.percentualTranscricao >= 100) {
        processo.percentualTranscricao = 100;
        processo.statusTranscricao = 'concluido';
        processo.arquivoTranscricao = `transcricao_${processo.id}.txt`;
        clearInterval(interval);
      }
    }, 1000);
  }
}
