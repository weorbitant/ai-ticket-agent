# ia-ticket-agent

CLI para consultar tickets de Jira usando lenguaje natural, apoyándose en un LLM local (llama.cpp) como intérprete.

## Requisitos

- Node.js >= 22.0.0
- llama.cpp server corriendo en local con API compatible OpenAI (por defecto en `http://localhost:8080`)
- Cuenta de Jira Cloud con API Token

### Configuración de llama.cpp

El proyecto usa LangChain con la API compatible OpenAI. Asegúrate de que llama.cpp server esté corriendo:

```bash
./llama-server -m tu-modelo.gguf --host 0.0.0.0 --port 8080
```

La API OpenAI-compatible estará disponible automáticamente en `/v1/chat/completions`.

## Instalación

```bash
npm install
```

## Configuración

1. Copia el archivo de ejemplo de variables de entorno:

```bash
cp .env.example .env
```

2. Edita `.env` con tus credenciales:

```bash
# Jira Cloud
JIRA_BASE_URL=https://tu-empresa.atlassian.net
JIRA_EMAIL=tu-email@empresa.com
JIRA_API_TOKEN=tu-api-token

# llama.cpp
LLAMA_BASE_URL=http://localhost:8080
```

3. Actualiza el diccionario en `data/dictionary.json` con tus proyectos, componentes y estados de Jira.

## Uso

```bash
# Consulta con lenguaje natural
npm start -- search "bugs abiertos de la plataforma del dato"

# Más ejemplos
npm start -- search "tareas en progreso del proyecto TRD"
npm start -- search "issues cerrados del componente Ingestion"

# Opciones disponibles
npm start -- search "bugs abiertos" --verbose  # Información detallada
npm start -- search "bugs abiertos" --jql      # Mostrar JQL generado
npm start -- search "bugs abiertos" -l 50      # Limitar resultados
```

## Desarrollo

```bash
# Tests
npm test
npm run test:watch    # Watch mode
npm run test:coverage # Con cobertura

# Lint
npm run lint

# Formateo
npm run format

# Build
npm run build
```

## Arquitectura

El proyecto usa **LangChain** con **Structured Output** para garantizar respuestas JSON válidas del LLM.

```
Usuario → CLI → Interpreter → LangChain (ChatOpenAI + Zod Schema)
                                  ↓
                              llama.cpp
                                  ↓
                           JSON Validado → JQL Builder → Jira API → Resultados
```

### Flujo:

1. El **CLI** recibe una consulta en lenguaje natural
2. El **Interpreter** usa LangChain para enviar la consulta al LLM
3. **LangChain Structured Output** garantiza que el LLM devuelva JSON válido según el schema Zod
4. El **JQL Builder** genera la query JQL de forma determinista
5. El **Jira Client** ejecuta la búsqueda
6. El **CLI** muestra los resultados formateados

El LLM **nunca ejecuta acciones directamente**, solo interpreta lenguaje natural y devuelve parámetros estructurados.

## Licencia

MIT

