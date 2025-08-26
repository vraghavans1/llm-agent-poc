# Contributing to LLM Agent POC

## Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/llm-agent-poc.git
   cd llm-agent-poc
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open in browser**
   Navigate to `http://localhost:5000`

## Project Structure

```
llm-agent-poc/
├── index.html          # Main HTML file
├── agent.js           # Core agent logic
├── server/            # Express server (minimal)
│   ├── index.ts       # Server entry point
│   └── routes.ts      # API routes
├── package.json       # Dependencies
└── README.md         # Documentation
```

## Adding New Tools

1. **Define the tool schema** in `agent.js`:
   ```javascript
   {
     type: "function",
     function: {
       name: "your_tool_name",
       description: "What your tool does",
       parameters: {
         type: "object",
         properties: {
           // Define parameters here
         },
         required: ["param1"]
       }
     }
   }
   ```

2. **Implement the tool function**:
   ```javascript
   async executeYourTool(args) {
     // Your implementation here
     return {
       success: true,
       result: "tool output"
     };
   }
   ```

3. **Add to tool call handler**:
   ```javascript
   case 'your_tool_name':
     result = await this.executeYourTool(args);
     break;
   ```

## Code Style Guidelines

- Use modern JavaScript ES6+ features
- Keep functions focused and single-purpose
- Add comments for complex logic
- Use meaningful variable names
- Handle errors gracefully

## Testing

Test the application by:

1. **Basic functionality**: Verify chat interface works
2. **Tool integration**: Test each tool individually
3. **Error handling**: Try invalid inputs
4. **UI responsiveness**: Test on different screen sizes

## Submitting Changes

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request with clear description

## Issues and Bug Reports

When reporting issues, please include:

- Browser version and OS
- Steps to reproduce
- Expected vs actual behavior
- Console error messages (if any)
- Screenshots (if relevant)

## Security

- Never commit API keys or secrets
- Use environment variables for sensitive data
- Follow secure coding practices
- Report security issues privately

## License

This project is licensed under the MIT License. See LICENSE file for details.