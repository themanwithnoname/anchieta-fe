// ==================== BARREL EXPORTS ====================
// Export tudo de forma organizada para imports limpos

// Modelos e tipos
export * from './models/transcricao.types';

// Serviços principais
export { TranscricaoStateService } from './services/transcricao-state.service';
export { AudioControlService } from './services/audio-control.service';

// Utilitários
export * from './utils/transcricao.utils';

// Componentes principais (se necessário)
// export { DialogoItemComponent } from './components/dialogo-item/dialogo-item.component';
// export { AudioTimelineComponent } from './components/audio-timeline/audio-timeline.component';

// ==================== EXEMPLO DE USO ====================
/*
// Import individual
import { DialogoTranscricao, TempoUtils } from '@app/transcricao';

// Import do kit completo  
import { TRANSCRICAO_KIT } from '@app/transcricao';

// No component
@Component({
  imports: [CommonModule, ...TRANSCRICAO_KIT.pipes, ...TRANSCRICAO_KIT.directives]
})

// No template
<div [tooltip]="'Tooltip text'">
  {{ dialogo.timestampSegundos | tempo }}
  {{ dialogo.texto | destacarBusca:termo }}
  <span [highlightChange]="valor">{{ valor }}</span>
</div>
*/