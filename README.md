# AI Ticket Agent

CLI para gestionar tickets de Jira usando lenguaje natural, con arquitectura hexagonal y LLM local (llama.cpp) como intérprete.

## 🚀 Características

| Comando    | Descripción                                                                |
| ---------- | -------------------------------------------------------------------------- |
| `search`   | Buscar tickets con lenguaje natural (traduce a JQL)                        |
| `check`    | Evaluar calidad de tickets (componente, story points, descripción, título) |
| `estimate` | Estimar esfuerzo en puntos Fibonacci usando contexto de repositorio GitHub |

## 📋 Requisitos

- **Node.js** >= 22.0.0
- **llama.cpp** server corriendo localmente con API compatible OpenAI (por defecto en `http://localhost:8080`)
- **Jira Cloud** con API Token

### Configuración de llama.cpp

El proyecto usa LangChain con la API compatible OpenAI. Asegúrate de que llama.cpp server esté corriendo:

```bash
./llama-server -m tu-modelo.gguf --host 0.0.0.0 --port 8080
```

La API OpenAI-compatible estará disponible automáticamente en `/v1/chat/completions`.

## 🛠️ Instalación

```bash
# Clonar repositorio
git clone <repository-url>
cd ai-ticket-agent

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
```

## ⚙️ Configuración

### 1. Variables de Entorno

Edita `.env` con tus credenciales:

```bash
# Jira Cloud (requerido)
JIRA_BASE_URL=https://tu-empresa.atlassian.net
JIRA_EMAIL=tu-email@empresa.com
JIRA_API_TOKEN=tu-api-token

# llama.cpp (requerido)
LLAMA_BASE_URL=http://localhost:8080

# GitHub (opcional, para repos privados)
GITHUB_TOKEN=ghp_xxxx
```

### 2. Diccionario de Jira

Actualiza `data/dictionary.json` con tus proyectos, componentes y estados de Jira:

```json
{
  "projects": [
    {
      "key": "TRD",
      "name": "Transformación digital",
      "aliases": ["plataforma del dato", "pgi", "CRM"]
    }
  ],
  "issueTypes": [
    {
      "name": "Bug",
      "aliases": ["bug", "error", "problema"]
    }
  ],
  "statuses": [
    {
      "name": "Open",
      "aliases": ["abierto", "nuevo"]
    }
  ],
  "components": [
    {
      "name": "API",
      "description": "APIs y servicios",
      "aliases": ["api", "servicios"]
    }
  ]
}
```

### 3. Fuentes de GitHub (opcional)

Configura `data/github-sources.json` para estimación con contexto:

```json
{
  "sources": [
    {
      "owner": "org-name",
      "repo": "repo-name",
      "files": ["README.md", "docs/architecture.md"],
      "ref": "main"
    }
  ]
}
```

## 🎯 Uso

### Búsqueda de Tickets

```bash
# Búsqueda básica
npm start -- search "bugs abiertos de la plataforma del dato"

# Más ejemplos
npm start -- search "tareas en progreso del proyecto TRD"
npm start -- search "issues cerrados del componente Ingestion"

# Opciones disponibles
npm start -- search "bugs abiertos" --verbose  # Información detallada
npm start -- search "bugs abiertos" --jql      # Mostrar JQL generado
npm start -- search "bugs abiertos" -l 50      # Limitar resultados
```

### Evaluación de Calidad

```bash
# Evaluar calidad de un ticket
npm start -- check TRD-123

# Opciones
npm start -- check TRD-123 --verbose  # Información detallada
```

### Estimación de Esfuerzo

```bash
# Estimar esfuerzo con contexto de GitHub
npm start -- estimate TRD-456

# Opciones
npm start -- estimate TRD-456 --verbose  # Información detallada
```

## 🏗️ Arquitectura

El proyecto sigue **Arquitectura Hexagonal** (Ports & Adapters) para desacoplar la lógica de negocio de la infraestructura.

### Principios

1. **Dominio en el centro**: La lógica de negocio no depende de frameworks, bases de datos o APIs externas.
2. **Dependencias hacia adentro**: Los adaptadores dependen de los puertos, nunca al revés.
3. **Puertos como contratos**: Interfaces que definen cómo el dominio interactúa con el exterior.
4. **Adaptadores intercambiables**: Implementaciones concretas que pueden sustituirse sin afectar el dominio.

### Estructura de Directorios

```
src/
├── domain/                    # Núcleo de la aplicación (sin dependencias externas)
│   ├── models/               # Entidades y objetos de valor
│   ├── ports/                # Interfaces (contratos)
│   │   ├── input/            # Puertos primarios (casos de uso)
│   │   └── output/           # Puertos secundarios (controlados)
│   └── services/             # Lógica de negocio (implementa puertos de entrada)
│
├── adapters/                  # Implementaciones de puertos
│   ├── primary/              # Adaptadores de entrada (controladores)
│   │   └── cli/              # Comandos CLI con Commander.js
│   └── secondary/            # Adaptadores de salida (controlados)
│       ├── jira/             # Implementa TicketRepositoryPort
│       ├── llm/              # Implementa LLMInterpreterPort
│       ├── github/           # Implementa CodeContextProviderPort
│       └── filesystem/       # Implementa DictionaryProviderPort
│
└── config/                    # Configuración y composición de dependencias
```

### Flujo de Arquitectura

**1. search** - Búsqueda con lenguaje natural

```
CLI Adapter → SearchTicketsPort → SearchService
                                         |
                    +--------------------+--------------------+
                    |                                         |
                    v                                         v
         LLMInterpreterPort                          TicketRepositoryPort
                    |                                         |
                    v                                         v
         LangChain Adapter                              Jira Adapter
```

**2. check** - Evaluación de calidad

```
CLI Adapter → CheckTicketQualityPort → QualityCheckerService
                                               |
                          +-------------------+-------------------+
                          |                                       |
                          v                                       v
               TicketRepositoryPort                    LLMInterpreterPort
                          |                                       |
                          v                                       v
                    Jira Adapter                         LangChain Adapter
```

**3. estimate** - Estimación de esfuerzo

```
CLI Adapter → EstimateEffortPort → EstimatorService
                                           |
                   +-----------------------+-----------------------+
                   |                       |                       |
                   v                       v                       v
        TicketRepositoryPort    CodeContextProviderPort    LLMInterpreterPort
                   |                       |                       |
                   v                       v                       v
             Jira Adapter           GitHub Adapter         LangChain Adapter
```

### Principio Fundamental

El LLM **actúa exclusivamente como intérprete de lenguaje natural** - nunca ejecuta acciones directamente contra Jira o GitHub. Solo transforma consultas en parámetros estructurados que la aplicación usa de forma determinista.

## 🧪 Desarrollo

### Tests

```bash
npm test              # Ejecutar tests
npm run test:watch    # Modo watch
npm run test:coverage # Con cobertura
```

### Linting y Formateo

```bash
npm run lint          # Verificar linting
npm run lint:fix      # Auto-corregir
npm run format        # Formatear con Prettier
npm run format:check  # Verificar formato
```

### Build

```bash
npm run build         # Compilar a dist/
npm run dev           # Modo desarrollo con tsx watch
```

## 🔧 Stack Tecnológico

| Tecnología | Versión           | Propósito                                 |
| ---------- | ----------------- | ----------------------------------------- |
| Node.js    | >= 22             | Runtime                                   |
| TypeScript | 5.7               | Lenguaje principal                        |
| ESM        | -                 | Sistema de módulos                        |
| LangChain  | @langchain/openai | Integración LLM via API OpenAI-compatible |
| Zod        | 3.x               | Validación de schemas y tipos             |
| Axios      | 1.x               | Cliente HTTP para Jira y GitHub           |
| Commander  | 12.x              | Framework CLI                             |
| Jest       | 30.x              | Testing con ts-jest para ESM              |
| ESLint     | 9.x               | Linting con flat config                   |
| Prettier   | 3.x               | Formateo de código                        |

## 📄 Licencia

MIT

---

## 🤝 Contribuir

1. Fork del repositorio
2. Crear feature branch (`git checkout -b feature/amazing-feature`)
3. Commit de cambios (`git commit -m 'Add amazing feature'`)
4. Push a la branch (`git push origin feature/amazing-feature`)
5. Abrir Pull Request

## 📝 Notas

- El proyecto está diseñado para ser extensible mediante la arquitectura hexagonal
- Los adaptadores pueden intercambiarse fácilmente (ej. cambiar de llama.cpp a OpenAI)
- La validación con Zod garantiza robustez en las respuestas del LLM
- Los tests están diseñados para mockear puertos, facilitando el testing unitario
