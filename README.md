# PRD Creator MCP Server

[![Build Status](https://github.com/Saml1211/prd-mcp-server/actions/workflows/ci.yml/badge.svg)](https://github.com/Saml1211/prd-mcp-server/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/prd-creator-mcp)](https://www.npmjs.com/package/prd-creator-mcp)
[![License: MIT](https://img.shields.io/github/license/Saml1211/prd-mcp-server)](https://github.com/Saml1211/prd-mcp-server/blob/main/LICENSE)
[![GitHub issues](https://img.shields.io/github/issues/Saml1211/prd-mcp-server)](https://github.com/Saml1211/prd-mcp-server/issues)

A specialized Model Context Protocol (MCP) server dedicated to creating Product Requirements Documents. This MCP server enables AI systems connected to MCP clients to generate detailed, well-structured product requirement documents through a standardized protocol interface.

---

<!-- TOC -->
- [Quick Start](#quick-start)
- [Features](#features)
- [Installation](#installation)
- [API Reference](#api-reference)
- [Provider Configuration](#provider-configuration--hot-reload)
- [Integrations](#integrations)
- [CLI Usage](#cli-usage)
- [Docker](#docker)
- [Contributing](#contributing)
- [Changelog](#changelog)
- [Appendix](#appendix)
<!-- TOC -->

## Quick Start

**Via NPX (recommended):**
```sh
npx -y prd-creator-mcp
```

**Via Docker:**
```sh
docker pull saml1211/prd-creator-mcp
docker run -i --rm saml1211/prd-creator-mcp
```

**Configure Providers:**
- Copy `.env.example` to `.env` and set your API keys and preferred models.
- Supported providers: **OpenAI** (`OPENAI_API_KEY`), **Google Gemini** (`GEMINI_API_KEY`), **Anthropic** (`ANTHROPIC_API_KEY`), and **local models**.
- Optionally, update provider credentials at runtime using the `update_provider_config` MCP tool.

**Get Help:**
```sh
npx prd-creator-mcp --help
```

## Features

- **PRD Generator**: Create complete PRDs based on product descriptions, user stories, and requirements
- **AI-Driven Generation**: Generate high-quality PRDs using multiple AI providers
- **Multi-Provider Support**: Choose from OpenAI, Google Gemini, Anthropic Claude, or local models
- **Provider Configuration**: Customize provider options for each PRD generation
- **Fallback Mechanism**: Gracefully falls back to template-based generation when AI is unavailable
- **PRD Validator**: Validate PRD completeness against industry standards and customizable rule sets
- **Template Resources**: Access a library of PRD templates for different product types
- **MCP Protocol Support**: Implements the Model Context Protocol for seamless integration with MCP clients

## Installation

### Prerequisites

- Node.js v16 or higher
- npm or yarn

### Install from source

1. Clone the repository:
```bash
git clone https://github.com/Saml1211/prd-mcp-server.git
cd prd-mcp-server
```

2. Install dependencies:
```bash
npm install
```

3. Build the project:
```bash
npm run build
```

4. Run locally:
```bash
npm start
```

5. For development with hot reload:
```bash
npm run dev
```

## API Reference

The PRD Creator MCP Server provides the following tools:

### `generate_prd`

Generate a complete PRD document using AI or template-based generation.

**Parameters:**
- `productName`: The name of the product
- `productDescription`: Description of the product
- `targetAudience`: Description of the target audience
- `coreFeatures`: Array of core feature descriptions
- `constraints` (optional): Array of constraints or limitations
- `templateName` (optional): Template name to use (defaults to "standard")
- `providerId` (optional): Specific AI provider to use (openai, anthropic, gemini, local, template)
- `additionalContext` (optional): Additional context or instructions for the AI provider
- `providerOptions` (optional): Provider-specific options like temperature, maxTokens, etc.

**Example:**
```javascript
{
  "productName": "TaskMaster Pro",
  "productDescription": "A task management application that helps users organize and prioritize their work efficiently.",
  "targetAudience": "Busy professionals and teams who need to manage multiple projects and deadlines.",
  "coreFeatures": [
    "Task creation and management",
    "Priority setting",
    "Due date tracking",
    "Team collaboration"
  ],
  "constraints": [
    "Must work offline",
    "Must support mobile and desktop platforms"
  ],
  "templateName": "comprehensive",
  "providerId": "openai",
  "additionalContext": "Focus on enterprise features and security",
  "providerOptions": {
    "temperature": 0.5,
    "maxTokens": 4000
  }
}
```

### `validate_prd`

Validate a PRD document against best practices.

**Parameters:**
- `prdContent`: The PRD content to validate
- `validationRules` (optional): Array of validation rule IDs to check

**Example:**
```javascript
{
  "prdContent": "# My Product\n\n## Introduction\n...",
  "validationRules": ["has-introduction", "minimum-length"]
}
```

### `list_validation_rules`

List all available validation rules.

### `list_ai_providers`

List all available AI providers and their availability status.

**Example response:**
```json
[
  {
    "id": "openai",
    "name": "OpenAI",
    "available": false
  },
  {
    "id": "gemini",
    "name": "Google Gemini",
    "available": true
  },
  {
    "id": "anthropic",
    "name": "Anthropic Claude",
    "available": false
  },
  {
    "id": "local",
    "name": "Local Model",
    "available": false
  },
  {
    "id": "template",
    "name": "Template-based (No AI)",
    "available": true
  }
]
```

> **Note:** Availability depends on configured API keys. This example shows a setup with only `GEMINI_API_KEY` configured.

### Template Management

The server provides additional tools for template management:

- `create_template`: Create a new PRD template
- `list_templates`: List all available templates
- `get_template`: Get a specific template
- `update_template`: Update an existing template
- `delete_template`: Delete a template
- `export_templates`: Export templates to JSON
- `import_templates`: Import templates from JSON
- `render_template`: Render a template with placeholders

### System Management

- `get_provider_config`: Get current provider configuration
- `update_provider_config`: Update provider configuration
- `health_check`: Check system health and provider availability
- `get_logs`: Get recent system logs
- `stats`: Get usage statistics

## Provider Configuration & Hot Reload

### Configuring AI Providers

You can configure provider credentials and models in two ways:
- **.env file:** Place a `.env` file in your project or working directory. Use `.env.example` as a template. All standard AI provider variables (e.g., `OPENAI_API_KEY`, `OPENAI_MODEL`, `GEMINI_API_KEY`, `GEMINI_MODEL`, etc.) are supported.
- **Live protocol tools:** Update provider configuration at runtime using the `update_provider_config` tool via your MCP client. These changes are persisted and take effect immediately—no server restart required.

The server will always merge persistent config (from protocol tools) with environment variables, giving precedence to protocol/tool updates.

### Hot Reload & Automation

When you update provider settings using either method, changes take effect instantly for all new requests. This enables:
- Seamless automation and scripting via MCP tool interfaces
- Hassle-free credential rotation and model switching
- Dynamic environment support for CI/CD and cloud deployments

## Integrations

### Claude Desktop

Add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "prd-creator": {
      "command": "npx",
      "args": ["-y", "prd-creator-mcp"]
    }
  }
}
```

### Glama.ai

Available at: https://glama.ai/mcp/servers/@Saml1211/PRD-MCP-Server

### Cursor

Add to your Cursor MCP client configuration:

```json
{
  "mcpServers": {
    "prd-creator": {
      "command": "npx",
      "args": ["-y", "prd-creator-mcp"]
    }
  }
}
```

### Roo Code

Add to `.roo/mcp.json`:

```json
{
  "mcpServers": {
    "prd-creator-mcp": {
      "command": "npx",
      "args": ["-y", "prd-creator-mcp"]
    }
  }
}
```

### Cline

Reference `prd-creator-mcp` in your MCP workflow definitions.

## CLI Usage

### Install Globally (optional)

You may also install the MCP server globally to expose the CLI:

```bash
npm install -g prd-creator-mcp
```

Then run:

```bash
prd-creator-mcp
```

### Command Reference

- `prd-creator-mcp`
  Runs the MCP server (STDIO transport).
  Use directly via npx or as a globally installed CLI for integration with MCP clients and tools.

### Uninstall

To remove the global CLI:

```bash
npm uninstall -g prd-creator-mcp
```

### CLI Options

View available command line options:

```bash
npx prd-creator-mcp --help
```

## Docker

### Building the Docker image

```bash
docker build -t prd-creator-mcp .
```

### Running with Docker

```bash
docker run -i --rm prd-creator-mcp
```

### With environment variables

```bash
docker run -i --rm -e OPENAI_API_KEY=your_key_here prd-creator-mcp
```

### With Gemini provider

```bash
docker run -i --rm -e GEMINI_API_KEY=your_key_here -e DEFAULT_AI_PROVIDER=gemini prd-creator-mcp
```

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) and [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) before submitting issues or pull requests.

## Changelog

All notable changes to this project are documented in [CHANGELOG.md](CHANGELOG.md).

## Appendix

### Useful Links

- [GitHub Repository](https://github.com/Saml1211/prd-mcp-server)
- [Model Context Protocol](https://modelcontextprotocol.io/) - Official MCP specification
- [MCP Inspector](https://modelcontextprotocol.io/docs/tools/inspector) - Testing and debugging tool for MCP servers
- [NPM Package](https://www.npmjs.com/package/prd-creator-mcp) - Published npm package