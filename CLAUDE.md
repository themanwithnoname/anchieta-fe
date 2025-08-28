# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Visão Geral do Projeto

Sistema Anchieta é uma aplicação Angular 17 frontend desenvolvida para gerenciamento de casos jurídicos e serviços de transcrição. Possui interface moderna e responsiva com capacidades de transcrição de áudio/vídeo, gerenciamento de participantes e funcionalidade de processamento de casos.

## Arquitetura Principal

### Estrutura da Aplicação
- **Arquitetura de Componentes Standalone**: Usa componentes standalone do Angular 17 (sem NgModules)
- **Padrão Componente-Serviço**: Separação clara entre componentes UI e lógica de negócio nos serviços
- **Lazy Loading**: Rotas configuradas com carregamento preguiçoso para performance otimizada
- **Estilização SCSS**: Usa SCSS com abordagem responsiva mobile-first

### Componentes Principais
- **ModalTranscricaoComponent**: Interface principal de edição de transcrição com integração complexa de áudio/vídeo
- **AudioPlayerComponent**: Gerencia reprodução de áudio, navegação de timeline e controles de mídia
- **ParticipanteService**: Gerencia participantes jurídicos (juízes, advogados, testemunhas, etc.) com atribuição de papéis
- **ApiService**: Cliente HTTP centralizado com cabeçalhos de autenticação e tratamento de erros
- **AuthService**: Gerenciamento de autenticação usando signals do Angular para estado reativo

### Modelos de Dados
- **DialogoTranscricao**: Interface principal para segmentos de transcrição com timestamps, níveis de confiança e histórico de edições
- **Participante**: Interface para participantes jurídicos com papéis, cores e estatísticas de fala
- **ProcessoInfo**: Estrutura de informações de processos judiciais

## Comandos de Desenvolvimento

```bash
# Servidor de desenvolvimento
ng serve                    # Inicia servidor dev em http://localhost:4200
npm start                   # Alternativa ao ng serve

# Build
ng build                    # Build de produção
ng build --configuration development  # Build de desenvolvimento
npm run build              # Build de produção via npm

# Testes
ng test                    # Executa testes unitários com Karma
npm run test              # Comando alternativo de teste

# Observação de arquivos durante desenvolvimento
npm run watch             # Build com observação de arquivos habilitada
```

## Principais Serviços e Lógica de Negócio

### ParticipanteService
Gerencia participantes de casos jurídicos com papéis predefinidos (Juiz, Advogado, Testemunha, Perito, etc.). Trata criação de participantes, edição e atribuição de papéis. Codificados por cores para diferenciação na UI.

### ApiService
Fornece métodos HTTP genéricos (GET, POST, PUT, DELETE) com autenticação automática por Bearer token. Inclui suporte a upload de arquivos e tratamento centralizado de erros com mensagens amigáveis. URL base configurada para localhost:3000/api.

### AuthService
Usa signals do Angular para estado de autenticação reativo. Simula autenticação com persistência no localStorage. Pronto para integração com backend de autenticação real.

## Integração de Áudio/Vídeo

A aplicação possui funcionalidade sofisticada de áudio/vídeo:
- **Navegação por Timeline**: Funcionalidade click-to-seek em barras de progresso
- **Reprodução de Diálogos**: Reproduz segmentos específicos da transcrição com posicionamento por timestamp
- **Integração com Modal de Vídeo**: Player de vídeo embutido com sincronização de timestamp
- **Progresso em Tempo Real**: Reprodução simulada de áudio com rastreamento de progresso

## Funcionalidades de Transcrição

### Capacidades de Edição Complexas
- **Edição de Texto ao Vivo**: Edição in-place de texto de transcrição com histórico de alterações
- **Gerenciamento de Participantes**: Troca em tempo real de participantes e edição de papéis
- **Busca e Navegação**: Busca em texto completo com destaque de resultados e navegação
- **Níveis de Confiança**: Indicadores visuais para precisão da transcrição (alta/média/baixa)
- **Sistema de Anotações**: Notas e marcadores em segmentos específicos do diálogo

### Padrões de Gerenciamento de Estado
- Uso extensivo de estado de componente para gerenciamento de modais
- Rastreamento de mudanças em tempo real com contador de alterações pendentes
- Rastreamento de histórico para todas as edições com atribuição de usuário e timestamps

## Estilização e Design Responsivo

- **Mobile-First**: Design responsivo começando de breakpoints mobile
- **Variáveis SCSS**: Esquema de cores consistente com cores predefinidas para papéis jurídicos
- **Scoping de Componentes**: Todos os estilos limitados aos componentes
- **Grade Similar ao Bootstrap**: Sistema de grade responsiva customizada

## Contexto de Desenvolvimento Atual

O código mostra desenvolvimento ativo de funcionalidades de transcrição com vários arquivos em progresso:
- Componente de modal de transcrição com múltiplas versões de backup/trabalho
- Componente de player de áudio recentemente extraído do modal
- Serviço de participantes para gerenciamento de casos jurídicos

## Notas Importantes

- **Autenticação**: Atualmente simulada - pronta para integração com backend
- **Integração de API**: Configurada para localhost:3000/api mas facilmente configurável
- **Estrutura de Arquivos**: Siga padrões existentes ao adicionar novos componentes
- **Convenções de Nomenclatura**: Nomenclatura em português para conceitos de domínio de negócio, inglês para termos técnicos
- **Testes**: Setup Jasmine/Karma presente mas testes podem precisar atualizações para componentes atuais

## Conhecimento do Domínio Jurídico

Esta aplicação é especificamente projetada para procedimentos legais brasileiros:
- **Papéis de Participantes**: Juiz, Advogados, Peritos, Testemunhas
- **Tipos de Casos**: Casos de vara do trabalho com disputas trabalhistas
- **Estrutura de Documentos**: Transcrição jurídica com identificação formal de participantes
- **Trilha de Auditoria**: Histórico completo de alterações para conformidade legal

## Comunicação em Português-BR

Ao trabalhar neste projeto, use sempre o português brasileiro para:
- Comentários em código relacionados à lógica de negócio
- Mensagens de commit quando apropriado
- Nomes de variáveis relacionadas ao domínio jurídico
- Documentação de funcionalidades específicas do sistema jurídico brasileiro