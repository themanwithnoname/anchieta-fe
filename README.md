# Sistema Anchieta - Frontend

Um projeto Angular moderno e responsivo com uma estrutura completa para desenvolvimento frontend empresarial.

## 🚀 Funcionalidades

- ✅ **Header responsivo** com menu de navegação e sistema de login
- ✅ **Sidebar retrátil** com navegação lateral
- ✅ **Roteamento** configurado com lazy loading
- ✅ **Sistema de autenticação** simulado
- ✅ **Serviços para comunicação** com backend
- ✅ **Design responsivo** que funciona em desktop e mobile
- ✅ **Componentes modulares** e reutilizáveis
- ✅ **SCSS** para estilização avançada
- ✅ **Font Awesome** para ícones
- ✅ **Tipagem TypeScript** completa

## 🛠️ Tecnologias Utilizadas

- **Angular 17** - Framework principal
- **TypeScript** - Linguagem de programação
- **SCSS** - Pré-processador CSS
- **RxJS** - Programação reativa
- **Font Awesome** - Biblioteca de ícones
- **Angular Router** - Sistema de roteamento
- **Angular Standalone Components** - Arquitetura moderna

## 📂 Estrutura do Projeto

```
src/
├── app/
│   ├── components/          # Componentes reutilizáveis
│   │   ├── header/         # Cabeçalho com menu e login
│   │   ├── sidebar/        # Menu lateral retrátil
│   │   └── footer/         # Rodapé da aplicação
│   ├── pages/              # Páginas da aplicação
│   │   ├── home/           # Página inicial
│   │   └── about/          # Página sobre
│   ├── services/           # Serviços para lógica de negócio
│   │   ├── api.service.ts  # Comunicação com backend
│   │   └── auth.service.ts # Autenticação
│   ├── app.component.*     # Componente raiz
│   ├── app.routes.ts       # Configuração de rotas
│   └── app.config.ts       # Configuração da aplicação
├── assets/                 # Recursos estáticos
└── styles.scss            # Estilos globais
```

## 🚀 Como Executar

### Pré-requisitos

- Node.js (versão 18 ou superior)
- npm ou yarn
- Angular CLI

### Instalação

1. **Clone o repositório** (se aplicável)
```bash
git clone [url-do-repositorio]
cd anchieta-frontend
```

2. **Instale as dependências**
```bash
npm install
```

3. **Execute o servidor de desenvolvimento**
```bash
ng serve
```

4. **Acesse a aplicação**
Abra http://localhost:4200 no seu navegador

### Scripts Disponíveis

```bash
# Servidor de desenvolvimento
ng serve

# Build para produção
ng build

# Executar testes
ng test

# Análise de código
ng lint

# Criar novos componentes
ng generate component nome-do-componente

# Criar novos serviços
ng generate service nome-do-servico
```

## 🏗️ Arquitetura

### Componentes Principais

#### Header Component
- Menu de navegação responsivo
- Sistema de login/logout
- Botão para toggle do sidebar
- Indicador de usuário logado

#### Sidebar Component
- Menu lateral com navegação
- Função de colapsar/expandir
- Ícones para cada item do menu
- Responsivo para mobile

#### Footer Component
- Informações da empresa
- Links úteis
- Redes sociais
- Copyright dinâmico

### Serviços

#### AuthService
- Gerenciamento de autenticação
- Simulação de login/logout
- Controle de estado do usuário
- Persistência no localStorage

#### ApiService
- Métodos para comunicação HTTP
- Tratamento de erros centralizado
- Headers de autenticação automáticos
- Suporte a diferentes tipos de requisição

## 🎨 Design System

### Cores Principais
- **Primary**: #3498db (Azul)
- **Secondary**: #2c3e50 (Azul escuro)
- **Success**: #27ae60 (Verde)
- **Warning**: #f39c12 (Laranja)
- **Danger**: #e74c3c (Vermelho)

### Breakpoints
- **Mobile**: < 768px
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px

## 🔧 Customização

### Adicionando Novas Páginas

1. **Crie um novo componente**
```bash
ng generate component pages/nova-pagina
```

2. **Adicione a rota em app.routes.ts**
```typescript
{
  path: 'nova-pagina',
  loadComponent: () => import('./pages/nova-pagina/nova-pagina.component').then(m => m.NovaPaginaComponent)
}
```

3. **Adicione o link no sidebar**
```html
<li class="nav-item">
  <a routerLink="/nova-pagina" routerLinkActive="active" class="nav-link">
    <i class="fas fa-icon"></i>
    <span class="nav-text" *ngIf="!isCollapsed">Nova Página</span>
  </a>
</li>
```

### Configurando Backend

Edite o arquivo `src/app/services/api.service.ts` e altere a `baseUrl`:

```typescript
private baseUrl = 'https://sua-api.com/api';
```

## 📱 Responsividade

O projeto foi desenvolvido com **mobile-first** e possui:

- Layout fluido que se adapta a diferentes tamanhos
- Sidebar que se transforma em menu mobile
- Componentes que se reorganizam automaticamente
- Imagens e textos que se ajustam ao dispositivo

## 🔒 Autenticação

O sistema inclui um serviço de autenticação simulado que:

- Persiste o estado do usuário
- Controla o acesso às rotas (extensível com guards)
- Gerencia tokens de autenticação
- Fornece feedback visual do estado de login

## 🚀 Deploy

### Build para Produção

```bash
ng build --configuration production
```

Os arquivos serão gerados em `dist/anchieta-frontend/`

### Variáveis de Ambiente

Crie arquivos de ambiente em `src/environments/`:

```typescript
// environment.prod.ts
export const environment = {
  production: true,
  apiUrl: 'https://api.producao.com'
};
```

## 🤝 Contribuição

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📞 Suporte

Para dúvidas ou suporte, entre em contato:

- Email: contato@anchieta.com
- Telefone: (11) 1234-5678

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

**Desenvolvido com ❤️ usando Angular**
