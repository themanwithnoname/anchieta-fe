import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';

interface TimelineItem {
  id: string;
  data: string;
  titulo: string;
  descricao: string;
  tipo: 'inicio' | 'audiencia' | 'transcricao' | 'revisao' | 'finalizacao';
  status: 'concluido' | 'andamento' | 'pendente';
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent implements OnInit, OnDestroy {
  isDetalheProcesso = signal<boolean>(false);
  numeroProcesso = signal<string>('');
  
  private routerSubscription?: Subscription;
  
  // Timeline mock para demonstração
  timelineItems: TimelineItem[] = [
    {
      id: '1',
      data: '15/01/2024',
      titulo: 'Processo Iniciado',
      descricao: 'Processo trabalhista registrado no PJe',
      tipo: 'inicio',
      status: 'concluido'
    },
    {
      id: '2', 
      data: '15/01/2024',
      titulo: 'Audiência Realizada',
      descricao: 'Gravação de vídeo capturada - Duração: 13:19',
      tipo: 'audiencia',
      status: 'concluido'
    },
    {
      id: '3',
      data: '15/01/2024', 
      titulo: 'Transcrição Iniciada',
      descricao: 'Processamento automático de áudio iniciado',
      tipo: 'transcricao',
      status: 'concluido'
    },
    {
      id: '4',
      data: '15/01/2024',
      titulo: 'Transcrição Concluída', 
      descricao: 'Texto transcrito com 94% de confiança',
      tipo: 'transcricao',
      status: 'andamento'
    },
    {
      id: '5',
      data: 'Pendente',
      titulo: 'Revisão Manual',
      descricao: 'Aguardando revisão e correções do magistrado',
      tipo: 'revisao', 
      status: 'pendente'
    },
    {
      id: '6',
      data: 'Pendente',
      titulo: 'Envio para PJe',
      descricao: 'Envio da minuta finalizada para o sistema PJe',
      tipo: 'finalizacao',
      status: 'pendente'
    }
  ];

  constructor(private router: Router) {}

  ngOnInit(): void {
    // Detecta mudanças de rota
    this.routerSubscription = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event) => {
        if (event instanceof NavigationEnd) {
          this.checkRoute(event.url);
        }
      });
    
    // Verifica rota inicial
    this.checkRoute(this.router.url);
  }

  ngOnDestroy(): void {
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
  }

  private checkRoute(url: string): void {
    console.log('Checking route:', url); // Debug log
    
    // Verifica se é página de detalhe do processo
    const isDetalhe = url.includes('/detalhe-processo') || url.includes('detalhe-processo');
    
    if (isDetalhe) {
      console.log('Detected detalhe-processo route'); // Debug log
      this.isDetalheProcesso.set(true);
      
      // Extrai número do processo da URL
      const matches = url.match(/detalhe-processo\/([^/?]+)/);
      if (matches && matches[1]) {
        const numeroProcesso = decodeURIComponent(matches[1]);
        console.log('Process number extracted:', numeroProcesso); // Debug log
        this.numeroProcesso.set(numeroProcesso);
      } else {
        this.numeroProcesso.set('N/A');
      }
    } else {
      console.log('Not detalhe-processo route'); // Debug log
      this.isDetalheProcesso.set(false);
      this.numeroProcesso.set('');
    }
  }

  voltarParaProcessos(): void {
    this.router.navigate(['/processos']);
  }

  getTimelineIcon(tipo: string): string {
    const icons = {
      'inicio': 'fas fa-play-circle',
      'audiencia': 'fas fa-video', 
      'transcricao': 'fas fa-microphone',
      'revisao': 'fas fa-edit',
      'finalizacao': 'fas fa-paper-plane'
    };
    return icons[tipo as keyof typeof icons] || 'fas fa-circle';
  }

  getTimelineColor(status: string): string {
    const colors = {
      'concluido': '#27ae60',
      'andamento': '#3498db', 
      'pendente': '#95a5a6'
    };
    return colors[status as keyof typeof colors] || '#95a5a6';
  }
}
