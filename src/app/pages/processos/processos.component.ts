import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DialogoTranscricao } from '../../transcricao/models/transcricao.types';

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
  imports: [CommonModule, FormsModule],
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
  itensPorPagina = 20;
  
  // Visualização
  visualizacao: 'cards' | 'lista' = 'lista';


  private router = inject(Router);

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
          numeroProcesso: '1001234-56.2023.5.02.0001',
          assunto: 'Cobrança de Verbas Rescisórias',
          requerente: 'Dr. João Silva (Médico)',
          requerido: 'Fundação ABC',
          dataAudiencia: new Date('2024-01-15T14:30:00'),
          duracaoVideo: '13:19',
          statusTranscricao: 'concluido',
          percentualTranscricao: 100,
          arquivoVideo: '01d83e38-77b9-4185-80e1-020c2e23b9c9.mp4',
          arquivoTranscricao: '01d83e38-77b9-4185-80e1-020c2e23b9c9.txt'
        },
        {
          id: '2',
          numeroProcesso: '1002345-67.2023.5.02.0002',
          assunto: 'Função Acumulada - PCP/Manufatura',
          requerente: 'Wagner Santos Silva',
          requerido: 'GTEX Indústria S/A',
          dataAudiencia: new Date('2024-01-16T09:00:00'),
          duracaoVideo: '08:49',
          statusTranscricao: 'concluido',
          percentualTranscricao: 100,
          arquivoVideo: '0b451510-12da-4282-8a84-a900d5cc495d.mp4',
          arquivoTranscricao: '0b451510-12da-4282-8a84-a900d5cc495d.txt'
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
        },
        {
          id: '9',
          numeroProcesso: '0000901-23.2024.5.02.0001',
          assunto: 'Adicional Noturno',
          requerente: 'Marcos Paulo Ferreira',
          requerido: 'Segurança 24h Ltda',
          dataAudiencia: new Date('2024-01-24T08:30:00'),
          duracaoVideo: '01:28:15',
          statusTranscricao: 'concluido',
          percentualTranscricao: 100,
          arquivoVideo: 'video_901.mp4',
          arquivoTranscricao: 'transcricao_901.txt'
        },
        {
          id: '10',
          numeroProcesso: '0000234-56.2024.5.02.0002',
          assunto: 'Verbas Rescisórias - Aviso Prévio',
          requerente: 'Gabriela Costa Lima',
          requerido: 'Farmácia Vida S/A',
          dataAudiencia: new Date('2024-01-25T14:15:00'),
          duracaoVideo: '02:05:42',
          statusTranscricao: 'transcrevendo',
          percentualTranscricao: 45,
          arquivoVideo: 'video_234.mp4'
        },
        {
          id: '11',
          numeroProcesso: '0000456-78.2024.5.02.0003',
          assunto: 'Estabilidade Gestante',
          requerente: 'Amanda Silva Rodrigues',
          requerido: 'Textil Norte Ltda',
          dataAudiencia: new Date('2024-01-26T10:00:00'),
          duracaoVideo: '01:52:30',
          statusTranscricao: 'pendente',
          percentualTranscricao: 0,
          arquivoVideo: 'video_456.mp4'
        },
        {
          id: '12',
          numeroProcesso: '0000567-89.2024.5.02.0004',
          assunto: 'Adicional de Periculosidade',
          requerente: 'Rafael Almeida Santos',
          requerido: 'Petroquímica Sul S/A',
          dataAudiencia: new Date('2024-01-29T15:45:00'),
          duracaoVideo: '02:18:55',
          statusTranscricao: 'erro',
          percentualTranscricao: 15,
          arquivoVideo: 'video_567.mp4',
          observacoes: 'Interferência na gravação'
        },
        {
          id: '13',
          numeroProcesso: '0000789-12.2024.5.02.0005',
          assunto: 'Licença Paternidade - Diferenças',
          requerente: 'Thiago Oliveira Souza',
          requerido: 'Construtora Alpha Ltda',
          dataAudiencia: new Date('2024-01-30T09:15:00'),
          duracaoVideo: '01:35:20',
          statusTranscricao: 'concluido',
          percentualTranscricao: 100,
          arquivoVideo: 'video_789.mp4',
          arquivoTranscricao: 'transcricao_789.txt'
        },
        {
          id: '14',
          numeroProcesso: '0000890-34.2024.5.02.0006',
          assunto: 'PLR - Participação nos Lucros',
          requerente: 'Carla Beatriz Machado',
          requerido: 'Metalúrgica Beta S/A',
          dataAudiencia: new Date('2024-02-01T13:30:00'),
          duracaoVideo: '01:42:18',
          statusTranscricao: 'transcrevendo',
          percentualTranscricao: 72,
          arquivoVideo: 'video_890.mp4'
        },
        {
          id: '15',
          numeroProcesso: '0000123-45.2024.5.02.0007',
          assunto: 'Terceirização Ilícita',
          requerente: 'Eduardo Pereira Castro',
          requerido: 'Serviços Gamma Ltda',
          dataAudiencia: new Date('2024-02-02T11:00:00'),
          duracaoVideo: '03:15:45',
          statusTranscricao: 'pendente',
          percentualTranscricao: 0,
          arquivoVideo: 'video_123.mp4'
        },
        {
          id: '16',
          numeroProcesso: '0000345-67.2024.5.02.0008',
          assunto: 'Doença Ocupacional - Nexo Causal',
          requerente: 'Patrícia Fernandes Lima',
          requerido: 'Indústria Delta Ltda',
          dataAudiencia: new Date('2024-02-05T14:45:00'),
          duracaoVideo: '02:28:12',
          statusTranscricao: 'concluido',
          percentualTranscricao: 100,
          arquivoVideo: 'video_345.mp4',
          arquivoTranscricao: 'transcricao_345.txt'
        },
        {
          id: '17',
          numeroProcesso: '0000456-78.2024.5.02.0009',
          assunto: 'Reintegração - Estabilidade Sindical',
          requerente: 'José Carlos Barbosa',
          requerido: 'Transportes Epsilon S/A',
          dataAudiencia: new Date('2024-02-06T08:00:00'),
          duracaoVideo: '01:58:35',
          statusTranscricao: 'transcrevendo',
          percentualTranscricao: 38,
          arquivoVideo: 'video_456.mp4'
        },
        {
          id: '18',
          numeroProcesso: '0000678-90.2024.5.02.0010',
          assunto: 'Banco de Horas - Compensação',
          requerente: 'Renata Souza Oliveira',
          requerido: 'Call Center Zeta Ltda',
          dataAudiencia: new Date('2024-02-07T16:15:00'),
          duracaoVideo: '01:25:48',
          statusTranscricao: 'erro',
          percentualTranscricao: 8,
          arquivoVideo: 'video_678.mp4',
          observacoes: 'Arquivo corrompido'
        },
        {
          id: '19',
          numeroProcesso: '0000789-01.2024.5.02.0011',
          assunto: 'Diferenças Salariais - Desvio de Função',
          requerente: 'Bruno Henrique Alves',
          requerido: 'Hospital Eta S/A',
          dataAudiencia: new Date('2024-02-08T10:30:00'),
          duracaoVideo: '02:12:22',
          statusTranscricao: 'pendente',
          percentualTranscricao: 0,
          arquivoVideo: 'video_789.mp4'
        },
        {
          id: '20',
          numeroProcesso: '0000890-12.2024.5.02.0012',
          assunto: 'Adicional de Transferência',
          requerente: 'Juliana Castro Santos',
          requerido: 'Banco Theta S/A',
          dataAudiencia: new Date('2024-02-09T15:00:00'),
          duracaoVideo: '01:38:17',
          statusTranscricao: 'concluido',
          percentualTranscricao: 100,
          arquivoVideo: 'video_890.mp4',
          arquivoTranscricao: 'transcricao_890.txt'
        },
        {
          id: '21',
          numeroProcesso: '0000123-34.2024.5.02.0013',
          assunto: 'Férias Proporcionais - Terço Constitucional',
          requerente: 'Felipe Rodrigues Costa',
          requerido: 'Educacional Iota Ltda',
          dataAudiencia: new Date('2024-02-12T09:45:00'),
          duracaoVideo: '01:45:55',
          statusTranscricao: 'transcrevendo',
          percentualTranscricao: 67,
          arquivoVideo: 'video_123.mp4'
        },
        {
          id: '22',
          numeroProcesso: '0000345-56.2024.5.02.0014',
          assunto: 'Danos Materiais - Acidente Trajeto',
          requerente: 'Vanessa Lima Pereira',
          requerido: 'Logística Kappa S/A',
          dataAudiencia: new Date('2024-02-13T14:20:00'),
          duracaoVideo: '02:35:41',
          statusTranscricao: 'pendente',
          percentualTranscricao: 0,
          arquivoVideo: 'video_345.mp4'
        },
        {
          id: '23',
          numeroProcesso: '0000567-78.2024.5.02.0015',
          assunto: 'Equipamentos de Proteção - Fornecimento',
          requerente: 'Diego Santos Silva',
          requerido: 'Mineração Lambda Ltda',
          dataAudiencia: new Date('2024-02-14T11:15:00'),
          duracaoVideo: '01:52:28',
          statusTranscricao: 'concluido',
          percentualTranscricao: 100,
          arquivoVideo: 'video_567.mp4',
          arquivoTranscricao: 'transcricao_567.txt'
        },
        {
          id: '24',
          numeroProcesso: '0000789-90.2024.5.02.0016',
          assunto: 'Trabalho Intermitente - Diferenças',
          requerente: 'Camila Oliveira Souza',
          requerido: 'Eventos Mu Ltda',
          dataAudiencia: new Date('2024-02-15T13:00:00'),
          duracaoVideo: '01:28:35',
          statusTranscricao: 'transcrevendo',
          percentualTranscricao: 91,
          arquivoVideo: 'video_789.mp4'
        },
        {
          id: '25',
          numeroProcesso: '0000890-01.2024.5.02.0017',
          assunto: 'Auxílio Creche - Reembolso',
          requerente: 'Anderson Ferreira Lima',
          requerido: 'Tecnologia Nu S/A',
          dataAudiencia: new Date('2024-02-16T16:45:00'),
          duracaoVideo: '01:15:42',
          statusTranscricao: 'erro',
          percentualTranscricao: 22,
          arquivoVideo: 'video_890.mp4',
          observacoes: 'Problemas técnicos na gravação'
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


  gerenciarTranscricao(processo: ProcessoTrabalhista): void {
    this.router.navigate(['/detalhe-processo', processo.numeroProcesso]);
  }

  copiarNumeroProcesso(numeroProcesso: string): void {
    navigator.clipboard.writeText(numeroProcesso).then(() => {
      // Feedback visual opcional - pode ser um toast ou alert
      console.log('Número do processo copiado:', numeroProcesso);
    }).catch(err => {
      console.error('Erro ao copiar número do processo:', err);
    });
  }

  getStatusAudiencia(processo: ProcessoTrabalhista): string {
    const agora = new Date();
    const dataAudiencia = new Date(processo.dataAudiencia);
    
    // Se a audiência já passou
    if (dataAudiencia < agora) {
      return 'Audiência Realizada';
    }
    
    // Se a audiência é hoje
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const amanha = new Date(hoje);
    amanha.setDate(hoje.getDate() + 1);
    
    if (dataAudiencia >= hoje && dataAudiencia < amanha) {
      return 'Aguardando Audiência';
    }
    
    // Se a audiência é futura
    const diasRestantes = Math.ceil((dataAudiencia.getTime() - agora.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diasRestantes === 1) {
      return 'Realizada Amanhã';
    } else if (diasRestantes <= 7) {
      return `Realizada em ${diasRestantes} dias`;
    } else {
      return 'Realizada em breve';
    }
  }

  getMinutaPjeStatus(processo: ProcessoTrabalhista): string {
    // Alterna entre os valores baseado no ID do processo
    const id = parseInt(processo.id);
    return id % 2 === 0 ? 'Enviado' : 'Aguardando envio';
  }

  getMinutaPjeClass(processo: ProcessoTrabalhista): string {
    const status = this.getMinutaPjeStatus(processo);
    return status === 'Enviado' ? 'minuta-enviado' : 'minuta-aguardando';
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
