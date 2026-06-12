# Requisitos para nova versao

Este documento consolida os padroes atuais do projeto e define os requisitos para uma nova versao do app Toothy Planner. Ele deve orientar novas telas, componentes e ajustes visuais sem quebrar a identidade ja presente no codigo.

## 1. Objetivo da nova versao

A nova versao deve manter o app como uma ferramenta operacional para planejamento anual, acompanhamento de objetivos, calendarios semanais, atividades e carteiras financeiras. A experiencia deve ser direta, mobile-first, responsiva e consistente com o sistema visual atual.

Requisitos principais:

- Preservar a arquitetura React Native + TypeScript + Expo.
- Preservar Tailwind CSS v4, React hook form, Zod e TanStack Query.
- Manter rotas protegidas para areas autenticadas e rotas publicas para acesso, cadastro e verificacao de email.
- Manter suporte a tema claro e escuro.
- Priorizar componentes reutilizaveis em `src/components/` e `src/components/ui/`.
- Validar entradas com schemas em `src/schemas/`.
- Usar camada de API em `src/api/` e chaves de cache com escopo do usuario.

## 2. Identidade visual

### 2.1 Paleta de cores

A identidade visual usa verdes oliva como cor de marca, neutros quentes como base e cores semanticas para estados.

Cores de marca:

- `brand-50`: `#f3f6e9`
- `brand-100`: `#e6ebd3`
- `brand-200`: `#cdd9a7`
- `brand-300`: `#b2c57a`
- `brand-400`: `#9ab25c`
- `brand-500`: `#829d43`
- `brand-600`: `#6e8936`
- `brand-700`: `#5b6c32`
- `brand-800`: `#465427`
- `brand-900`: `#2e3719`

Neutros quentes:

- `neutral-50`: `#faf7f1`
- `neutral-100`: `#f3eee4`
- `neutral-200`: `#e6ded0`
- `neutral-300`: `#d5cab7`
- `neutral-400`: `#c4b7a0`
- `neutral-500`: `#a69581`
- `neutral-600`: `#8c7c6a`
- `neutral-700`: `#6e6153`
- `neutral-800`: `#50473c`
- `neutral-900`: `#3a332b`

Tokens do tema claro:

- `background`: `#f6f1e8`
- `foreground`: `#3a332b`
- `card` e `popover`: `#faf6ee`
- `primary`: `#5b6c32`
- `secondary`: `#e9e1d3`
- `muted`: `#f0e9dd`
- `accent`: `#e6e0ce`
- `border`: `#d6cdbe`
- `input`: `#cec4b2`
- `ring`: `#6e8936`
- `destructive`: `#b8493e`
- `success`: `#4f7d3a`
- `warning`: `#c9892d`
- `info`: `#3e6e8b`

Requisitos:

- Usar sempre os tokens semanticos (`bg-background`, `text-foreground`, `bg-card`, `text-muted-foreground`, `border-border`, `bg-primary`, `text-destructive`, etc.) em vez de cores hexadecimais direto nos componentes.
- Usar `primary` para acoes principais e destaques de marca.
- Usar `muted` e `accent` para areas secundarias, hover e blocos internos.
- Usar `destructive`, `success`, `warning` e `info` apenas para estados e feedbacks semanticos.
- Garantir contraste suficiente nos temas claro e escuro.

### 2.2 Tipografia

Fontes atuais:

- Corpo: `"Manrope", "Segoe UI", system-ui, sans-serif`.
- Display: `"Cormorant Garamond", "Times New Roman", serif`.
- Classe utilitaria de display: `font-display`.
- Classe utilitaria de corpo: `font-body`.

Requisitos:

- Usar `font-display` em titulos principais de telas.
- Usar `font-body` ou a fonte padrao do `body` para formularios, cards, listas e navegacao.
- Manter titulos de paginas em `text-3xl sm:text-4xl`, com `font-semibold`.
- Manter textos auxiliares em `text-sm text-muted-foreground`.
- Usar labels tecnicos ou indicadores em `text-xs font-semibold uppercase tracking-[0.14em]` ou `tracking-[0.2em]`.
- Evitar hierarquias exageradas dentro de cards; cards usam `text-lg` ou `text-xl` quando necessario.

### 2.3 Raios, bordas e sombra

Tokens:

- `--radius`: `0.875rem`.
- Cards base: `rounded-lg border bg-card shadow-sm`.
- Cards expressivos: `rounded-3xl border-border/80 bg-card shadow-sm`.
- Inputs e botoes base: `rounded-md`.
- Badges: `rounded-full`.

Requisitos:

- Usar `rounded-md` para controles compactos.
- Usar `rounded-lg` para cards padrao do Shadcn.
- Usar `rounded-2xl` ou `rounded-3xl` em superficies mais amigaveis ja existentes, como carteiras, atividades e blocos de resumo.
- Manter bordas suaves com `border-border`, `border-border/80` ou variantes semanticas.
- Usar `shadow-sm` com parcimonia, principalmente em cards e formularios.

### 2.4 Espacamento e layout

Padroes atuais:

- Layout autenticado ocupa `h-[var(--app-viewport-height)]`.
- Header fixo com altura `h-14`.
- Conteudo autenticado usa `pt-16`.
- Container principal: `mx-auto w-full max-w-6xl px-4 py-8 sm:px-6`.
- Telas medias: `max-w-4xl`.
- Formularios focados: `max-w-2xl`.
- Autenticacao: `max-w-md px-6 py-12`.
- Gaps de tela: `gap-6`.
- Grids de listas: `grid gap-4`.
- Formularios: `space-y-4` ou `space-y-6`.
- Card padding: `p-6`, `p-5 sm:p-7` ou `p-5 sm:p-6`.

Requisitos:

- Toda tela autenticada deve usar container centralizado e responsivo.
- Cabeçalhos de tela devem ser flexiveis: coluna no mobile e linha com acao alinhada no desktop quando houver botao principal.
- Listas devem usar `grid gap-4` ou `space-y-4`.
- Formularios devem agrupar campos com `space-y-4` e acoes no rodape do card.
- Evitar layouts muito largos para formularios.
- Manter suporte ao viewport dinamico e teclado virtual mobile via `--app-viewport-height` e `data-mobile-keyboard-scroll-root`.

## 3. Componentes obrigatorios

### 3.1 Componentes base de UI

A nova versao deve manter e evoluir a camada `src/components/ui/`:

- `Button`: variantes `default`, `destructive`, `outline`, `secondary`, `ghost`, `link`; tamanhos `default`, `sm`, `lg`, `icon`.
- `Card`: `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`.
- `Badge`: variantes `default`, `secondary`, `outline`, `success`, `warning`, `info`.
- `Input`, `Textarea`, `Select`, `Checkbox`, `RadioGroup`.
- `Dialog`, `Drawer`, `Popover`, `ScrollArea`, `Tabs`, `Progress`, `Chart`.
- `Field`: labels, descricao, erro, agrupamento horizontal/responsivo e separadores.

Requisitos:

- Componentes interativos devem expor estados `disabled`, foco visivel e hover.
- Botoes com icone devem usar `lucide-react`.
- Acoes destrutivas devem usar variante `destructive` apenas quando houver risco real.
- Feedback de erro deve aparecer com `FieldError`, dialog de resultado ou mensagem semantica visivel.

### 3.2 Componentes de formulario

Componentes existentes:

- `ControlledInput`
- `ControlledTextarea`
- `ControlledSelect`
- `ControlledCheckbox`
- `ControlledRadioGroup`

Requisitos:

- Todo formulario novo deve usar çç com `FormProvider`.
- Toda validacao deve partir de schema Zod em `src/schemas/`.
- Campos devem ter label claro, placeholder quando ajudar, `autoComplete` quando aplicavel e erro renderizado perto do campo.
- Em erro de validacao no submit, focar o primeiro campo invalido.
- Formularios de criacao e edicao devem compartilhar a mesma tela quando o comportamento for equivalente.

### 3.3 Componentes de feedback

Componentes existentes:

- `HttpRequestResultDialog`
- `ResponsiveDialog`
- `ActivityProgressDialog`
- `ActivityFormDialog`
- `WalletExpenseFormDialog`
- `ActivityReportExportDialog`

Requisitos:

- Erros de API devem ser normalizados por `getApiErrorMessage`.
- Sucessos e falhas de mutacao devem abrir feedback claro.
- Dialogs devem funcionar no mobile sem overflow e com foco acessivel.
- Fluxos com formulario em modal devem manter botao de cancelar e estado de carregamento.

### 3.4 Componentes de dominio

Componentes existentes que devem ser preservados ou reusados:

- `WalletCard`
- `WalletCycleCalendar`
- `WalletCycleExpensesSection`
- `WalletCycleBillingSection`
- `WalletExpenseListItem`
- `WalletNewExpenseAction`
- `ActivityCard`
- `GoalWeekCalendar`
- `BaseMonthCalendar`

Requisitos:

- Cards de dominio devem expor informacao principal no topo e metricas em blocos internos.
- Usar icones Lucide para acoes e categorias quando houver icone adequado.
- Cards clicaveis devem ter `role`, `tabIndex`, suporte a `Enter` e espaco.
- Estados perigosos de carteira ou gasto devem usar `destructive` de forma consistente.

## 4. Telas necessarias

### 4.1 Telas publicas

#### Login

Rota atual: `/login`.

Requisitos:

- Formulario com usuario e senha.
- Link para cadastro.
- Link para verificacao de email.
- Tema claro/escuro disponivel no canto superior.
- Erro de login via dialog.

#### Cadastro

Rota atual: `/register`.

Requisitos:

- Formulario de criacao de conta.
- Validacao com Zod.
- Feedback de sucesso e erro.
- Navegacao para login apos cadastro ou orientacao de verificacao.

#### Verificacao de email

Rota atual: `/verify-email`.

Requisitos:

- Formulario de envio/confirmacao conforme API existente.
- Feedback explicito de sucesso e erro.
- Link de retorno para login.

### 4.2 Layout autenticado

Rotas protegidas usam `ProtectedRoute` e `AppLayout`.

Requisitos:

- Header fixo com logo central.
- Menu lateral via drawer no mobile e desktop.
- Dados do usuario no drawer.
- Navegacao para Objetivos, Carteiras, Meu perfil e Calendarios.
- Botao de logout.
- Switch de tema sempre acessivel.
- Conteudo rolavel abaixo do header.

### 4.3 Objetivos

Rotas atuais:

- `/objectives`
- `/objectives/new`
- `/objectives/edit/:objectiveId`

Requisitos da listagem:

- Agrupar objetivos por Longo prazo, Medio prazo e Calendario.
- Mostrar quantidade por grupo.
- Exibir estados Pendente e Concluido com badge.
- Permitir editar objetivos pendentes.
- Permitir concluir objetivos pendentes.
- Exibir objetivos concluidos em secao separada ou estado visual diferenciado.
- Mostrar calendario vinculado quando o tipo for Calendario.
- Estado vazio por grupo.
- Feedback de erro ao carregar e ao concluir.

Requisitos do formulario:

- Campos: tipo, calendario quando aplicavel, titulo, descricao.
- Criacao e edicao na mesma tela.
- Objetivo concluido nao pode ser editado.
- Sucesso e erro via dialog.
- Voltar ou navegar apos sucesso deve ser definido no fluxo da nova versao.

### 4.4 Calendarios

Rotas atuais:

- `/goal-calendars`
- `/goal-calendars/new`
- `/goal-calendars/edit/:goalCalendarId`
- `/goal-calendars/:goalCalendarId`

Requisitos da listagem:

- Listar calendarios com titulo, periodo, quantidade de semanas e status Ativo/Inativo.
- Acoes para ver detalhes e editar.
- Estado de carregamento.
- Estado vazio com chamada para criar calendario.
- Feedback de erro ao carregar.

Requisitos do formulario:

- Criar e editar calendario.
- Campos minimos: titulo, data inicial, data final quando aplicavel, numero de semanas e status quando suportado pela API.
- Validacao com Zod.
- Feedback de sucesso e erro.

Requisitos dos detalhes:

- Exibir semanas ativas ordenadas.
- Permitir selecionar semana.
- Mostrar progresso geral quando houver dados.
- Exibir atividades da semana.
- Criar, editar e marcar progresso em atividades.
- Exportar ou adicionar relatorio quando aplicavel.
- Tratar metricas de atividade: Frequencia, Quantidade e Dias especificos.
- Estado vazio para semanas sem atividades.
- Feedback para falhas de carregamento e mutacoes.

### 4.5 Atividades semanais

Requisitos:

- Atividade deve ter titulo, descricao, tipo de metrica e alvo.
- Tipo Frequencia deve permitir marcar ocorrencias.
- Tipo Quantidade deve permitir informar quantidade.
- Tipo Dias especificos deve permitir selecionar dias da semana.
- Card deve mostrar progresso atual, meta e metrica.
- Acao principal: marcar progresso.
- Acao secundaria: editar.
- Estados de progresso pendente/carregando devem bloquear duplo envio.

### 4.6 Carteiras

Rotas atuais:

- `/wallets`
- `/wallets/new`
- `/wallets/edit/:walletId`
- `/wallets/:walletId/cycle`

Requisitos da listagem:

- Listar carteiras com nome, ciclo, limite mensal restante e limite total restante.
- Card clicavel abre ciclo da carteira.
- Botao de editar em cada card.
- Botao para nova carteira.
- Estado de perigo quando limite mensal ou total estiver negativo.
- Estado de carregamento, vazio e erro.

Requisitos do formulario:

- Criar e editar carteira.
- Campos minimos: nome, inicio do ciclo, fim do ciclo e limites conforme API.
- Validacao de datas/dias de ciclo.
- Feedback de sucesso e erro.

### 4.7 Ciclo da carteira

Rota atual: `/wallets/:walletId/cycle`.

Requisitos:

- Calendario para selecionar data do ciclo.
- Resolver ciclo por carteira e data selecionada.
- Abas: Gastos e Fatura.
- Aba Gastos deve listar despesas, permitir criar nova despesa e mostrar estados de carregamento/vazio/erro.
- Aba Fatura deve exibir dados consolidados do ciclo.
- Alterar data deve atualizar os dados via TanStack Query.
- Erros ao resolver ciclo devem abrir dialog.

### 4.8 Perfil

Rota atual: `/me`.

Requisitos:

- Exibir dados principais do usuario.
- Permitir edicao quando suportado pela API.
- Exibir username, email e nome completo quando disponiveis.
- Manter feedback de erro/sucesso padrao.

### 4.9 Styleguide

Rotas atuais em ambiente `VITE_ENV=dev`.

Requisitos:

- Manter styleguide interno para componentes base.
- Documentar exemplos de input, textarea, select, checkbox, field, dialog, drawer, responsive dialog e scroll area.
- Adicionar exemplos de novos componentes reutilizaveis antes de usa-los em varias telas.

## 5. Estados obrigatorios por tela

Toda tela que consome API deve implementar:

- Estado inicial/carregando.
- Estado vazio quando a lista nao tiver dados.
- Estado de erro com mensagem clara.
- Estado de sucesso para mutacoes.
- Estado de envio pendente para impedir duplo clique.
- Estado responsivo mobile e desktop.
- Estado dark mode.

## 6. Requisitos de acessibilidade

- Todo botao icon-only deve ter `aria-label`.
- Elementos clicaveis que nao sao botoes nativos devem ter `role`, `tabIndex` e teclado.
- Foco visivel deve ser preservado com `focus-visible:ring`.
- Labels devem estar associados aos campos.
- Dialogs e drawers devem manter gerenciamento de foco via Radix/Vaul.
- Texto nao deve depender apenas de cor para comunicar estado critico.
- Mensagens de erro devem ficar proximas ao campo ou em dialog claro.

## 7. Requisitos tecnicos

- Usar TypeScript em todos os arquivos de app.
- Manter imports com alias `@/` quando seguir o padrao existente.
- Usar React Query para dados remotos.
- Invalidar queries apos mutacoes.
- Usar schemas Zod para validar respostas criticas da API e formularios.
- Manter funcoes utilitarias compartilhadas em `src/lib/` ou `src/assets/utils/` conforme escopo existente.
- Evitar logica de dominio pesada dentro de JSX; extrair helpers no mesmo arquivo ou em utilitario quando reutilizavel.
- Evitar novas bibliotecas sem necessidade clara.

## 8. Checklist de aceite da nova versao

- `npm run lint` deve passar.
- `npm run build` deve passar.
- Tema claro e escuro devem funcionar em todas as telas.
- Telas publicas devem funcionar sem autenticacao.
- Telas protegidas devem redirecionar corretamente quando nao autenticado.
- Todas as mutacoes devem exibir feedback.
- Todos os formularios devem validar no cliente.
- Layout deve estar correto em mobile e desktop.
- Nenhum texto importante deve quebrar ou sobrepor controles.
- Componentes novos devem estar no styleguide quando forem reutilizaveis.
