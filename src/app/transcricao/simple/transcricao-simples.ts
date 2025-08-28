// ==================== VERSÃO SIMPLES E PRÁTICA ====================

// 1. TIPOS MÍNIMOS
export interface Dialogo {
  id: string;
  participante: string;
  texto: string;
  segundos: number;
  editando?: boolean;
}

export interface Participante {
  nome: string;
  tipo: string;
  cor: string;
}

// 2. UTILITÁRIOS ESSENCIAIS (apenas o que você USA)
export const formatarTempo = (s: number) => {
  const m = Math.floor(s / 60);
  const seg = s % 60;
  return `${m}:${seg.toString().padStart(2, '0')}`;
};

export const gerarAvatar = (nome: string) => 
  nome.split(' ').map(p => p[0]).join('').toUpperCase();

// 3. SERVIÇO SIMPLES
@Injectable()
export class TranscricaoSimples {
  dialogos = signal<Dialogo[]>([]);
  
  editarDialogo(id: string) {
    this.dialogos.update(list => 
      list.map(d => ({ ...d, editando: d.id === id }))
    );
  }
  
  salvarTexto(id: string, texto: string) {
    this.dialogos.update(list => 
      list.map(d => d.id === id ? { ...d, texto, editando: false } : d)
    );
  }
}

// 4. COMPONENTE MÍNIMO (30 linhas vs 200+)
@Component({
  selector: 'dialogo-simples',
  template: `
    <div class="dialogo" [class.editando]="dialogo.editando">
      
      <!-- Avatar simples -->
      <div class="avatar" [style.background-color]="participante?.cor">
        {{ gerarAvatar(dialogo.participante) }}
      </div>
      
      <!-- Conteúdo -->
      <div class="conteudo">
        <strong>{{ dialogo.participante }}</strong>
        <span class="tempo">{{ formatarTempo(dialogo.segundos) }}</span>
        
        <!-- Texto ou edição -->
        <p *ngIf="!dialogo.editando" (click)="iniciarEdicao()">
          {{ dialogo.texto }}
        </p>
        
        <textarea 
          *ngIf="dialogo.editando"
          [(ngModel)]="textoTemp"
          (keydown.enter.control)="salvar()"
          (keydown.escape)="cancelar()">
        </textarea>
        
        <div *ngIf="dialogo.editando" class="acoes">
          <button (click)="salvar()">Salvar</button>
          <button (click)="cancelar()">Cancelar</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dialogo { 
      display: flex; 
      gap: 12px; 
      padding: 16px;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      margin-bottom: 8px;
    }
    .avatar { 
      width: 32px; 
      height: 32px; 
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: 600;
      font-size: 12px;
    }
    .conteudo { flex: 1; }
    .tempo { 
      float: right; 
      font-size: 12px; 
      color: #64748b; 
    }
    .editando { 
      border-color: #3b82f6; 
    }
    .acoes { 
      margin-top: 8px; 
      display: flex; 
      gap: 8px; 
    }
    button { 
      padding: 4px 12px; 
      border: 1px solid #d1d5db; 
      border-radius: 4px; 
      background: white; 
    }
  `]
})
export class DialogoSimplesComponent {
  @Input() dialogo!: Dialogo;
  @Input() participante?: Participante;
  
  textoTemp = '';
  
  constructor(private transcricao: TranscricaoSimples) {}
  
  // Métodos diretos e simples
  formatarTempo = formatarTempo;
  gerarAvatar = gerarAvatar;
  
  iniciarEdicao() {
    this.textoTemp = this.dialogo.texto;
    this.transcricao.editarDialogo(this.dialogo.id);
  }
  
  salvar() {
    this.transcricao.salvarTexto(this.dialogo.id, this.textoTemp);
  }
  
  cancelar() {
    this.transcricao.editarDialogo(''); // limpa edição
  }
}

// 5. USO SUPER SIMPLES
/*
<dialogo-simples 
  [dialogo]="dialogo" 
  [participante]="participante">
</dialogo-simples>
*/