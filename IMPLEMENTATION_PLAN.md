# План реализации XMLSpy Clone на React + TypeScript

## Контекст

Создание полнофункционального клона Altova XMLSpy — ведущего в отрасли редактора XML и среда разработки, используемого более чем 5 миллионами разработчиков. Приложение должно предоставлять comprehensive инструменты для работы с XML, XSD, XSLT, XPath и XQuery.

**Проблема:** Существующие решения (XMLSpy) — коммерческие продукты. Необходимо создать open-source альтернативу с современной веб-архитектурой.

**Цель:** Полноправный клон XMLSpy с приоритетом на MVP (минимально жизнеспособный продукт), включающий базовые функции XML и XSD поддержку.

**Технологический стек:**

- Frontend: React 18 + TypeScript
- Build tool: Vite
- State management: Zustand
- Editor: Monaco Editor
- XML parsing: fast-xml-parser + xmldom
- Validation: xsdata + xml-xsd-validator

---

## Ранжирование функций по сложности

### Уровень 1: Базовый (1-3 дня на функцию)

**Функции:**

- XML Text View (Monaco Editor интеграция)
- XML Syntax Checking (быстрая проверка синтаксиса)
- XML Viewer (базовое дерево элементов)
- File operations (открытие/сохранение файлов)
- XSD Text Editor
- XML formatting/minify
- Basic error display

**Библиотеки:**

- `@monaco-editor/react` — редактор кода
- `fast-xml-parser` — парсинг XML
- `xmldom` — DOM manipulation

---

### Уровень 2: Средний (3-5 дней на функцию)

**Функции:**

- XML Validator (базовая валидация)
- Validate XML against XSD
- XSD to XML Generation
- Generate XSD from XML
- XPath Builder & Tester (базовый)
- XSD Visual Viewer (базовый)
- XSLT Editor (редактор с подсветкой)

**Библиотеки:**

- `xsdata` — XSD валидация
- `xml-xsd-validator` — валидация XML против XSD
- `xmlschema` — работа со схемами
- `xpath.js` или `fontoxpath` — XPath

---

### Уровень 3: Продвинутый (5-10 дней на функцию)

**Функции:**

- XML Grid View (табличное представление)
- Enhanced XML Tree View (расширенное дерево)
- Schema-Aware Editing (автодополнение на основе схемы)
- XSLT transformation (XSLT 1.0, 2.0, 3.0)
- XQuery Editor
- XQuery execution
- XSLT transformation result preview

**Библиотеки:**

- `ag-grid-react` — табличное представление
- `react-dnd` — drag-and-drop
- `saxon-js` — XSLT 3.0 и XQuery 3.1
- `fontoxpath` — XPath 3.1

---

### Уровень 4: Экспертный (10-15 дней на функцию)

**Функции:**

- Compare XML files (сравнение и слияние)
- XSLT Debugger
- XSLT Profiler
- XPath Debugger
- XQuery Profiler
- Advanced Grid features (фильтрация, группировка, формулы)
- Schema-aware advanced editing
- Large file optimization (файлы 1GB+)

**Библиотеки:**

- `diff` + `react-diff-viewer` — сравнение
- Кастомная реализация отладчиков
- Web Workers для оптимизации

---

## Детальный план реализации

### Этап 0: Настройка проекта (Неделя 1)

**Задачи:**

1. Инициализация React + TypeScript проекта
   - Создать проект с Vite: `npm create vite@latest xmlPreviewer -- --template react-ts`
   - Настроить tsconfig.json для строгой проверки типов
   - Настроить ESLint и Prettier
   - Настроить Git repository

2. Базовая структура папок
   - Создать структуру директорий (см. ниже)
   - Создать базовые файлы конфигурации
   - Настроить алиасы импортов

3. Установка базовых зависимостей

   ```bash
   npm install react react-dom zustand @monaco-editor/react
   npm install -D @types/react @types/react-dom @vitejs/plugin-react typescript vite
   npm install -D vitest @testing-library/react @testing-library/jest-dom eslint prettier
   ```

4. Настройка тестирования
   - Настроить Vitest
   - Настроить React Testing Library
   - Создать базовые тесты

**Результат:** Рабочая среда разработки с базовой структурой

**Критические файлы:**

- `package.json`
- `tsconfig.json`
- `vite.config.ts`
- `.eslintrc.cjs`
- `src/main.tsx`
- `src/App.tsx`

---

### Этап 1: MVP - Базовые функции XML (Недели 2-4)

**Цель:** Базовый XML редактор с валидацией

**Задачи:**

1. **Система управления документами** (Дни 1-3)
   - `DocumentManager.tsx` — управление открытыми документами
   - `DocumentStore.ts` — Zustand store для состояния документов
   - `Document.ts` — интерфейсы документа
   - `DocumentFactory.ts` — фабрика для создания документов
   - Поддержка вкладок (tabs)
   - Управление состоянием dirty/saved

2. **Парсер XML** (Дни 4-6)
   - `XMLParser.ts` — реализация парсера
   - Интеграция `fast-xml-parser`
   - Обработка ошибок парсинга
   - Кеширование результатов
   - Поддержка больших файлов (streaming)

3. **Текстовый редактор (Monaco)** (Дни 7-10)
   - `MonacoEditor.tsx` — обёртка над Monaco
   - `XMLTextEditor.tsx` — XML-специфичный редактор
   - Настройка подсветки синтаксиса XML
   - Настройка сворачивания кода
   - Интеграция с DocumentManager

4. **Проверка синтаксиса XML** (Дни 11-13)
   - `XMLValidator.ts` — базовая валидация
   - `ValidationPanel.tsx` — панель ошибок
   - `ErrorList.tsx` — список ошибок
   - Реальное время проверки (debounced)
   - Навигация к ошибке

5. **Базовое дерево XML** (Дни 14-15)
   - `XMLTree.tsx` — древовидное представление
   - `TreeNode.tsx` — компонент узла
   - `TreeBuilder.ts` — построение дерева из DOM
   - Раскрытие/сворачивание узлов

6. **Файловые операции** (Дни 16-18)
   - `useFileOperations.ts` — хук для работы с файлами
   - Открытие файлов (File API)
   - Сохранение файлов
   - Недавние файлы
   - Drag & drop файлов

**Результат:** Функциональный текстовый XML редактор с подсветкой, базовой валидацией и деревом элементов

**Критические файлы:**

- `src/core/documentManager/DocumentManager.tsx`
- `src/core/parserEngine/XMLParser.ts`
- `src/views/text/MonacoEditor.tsx`
- `src/core/validatorEngine/XMLValidator.ts`
- `src/stores/documentStore.ts`

---

### Этап 2: Поддержка XSD (Недели 5-7)

**Цель:** Полноценная поддержка XML Schema

**Задачи:**

1. **XSD редактор** (Дни 1-3)
   - `XSDTextEditor.tsx` — текстовый редактор XSD
   - Подсветка синтаксиса XSD
   - Автодополнение XSD элементов
   - Валидация XSD схемы

2. **Валидация XML против XSD** (Дни 4-7)
   - Улучшение `XMLValidator.ts` для поддержки XSD
   - Интеграция `xsdata` или `xml-xsd-validator`
   - Кеширование схем
   - Детальные ошибки валидации
   - Quick-fix предложения

3. **Генерация XSD из XML** (Дни 8-11)
   - `XSDGenerator.ts` — генерация схемы
   - Анализ XML структуры
   - Определение типов данных
   - Обработка повторяющихся элементов
   - Мастер генерации (Wizard)

4. **Генерация XML из XSD** (Дни 12-14)
   - `XSDToXMLGenerator.ts` — генерация экземпляров
   - Создание примеров XML
   - Заполнение опциональных элементов
   - Настройка параметров генерации

5. **Визуализация XSD** (Дни 15-17)
   - `XSDVisualizer.tsx` — графическое представление
   - Отображение элементов, атрибутов, типов
   - Иерархия типов
   - Навигация по схеме

**Результат:** Полная поддержка XSD с генерацией и валидацией

**Критические файлы:**

- `src/views/text/XSDTextEditor.tsx`
- `src/services/xsd/XSDGenerator.ts`
- `src/services/xsd/XSDToXMLGenerator.ts`
- `src/core/validatorEngine/XMLValidator.ts` (расширенный)

---

### Этап 3: Продвинутые представления (Недели 8-10)

**Цель:** Множественные синхронизированные представления

**Задачи:**

1. **XML Grid View** (Дни 1-7)
   - `XMLGrid.tsx` — табличное представление
   - Интеграция `ag-grid-react`
   - Отображение атрибутов и дочерних элементов
   - Inline редактирование
   - Фильтрация и сортировка
   - Вложенные таблицы для сложных структур

2. **Улучшенное дерево** (Дни 8-10)
   - Расширение `XMLTree.tsx`
   - Drag-and-drop реорганизация
   - Контекстное меню узлов
   - Поиск по дереву
   - Выбор множественных узлов

3. **Синхронизация представлений** (Дни 11-13) ✅ **COMPLETED**
   - `ViewCoordinator.ts` — координация представлений ✅
   - `ViewSyncManager.ts` — синхронизация изменений ✅
   - Observer паттерн для обновлений ✅
   - Debounce синхронизации ✅
   - Integration tests (677 total tests, 100% viewManager coverage) ✅

   **Implementation Details:**
   - Created `ViewUpdate` data structure for typed updates
   - Implemented `ViewSyncManager` with 300ms debounce
   - Built `ViewCoordinator` singleton for broadcast updates
   - Added `useViewSync` React hook for component integration
   - Integrated sync into all three views (text, grid, tree)
   - Added timestamp-based update loop prevention (50ms guard)
   - Full test coverage: unit tests + integration tests
   - Test results: 677 tests passing, 78.25% overall coverage

4. **Schema-Aware Editing** (Дни 14-17) ✅ **COMPLETED**
   - Интеграция XSD в автодополнение Monaco
   - Контекстные подсказки
   - Валидация в реальном времени
   - Предложения на основе схемы
   - Проверка ограничений (facets)

   **Implementation Details:**
   - Created `SchemaProvider` for XSD schema detection, loading, and caching
   - Implemented `XMLContextAnalyzer` for cursor position analysis (inside tag, attribute, content)
   - Built `ContextStack` for hierarchical XML context tracking
   - Developed `SchemaCompletionProvider` for Monaco autocomplete integration
   - Added `CompletionItems` utilities for generating element/attribute suggestions
   - Created `SchemaDecorationProvider` for live error visualization in editor
   - Implemented `SchemaQuickFixProvider` for code action suggestions
   - Full integration with Monaco Editor languages API
   - Comprehensive test suite: 45 tests for schema-aware features
   - Test results: 698 tests passing, 89.14% XSD services coverage, 91.09% line coverage

   **Key Features:**
   - Automatic XSD detection from XML (xsi:noNamespaceSchemaLocation, xsi:schemaLocation)
   - Context-aware suggestions (elements, attributes, values based on XSD types)
   - Real-time validation decorations in Monaco editor
   - Quick fix actions for common schema violations
   - Performance optimized with LRU cache (max 20 schemas)
   - Thread-safe context stack for complex XML hierarchies

**Результат:** Несколько синхронизированных представлений с интеллектуальным редактированием

**Критические файлы:**

- `src/views/grid/XMLGrid.tsx`
- `src/core/viewManager/ViewCoordinator.ts`
- `src/views/text/XMLTextEditor.tsx` (расширенный)

---

### Этап 3.5: XSD Graph Visualization (Post-MVP Enhancement)

**Status:** ✅ **COMPLETE**

Added interactive graph visualization for XSD schemas with dependency tracking and hierarchical layout.

**Implementation Details:**

**Services:**
- `GraphBuilder.ts` — Traverses XSD schema dependencies (elements → complexTypes → simpleTypes)
- `GraphLayoutEngine.ts` — dagre-based automatic layout with configurable directions (TB, LR, RL, BT)
- Smart node positioning with edge routing and cycle detection

**Components:**
- `ElementNode.tsx` — Custom React Flow node for XSD elements (blue styling, type info)
- `ComplexTypeNode.tsx` — Complex type visualization (purple styling, element/attribute counts)
- `SimpleTypeNode.tsx` — Simple type representation (green styling, base type display)
- `BuiltInTypeNode.tsx` — XSD built-in types (gray styling, read-only)
- `GraphControls.tsx` — Zoom in/out, fit view, layout direction, search filtering
- `XSDGraphVisualizer.tsx` — Main graph container with ReactFlow integration

**Integration:**
- Added as third tab in `XSDVisualizer.tsx` (tabs: Tree, Components, Graph)
- Element selector dropdown for root node selection
- Real-time node search and filtering
- Interactive navigation (pan, zoom, click to select)

**Testing:**
- Component tests: GraphBuilder (10 tests), GraphLayoutEngine (7 tests), XSDGraphVisualizer (5 tests)
- All 22 tests passing
- Coverage: GraphBuilder 96.29%, GraphLayoutEngine 100%, XSDGraphVisualizer 59.18%

**Dependencies:**
- `reactflow` — Interactive graph rendering
- `dagre` — Automatic graph layout algorithm
- `@xyflow/react` — React Flow library

**Files Created:** 14 new files
**Tests Added:** 22 new tests passing
**Total Test Count:** 715 tests passing (698 + 17 graph tests)

**Key Features:**
- Automatic dependency graph generation from XSD schema
- Hierarchical layout with configurable direction (top-to-bottom, left-to-right)
- Interactive zoom, pan, and fit-to-view controls
- Real-time node search and filtering
- Color-coded nodes by type (element/complexType/simpleType/built-in)
- Type information display on hover
- Empty state handling for schemas without elements

---

### Этап 4: Трансформации (Недели 11-13)

**Цель:** Поддержка XSLT и XQuery

**Задачи:**

1. **XPath Builder & Tester** (Дни 1-4)
   - `XPathBuilder.tsx` — построитель выражений
   - `XPathTester.tsx` — тестирование запросов
   - Интеграция `fontoxpath`
   - Подсветка результатов
   - История запросов

2. **XSLT редактор** (Дни 5-7)
   - `XSLTTextEditor.tsx` — редактор XSLT
   - Подсветка синтаксиса XSLT
   - Валидация XSLT
   - Автодополнение XSLT инструкций

3. **XSLT трансформация** (Дни 8-11)
   - `XSLTEngine.ts` — движок трансформации
   - Интеграция `saxon-js`
   - Поддержка XSLT 1.0, 2.0, 3.0
   - Предпросмотр результатов
   - Сравнение входа/выхода

4. **XQuery поддержка** (Дни 12-14)
   - `XQueryTextEditor.tsx` — редактор XQuery
   - `XQueryEngine.ts` — выполнение XQuery
   - Поддержка XQuery 3.1
   - Результаты запросов

**Результат:** Полная поддержка трансформаций и запросов

**Критические файлы:**

- `src/services/xpath/XPathService.ts`
- `src/views/text/XSLTTextEditor.tsx`
- `src/services/xslt/XSLTEngine.ts`

---

### Этап 5: Экспертные функции (Недели 14-16)

**Цель:** Профессиональные возможности

**Задачи:**

1. **Сравнение XML** (Дни 1-4)
   - `XMLComparer.ts` — логика сравнения
   - `DiffView.tsx` — визуализация различий
   - Интеграция `react-diff-viewer`
   - Слияние изменений
   - 3-way merge

2. **XSLT отладчик** (Дни 5-9)
   - `XSLTDebugger.tsx` — UI отладчика
   - Step-by-step выполнение
   - Точки останова
   - Просмотр переменных
   - Call stack

3. **XSLT профайлер** (Дни 10-12)
   - `XSLTProfiler.ts` — профилирование
   - Измерение времени выполнения
   - Выявление узких мест
   - Оптимизация

4. **Оптимизация больших файлов** (Дни 13-17)
   - Web Workers для парсинга
   - Streaming обработка
   - Virtual scrolling
   - Ленивая загрузка
   - Pagination

**Результат:** Профессиональные функции для продвинутых пользователей

**Критические файлы:**

- `src/services/xml/XMLComparer.ts`
- `src/services/xslt/XSLTDebugger.tsx`
- `src/services/xslt/XSLTProfiler.ts`

---

### Этап 6: Полировка и оптимизация (Недели 17-18)

**Цель:** Production-ready приложение

**Задачи:**

1. **Оптимизация производительности**
   - Code splitting
   - Lazy loading
   - Tree shaking
   - Оптимизация бандла
   - Caching стратегия

2. **UI/UX улучшения**
   - Темы (светлая/тёмная)
   - Горячие клавиши
   - Настройки пользователя
   - Анимации
   - Accessibility

3. **Тестирование**
   - Unit тесты (80%+ покрытие)
   - Integration тесты
   - E2E тесты (Playwright)
   - Performance тесты

4. **Документация**
   - README
   - API документация
   - Пользовательское руководство
   - CONTRIBUTING.md

**Результат:** Готовое к продакшену приложение

---

## Структура проекта

```
xmlPreviewer/
├── public/
│   └── index.html
├── src/
│   ├── main.tsx                          # Точка входа
│   ├── App.tsx                           # Корневой компонент
│   │
│   ├── core/                             # Основные системы
│   │   ├── documentManager/              # Управление документами
│   │   ├── parserEngine/                 # Движок парсинга
│   │   ├── validatorEngine/              # Движок валидации
│   │   └── viewManager/                  # Управление представлениями
│   │
│   ├── views/                            # Компоненты представлений
│   │   ├── text/                         # Текстовые редакторы
│   │   ├── grid/                         # Табличные представления
│   │   ├── tree/                         # Древовидные представления
│   │   └── split/                        # Разделённые представления
│   │
│   ├── services/                         # Бизнес-логика
│   │   ├── xml/                          # XML операции
│   │   ├── xsd/                          # XSD операции
│   │   ├── xslt/                         # XSLT операции
│   │   ├── xpath/                        # XPath операции
│   │   └── xquery/                       # XQuery операции
│   │
│   ├── components/                       # Переиспользуемые компоненты
│   │   ├── layout/                       # Макет
│   │   ├── document/                     # Компоненты документов
│   │   ├── validation/                   # Компоненты валидации
│   │   └── common/                       # Общие компоненты
│   │
│   ├── hooks/                            # Custom React hooks
│   ├── stores/                           # Zustand stores
│   ├── types/                            # TypeScript типы
│   ├── utils/                            # Utility функции
│   └── styles/                           # Стили
│   └── __tests__/                        # Тесты
│
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

---

## Зависимости проекта

### Базовые зависимости (Этап 0)

```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "zustand": "^4.4.0",
    "@monaco-editor/react": "^4.6.0"
  }
}
```

### XML парсинг (Этап 1)

```json
{
  "dependencies": {
    "fast-xml-parser": "^4.2.5",
    "xmldom": "^0.6.0"
  }
}
```

### XSD поддержка (Этап 2)

```json
{
  "dependencies": {
    "xsdata": "^23.8.0",
    "xml-xsd-validator": "^0.6.0",
    "xmlschema": "^1.5.0"
  }
}
```

### Продвинутые представления (Этап 3)

```json
{
  "dependencies": {
    "ag-grid-react": "^31.0.0",
    "react-dnd": "^16.0.0",
    "fontoxpath": "^3.25.0"
  }
}
```

### Трансформации (Этап 4)

```json
{
  "dependencies": {
    "saxon-js": "^2.5.0",
    "xslt-processor": "^0.11.0"
  }
}
```

### Экспертные функции (Этап 5)

```json
{
  "dependencies": {
    "diff": "^5.1.0",
    "react-diff-viewer": "^3.1.1"
  }
}
```

---

## Критические файлы для начала

### 1. DocumentManager.tsx

**Путь:** `src/core/documentManager/DocumentManager.tsx`

**Назначение:** Центральная система управления всеми открытыми документами. Обеспечивает:

- Открытие/закрытие файлов
- Управление состоянием dirty/saved
- Координацию между представлениями
- Историю недавних файлов

**Зависимости:** Zustand store, File API

---

### 2. XMLParser.ts

**Путь:** `src/core/parserEngine/XMLParser.ts`

**Назначение:** Основной парсер XML. Обеспечивает:

- Парсинг XML в DOM/JSON
- Обработку ошибок
- Кеширование результатов
- Streaming для больших файлов

**Зависимости:** fast-xml-parser, xmldom

---

### 3. MonacoEditor.tsx

**Путь:** `src/views/text/MonacoEditor.tsx`

**Назначение:** Обёртка над Monaco Editor. Обеспечивает:

- Интеграцию Monaco в React
- Настройку тем и языков
- Управление состоянием редактора
- Обработку событий

**Зависимости:** @monaco-editor/react

---

### 4. XMLValidator.ts

**Путь:** `src/core/validatorEngine/XMLValidator.ts`

**Назначение:** Движок валидации XML. Обеспечивает:

- Синтаксическую проверку
- Валидацию против XSD
- Агрегацию ошибок
- Quick-fix предложения

**Зависимости:** xsdata, xml-xsd-validator

---

### 5. documentStore.ts

**Путь:** `src/stores/documentStore.ts`

**Назначение:** Zustand store для управления состоянием документов. Обеспечивает:

- Хранение списка документов
- Управление активным документом
- CRUD операции над документами
- Синхронизацию состояния

**Зависимости:** zustand

---

## Технические вызовы и решения

### Вызов 1: Большие файлы (100MB+)

**Решение:**

- Streaming парсинг (fast-xml-parser streaming mode)
- Web Workers для фоновой обработки
- Virtual scrolling для представлений
- Ленивая загрузка узлов дерева

### Вызов 2: Синхронизация представлений

**Решение:**

- Observer паттерн для изменений
- Debounce для предотвращения избыточных обновлений
- Уникальные ID для узлов
- Optimistic updates

### Вызов 3: Schema-aware автодополнение

**Решение:**

- Кеширование разобранных XSD
- Индексация элементов/атрибутов
- Контекстная генерация предложений
- Monaco Completion API

### Вызов 4: Производительность Grid View

**Решение:**

- AG-Grid с virtualization
- Infinite row model
- Web Workers для обработки данных
- Pagination

---

## Стратегия тестирования

### Unit тесты (80%+ покрытие)

- Parser/Validator логика
- Service функции
- Utility функции
- Custom hooks

### Component тесты (70%+ покрытие)

- Основные UI компоненты
- Взаимодействие пользователя
- События и state changes

### Integration тесты

- Управление документами
- View синхронизация
- End-to-end workflows

### E2E тесты (Playwright)

- Открытие и редактирование файлов
- Валидация
- Трансформации
- Полные пользовательские сценарии

---

## Метрики успеха

### Производительность

- Запуск приложения: < 3 сек
- Открытие файла (1MB): < 1 сек
- Валидация (1MB): < 2 сек
- Рендеринг Grid (1000 строк): < 100ms
- Использование памяти: < 500MB

### Качество

- Тестовое покрытие: > 75%
- TypeScript strict mode
- Zero ESLint warnings
- 95%+ Lighthouse score

---

## Порядок реализации

1. **Этап 0 (Неделя 1):** Setup проекта
2. **Этап 1 (Недели 2-4):** MVP - базовый XML редактор
3. **Этап 2 (Недели 5-7):** Поддержка XSD
4. **Этап 3 (Недели 8-10):** Продвинутые представления
5. **Этап 4 (Недели 11-13):** Трансформации
6. **Этап 5 (Недели 14-16):** Экспертные функции
7. **Этап 6 (Недели 17-18):** Полировка

**Общая оценка:** 18 недель (~4.5 месяца) для полного функционала

**MVP (Этапы 0-2):** 7 недель (~1.5 месяца)

---

## Верификация

### Тестирование MVP (Этапы 0-2)

1. **Открытие XML файла**
   - Запустить приложение
   - Выбрать File → Open
   - Выбрать XML файл
   - Проверить: файл открыт в текстовом редакторе с подсветкой

2. **Редактирование XML**
   - Изменить содержимое XML
   - Проверить: подсветка синтаксиса работает
   - Проверить: изменения сохраняются

3. **Валидация XML**
   - Внести ошибку в XML
   - Проверить: ошибка отображается в панели валидации
   - Исправить ошибку
   - Проверить: ошибка исчезла

4. **Дерево элементов**
   - Открыть XML файл
   - Переключиться на Tree View
   - Проверить: дерево отображается корректно
   - Раскрыть узел
   - Проверить: дочерние элементы отображаются

5. **XSD поддержка**
   - Открыть XSD файл
   - Проверить: подсветка синтаксиса XSD работает
   - Открыть XML файл
   - Прикрепить XSD
   - Проверить: валидация против XSD работает

6. **Генерация XSD**
   - Открыть XML файл
   - Выбрать Tools → Generate XSD
   - Проверить: XSD генерируется корректно
   - Сохранить XSD
   - Проверить: файл сохраняется

7. **Генерация XML из XSD**
   - Открыть XSD файл
   - Выбрать Tools → Generate XML
   - Проверить: XML генерируется корректно
   - Проверить: XML соответствует схеме

---

## Следующие шаги

1. Утвердить этот план
2. Начать с Этапа 0 (настройка проекта)
3. Создать репозиторий Git
4. Инициализировать проект Vite + React + TypeScript
5. Установить базовые зависимости
6. Создать структуру папок
7. Начать реализацию критических файлов в порядке:
   - DocumentStore → DocumentManager → XMLParser → MonacoEditor → XMLValidator
