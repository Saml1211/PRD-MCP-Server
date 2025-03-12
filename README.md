# PRD Creator MCP Server

A specialized Model Context Protocol (MCP) server dedicated to creating Product Requirements Documents. This MCP server enables AI systems connected to MCP clients to generate detailed, well-structured product requirement documents through a standardized protocol interface.

## Features

- **PRD Generator**: Create complete PRDs based on product descriptions, user stories, and requirements
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
git clone https://github.com/yourusername/prd-creator-mcp.git
cd prd-creator-mcp
```

2. Install dependencies:
```bash
npm install
```

3. Build the project:
```bash
npm run build
```

## Usage

### Running the server

Run the server using:

```bash
npm start
```

The server will run with STDIO transport by default, which makes it compatible with MCP clients.

### Adding to MCP client configuration

To use the PRD Creator MCP Server with an MCP client (like Claude Desktop or Cursor), add it to your MCP settings:

For Claude Desktop (on macOS), add to `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "prd-creator": {
      "command": "node",
      "args": ["/path/to/prd-creator-mcp/dist/index.js"],
      "disabled": false
    }
  }
}
```

### Available Tools

The server provides the following tools:

#### 1. `generate_prd`

Generate a complete PRD document from a template.

Parameters:
- `productName`: The name of the product
- `productDescription`: Description of the product
- `targetAudience`: Description of the target audience
- `coreFeatures`: Array of core feature descriptions
- `constraints` (optional): Array of constraints or limitations
- `templateName` (optional): Template name to use (defaults to "standard")

Example:
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
  "templateName": "comprehensive"
}
```

#### 2. `validate_prd`

Validate a PRD document against best practices.

Parameters:
- `prdContent`: The PRD content to validate
- `validationRules` (optional): Array of validation rule IDs to check

Example:
```javascript
{
  "prdContent": "# My Product\n\n## Introduction\n...",
  "validationRules": ["has-introduction", "minimum-length"]
}
```

#### 3. `list_validation_rules`

List all available validation rules.

### Available Resources

The server provides access to PRD templates through the following URI pattern:

- `prd://templates/{templateName}`

Available templates:
- `standard`: A basic PRD template with essential sections
- `comprehensive`: A detailed PRD template with expanded sections

## Development

### Project Structure

```
prd-creator-mcp/
├── src/
│   ├── config/            # Configuration management
│   ├── storage/           # Database and caching
│   ├── tools/             # Tool implementations
│   ├── resources/         # Resource implementations
│   ├── templates/         # Initial PRD templates
│   └── index.ts           # Main entry point
├── tests/                 # Test files
├── dist/                  # Compiled output
└── README.md              # Documentation
```

### Running Tests

```bash
npm test
```

## License

MIT

---

Developed by Sam Lyndon