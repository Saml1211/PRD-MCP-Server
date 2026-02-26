# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added
- **feat(providers)**: Implement Google Gemini provider using `@google/generative-ai` SDK (default model: `gemini-2.5-flash`)

### Fixed
- **fix(tools)**: Connect 3 orphan tools (`render_template`, `health_check`, `get_logs`) to the CallTool handler — previously returned "Unknown tool" to clients
- **fix(tools)**: Populate `ListToolsRequestSchema` handler with all 21 tool definitions — previously returned an empty array, making MCP clients unable to discover any tools
- **fix(providers)**: Standardize OpenAI and Gemini constructors to no longer throw on missing API key — providers now appear in `list_ai_providers` with `available: false` instead of silently disappearing from the listing
- **fix(server)**: Align server version to `0.1.1` (was `0.1.0`, mismatched with `package.json`)
- **fix(server)**: Replace unavailable `HttpServerTransport` import with STDIO fallback in `src/index.ts`

### Changed
- **refactor(tools)**: Move `ListToolsRequestSchema` handler from `src/index.ts` into `src/tools/index.ts` to centralize all tool registration in a single module

### Documentation
- **docs(env)**: Add `MCP_TRANSPORT` and `PORT` to `.env.example` with usage comments
- **docs(env)**: Update default Gemini model from `gemini-pro` to `gemini-2.5-flash` in `.env.example`
- **docs(readme)**: Update `list_ai_providers` example to reflect realistic output (all 5 providers always listed, availability based on configured API keys)
- **docs(readme)**: Add Gemini Docker example and supported providers list to Quick Start
- Initial documentation updates (README, CONTRIBUTING, CHANGELOG creation)
