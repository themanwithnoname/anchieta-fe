# Estratégia CSS - Sistema Anchieta

## Problema Resolvido
- **Sobrescrita de seletores**: Media queries duplicados causando conflitos
- **Inconsistência de valores**: Paddings e margins hardcoded repetidos
- **Manutenibilidade**: Mudanças exigiam edição em múltiplos arquivos

## Solução Implementada

### 1. **Design Tokens Centralizados**
```scss
// Todos os valores estão em /src/app/shared/styles/design-tokens.scss
--page-header-padding: var(--space-2) var(--space-4);
--page-header-min-height: 50px;
```

### 2. **Tokens Responsivos**
```scss
// Breakpoints gerenciam automaticamente os valores
@media (min-width: 1024px) {
  :root {
    --page-header-padding: var(--space-3) var(--space-5);
  }
}
```

### 3. **Componentes Usam Tokens**
```scss
.page-header {
  padding: var(--page-header-padding);  // ✅ Token responsivo
  min-height: var(--page-header-min-height);
  
  // ❌ NUNCA mais fazer isso:
  // padding: 1rem;  
  // @media (min-width: 1024px) { padding: 2rem; }
}
```

## Regras de Boas Práticas

### ✅ FAÇA
- Use design tokens para TODOS os valores
- Um seletor por breakpoint nos tokens
- Organize CSS por: tokens → utilities → components → layout
- Prefira `var(--token)` a valores hardcoded

### ❌ NÃO FAÇA
- Media queries duplicados para o mesmo seletor
- Valores hardcoded (`padding: 1rem`)
- Overrides com `!important`
- CSS espalhado sem estrutura

## Hierarquia de Especificidade

```
1. Design Tokens (maior prioridade)
   ↓
2. Utility Classes
   ↓  
3. Component Styles
   ↓
4. Layout Styles (menor prioridade)
```

## Como Adicionar Novos Componentes

1. **Crie tokens específicos** em `design-tokens.scss`:
```scss
// Novo componente
--meu-componente-padding: var(--space-4);
--meu-componente-radius: var(--radius-md);
```

2. **Adicione breakpoints se necessário**:
```scss
@media (min-width: 1024px) {
  :root {
    --meu-componente-padding: var(--space-6);
  }
}
```

3. **Use no componente**:
```scss
.meu-componente {
  padding: var(--meu-componente-padding);
  border-radius: var(--meu-componente-radius);
}
```

## Resultado
- **Zero conflitos** de especificidade
- **Valores consistentes** em toda aplicação
- **Manutenibilidade**: mudança em 1 local reflete em todos
- **Performance**: menos CSS duplicado