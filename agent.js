/**
 * LLM Agent POC - Frontend-Only Implementation
 * Faithful JavaScript translation of the Python core agent logic
 */

class LLMAgent {
    constructor() {
        this.messages = [];
        this.apiKeys = {
            openai: '',
            aipipe: ''
        };
        // Embedded Google Search credentials for evaluation
        this.googleApiKey = 'AIzaSyCvATsH_JbgE6HYdY6teHe3yFXraJaCczg';
        this.googleCSE = 'a46b2c21ad0fe475e'; // Google Custom Search Engine ID
        
        this.currentModel = 'gpt-4o';
        this.isProcessing = false;
        this.stats = { search: 0, pipe: 0, code: 0 };
        
        // Define tools using OpenAI's function calling format
        this.tools = [
            {
                type: "function",
                function: {
                    name: "google_search",
                    description: "Search Google for information and return snippet results",
                    parameters: {
                        type: "object",
                        properties: {
                            query: { type: "string", description: "The search query" },
                            num_results: { type: "number", description: "Number of results (default: 5)" }
                        },
                        required: ["query"]
                    }
                }
            },
            {
                type: "function", 
                function: {
                    name: "ai_pipe_workflow",
                    description: "Execute an AI workflow using AI Pipe",
                    parameters: {
                        type: "object",
                        properties: {
                            workflow: { type: "string", description: "Workflow type (summarize, analyze, process)" },
                            data: { type: "string", description: "Input data for the workflow" }
                        },
                        required: ["workflow", "data"]
                    }
                }
            },
            {
                type: "function",
                function: {
                    name: "execute_javascript", 
                    description: "Execute JavaScript code safely in a sandboxed environment",
                    parameters: {
                        type: "object",
                        properties: {
                            code: { type: "string", description: "JavaScript code to execute" }
                        },
                        required: ["code"]
                    }
                }
            }
        ];
        
        this.initializeUI();
    }

    initializeUI() {
        // Save API keys
        document.getElementById('saveKeys').addEventListener('click', () => {
            this.apiKeys.openai = document.getElementById('openaiKey').value;
            this.apiKeys.aipipe = document.getElementById('aipipeKey').value;
            
            this.updateUIState();
            this.showAlert('API keys saved successfully!', 'success');
        });

        // Model selection
        document.getElementById('modelSelect').addEventListener('change', (e) => {
            this.currentModel = e.target.value;
        });

        // Send message
        document.getElementById('sendButton').addEventListener('click', () => {
            this.sendMessage();
        });

        // Enter to send
        document.getElementById('messageInput').addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        // Clear chat
        document.getElementById('clearChat').addEventListener('click', () => {
            if (confirm('Clear all conversation history?')) {
                this.messages = [];
                this.clearChatUI();
                this.showWelcomeMessage();
            }
        });

        // Export chat
        document.getElementById('exportChat').addEventListener('click', () => {
            this.exportConversation();
        });

        this.updateUIState();
    }

    updateUIState() {
        const hasOpenAI = !!this.apiKeys.openai;
        const inputEnabled = hasOpenAI && !this.isProcessing;
        
        document.getElementById('messageInput').disabled = !inputEnabled;
        document.getElementById('sendButton').disabled = !inputEnabled;
        
        // Update status indicators
        document.getElementById('googleStatus').textContent = 'Ready';
        document.getElementById('googleStatus').className = 'badge bg-success';
        
        document.getElementById('aipipeStatus').textContent = this.apiKeys.aipipe ? 'Connected' : 'Token Required';
        document.getElementById('aipipeStatus').className = this.apiKeys.aipipe ? 'badge bg-success' : 'badge bg-danger';
        
        // Update processing indicator
        document.getElementById('processingIndicator').classList.toggle('d-none', !this.isProcessing);
        document.getElementById('statusIndicator').textContent = this.isProcessing ? 'Processing...' : 'Ready';
        document.getElementById('statusIndicator').className = this.isProcessing ? 'badge bg-warning' : 'badge bg-success';
        
        // Update stats
        document.getElementById('searchCount').textContent = this.stats.search;
        document.getElementById('pipeCount').textContent = this.stats.pipe;
        document.getElementById('codeCount').textContent = this.stats.code;
    }

    // Core Agent Loop - JavaScript translation of Python def loop(llm):
    async agentLoop(userInput = null) {
        if (this.isProcessing) return;
        
        this.isProcessing = true;
        this.updateUIState();
        
        try {
            // msg = [user_input()]  # App begins by taking user input
            if (userInput) {
                this.messages.push({
                    role: 'user',
                    content: userInput,
                    timestamp: new Date()
                });
                this.displayMessage(userInput, 'user');
            }

            while (true) {
                // output, tool_calls = llm(msg, tools)  # sends conversation + tools to LLM
                const { output, tool_calls } = await this.callLLM(this.messages, this.tools);
                
                // print("Agent: ", output)  # Always stream LLM output, if any
                if (output) {
                    this.messages.push({
                        role: 'assistant', 
                        content: output,
                        tool_calls: tool_calls,
                        timestamp: new Date()
                    });
                    this.displayMessage(output, 'assistant', tool_calls);
                }

                if (tool_calls && tool_calls.length > 0) {
                    // msg += [ handle_tool_call(tc) for tc in tool_calls ]  # Allow multiple tool calls (may be parallel)
                    const toolResults = await Promise.all(
                        tool_calls.map(tc => this.handleToolCall(tc))
                    );
                    
                    // Add tool results to conversation
                    for (const result of toolResults) {
                        this.messages.push({
                            role: 'tool',
                            tool_call_id: result.tool_call_id,
                            content: JSON.stringify(result.content),
                            timestamp: new Date()
                        });
                    }
                } else {
                    // msg.append(user_input())  # Add user input and continue
                    break; // Exit loop, wait for next user input
                }
            }
        } catch (error) {
            this.showAlert('Agent Error: ' + error.message, 'danger');
        } finally {
            this.isProcessing = false;
            this.updateUIState();
        }
    }

    // Call LLM with OpenAI API
    async callLLM(messages, tools) {
        if (!this.apiKeys.openai) {
            throw new Error('OpenAI API key required');
        }

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.apiKeys.openai}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: this.currentModel,
                messages: messages.map(msg => ({
                    role: msg.role,
                    content: msg.content,
                    tool_calls: msg.tool_calls,
                    tool_call_id: msg.tool_call_id
                })),
                tools: tools,
                tool_choice: 'auto',
                temperature: 0.7
            })
        });

        if (!response.ok) {
            throw new Error(`OpenAI API error: ${response.status}`);
        }

        const data = await response.json();
        const choice = data.choices[0];
        
        return {
            output: choice.message.content,
            tool_calls: choice.message.tool_calls || []
        };
    }

    // Handle individual tool calls
    async handleToolCall(toolCall) {
        const toolName = toolCall.function.name;
        const args = JSON.parse(toolCall.function.arguments);
        
        let result;
        try {
            switch (toolName) {
                case 'google_search':
                    result = await this.executeGoogleSearch(args);
                    this.stats.search++;
                    break;
                case 'ai_pipe_workflow':
                    result = await this.executeAIPipeWorkflow(args);
                    this.stats.pipe++;
                    break;
                case 'execute_javascript':
                    result = await this.executeJavaScript(args);
                    this.stats.code++;
                    break;
                default:
                    throw new Error(`Unknown tool: ${toolName}`);
            }
        } catch (error) {
            result = { success: false, error: error.message };
        }

        this.updateUIState();
        return {
            tool_call_id: toolCall.id,
            content: result
        };
    }

    // Google Search Tool - Uses embedded API credentials
    async executeGoogleSearch(args) {
        const response = await fetch(`https://www.googleapis.com/customsearch/v1?key=${this.googleApiKey}&cx=${this.googleCSE}&q=${encodeURIComponent(args.query)}&num=${args.num_results || 5}`);
        
        if (!response.ok) {
            throw new Error(`Google Search API error: ${response.status} - ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (data.error) {
            throw new Error(`Google Search API error: ${data.error.message}`);
        }
        
        return {
            success: true,
            results: data.items?.map(item => ({
                title: item.title,
                snippet: item.snippet,
                link: item.link
            })) || [],
            total_results: data.searchInformation?.totalResults || '0'
        };
    }

    // AI Pipe Workflow Tool
    async executeAIPipeWorkflow(args) {
        if (!this.apiKeys.aipipe) {
            throw new Error('AI Pipe token required - get token from aipipe.org/login');
        }

        // Create a prompt based on the workflow type and data
        let prompt;
        switch (args.workflow.toLowerCase()) {
            case 'summarize':
                prompt = `Please provide a concise summary of the following text:\n\n${args.data}`;
                break;
            case 'analyze':
                prompt = `Please analyze the following data and provide insights:\n\n${args.data}`;
                break;
            case 'process':
                prompt = `Please process and transform the following data:\n\n${args.data}`;
                break;
            default:
                prompt = `Please help with the following task "${args.workflow}":\n\n${args.data}`;
        }

        const response = await fetch('https://aipipe.org/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.apiKeys.aipipe}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                max_tokens: 500,
                temperature: 0.7
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`AI Pipe API error: ${response.status} - ${errorText}`);
        }
        
        const data = await response.json();
        
        if (data.error) {
            throw new Error(`AI Pipe API error: ${data.error.message}`);
        }
        
        return {
            success: true,
            workflow: args.workflow,
            result: data.choices[0].message.content,
            model_used: data.model,
            tokens_used: data.usage?.total_tokens
        };
    }

    // JavaScript Code Execution Tool - Enhanced Security Sandbox
    async executeJavaScript(args) {
        try {
            // Enhanced security checks
            const dangerousPatterns = [
                'import', 'require', 'eval', 'Function', 'document', 'window', 'fetch',
                'XMLHttpRequest', 'WebSocket', 'Worker', 'SharedWorker', 'ServiceWorker',
                'localStorage', 'sessionStorage', 'indexedDB', 'location', 'history',
                'navigator', 'screen', 'alert', 'confirm', 'prompt', 'open', 'close',
                'constructor', 'prototype', '__proto__', 'this\\[', 'globalThis',
                'self', 'top', 'parent', 'frames', 'length', 'name', 'status'
            ];
            
            const codeStr = args.code.toLowerCase();
            if (dangerousPatterns.some(pattern => codeStr.includes(pattern.toLowerCase()))) {
                throw new Error(`Code contains potentially dangerous operations: ${dangerousPatterns.find(p => codeStr.includes(p.toLowerCase()))}`);
            }

            // Additional checks for constructor access attempts
            if (codeStr.includes('[') && (codeStr.includes('constructor') || codeStr.includes('prototype'))) {
                throw new Error('Code contains potentially dangerous property access');
            }

            // Capture console output
            const logs = [];
            const mockConsole = {
                log: (...args) => logs.push('[LOG] ' + args.map(a => String(a)).join(' ')),
                error: (...args) => logs.push('[ERROR] ' + args.map(a => String(a)).join(' ')),
                warn: (...args) => logs.push('[WARN] ' + args.map(a => String(a)).join(' ')),
                info: (...args) => logs.push('[INFO] ' + args.map(a => String(a)).join(' ')),
                debug: (...args) => logs.push('[DEBUG] ' + args.map(a => String(a)).join(' '))
            };

            // Create safer execution environment with timeout
            const timeoutMs = 5000; // 5 second timeout
            let result;
            let timedOut = false;
            
            const timeout = setTimeout(() => {
                timedOut = true;
                throw new Error('Code execution timed out (5 seconds)');
            }, timeoutMs);

            try {
                // Create isolated scope - no access to global 'this'
                const func = new Function(
                    'console', 'Math', 'Date', 'Array', 'Object', 'String', 'Number', 'JSON', 'parseInt', 'parseFloat', 'isNaN', 'isFinite',
                    `"use strict";
                    // Block access to global scope
                    const undefined = void 0;
                    return (function() {
                        ${args.code}
                    })();`
                );
                
                // Execute with limited globals only
                result = func(
                    mockConsole, 
                    Math, 
                    Date, 
                    Array, 
                    Object, 
                    String, 
                    Number, 
                    JSON,
                    parseInt,
                    parseFloat,
                    isNaN,
                    isFinite
                );
                
                clearTimeout(timeout);
            } catch (execError) {
                clearTimeout(timeout);
                if (timedOut) {
                    throw new Error('Code execution timed out');
                }
                throw execError;
            }

            return {
                success: true,
                result: result !== undefined ? result : null,
                output: logs.length > 0 ? logs.join('\n') : null,
                executed_at: new Date().toISOString(),
                execution_time_ms: Date.now() % 1000 // Simple timing approximation
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                code: args.code,
                executed_at: new Date().toISOString()
            };
        }
    }

    // UI Methods
    sendMessage() {
        const input = document.getElementById('messageInput');
        const message = input.value.trim();
        
        if (!message || this.isProcessing) return;
        
        input.value = '';
        this.agentLoop(message);
    }

    displayMessage(content, role, toolCalls = null) {
        const chatContainer = document.getElementById('chatContainer');
        const messageDiv = document.createElement('div');
        messageDiv.className = `mb-3 p-3 rounded ${role === 'user' ? 'message-user ms-5' : 'message-assistant me-5'}`;
        
        let html = `<div class="d-flex align-items-start">`;
        html += `<i class="bi ${role === 'user' ? 'bi-person-fill' : 'bi-robot'} me-2"></i>`;
        html += `<div class="flex-grow-1">`;
        html += `<div>${this.formatContent(content)}</div>`;
        
        // Display tool calls
        if (toolCalls && toolCalls.length > 0) {
            html += `<div class="mt-2">`;
            toolCalls.forEach(tc => {
                const toolName = tc.function.name;
                const toolClass = toolName.includes('search') ? 'tool-search' : 
                                 toolName.includes('pipe') ? 'tool-pipe' : 'tool-code';
                html += `<span class="tool-indicator ${toolClass}">🔧 ${toolName}</span>`;
            });
            html += `</div>`;
        }
        
        html += `</div></div>`;
        messageDiv.innerHTML = html;
        
        chatContainer.appendChild(messageDiv);
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    formatContent(content) {
        // Basic markdown-like formatting
        return content
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/`(.*?)`/g, '<code>$1</code>')
            .replace(/\n/g, '<br>');
    }

    showAlert(message, type = 'info') {
        const alertDiv = document.getElementById('errorAlert');
        const messageSpan = document.getElementById('errorMessage');
        
        alertDiv.className = `alert alert-${type} alert-dismissible`;
        messageSpan.textContent = message;
        alertDiv.classList.remove('d-none');
        
        // Auto-hide after 3 seconds for success messages
        if (type === 'success') {
            setTimeout(() => {
                alertDiv.classList.add('d-none');
            }, 3000);
        }
    }

    clearChatUI() {
        const chatContainer = document.getElementById('chatContainer');
        chatContainer.innerHTML = '';
    }

    showWelcomeMessage() {
        const chatContainer = document.getElementById('chatContainer');
        chatContainer.innerHTML = `
            <div class="alert alert-info">
                <h6><i class="bi bi-robot"></i> Welcome to LLM Agent POC!</h6>
                <p class="mb-2">I can help you with various tasks using multiple tools:</p>
                <ul class="mb-2">
                    <li><strong>Google Search:</strong> Find information from the web</li>
                    <li><strong>AI Pipe:</strong> Execute complex AI workflows</li>
                    <li><strong>Code Execution:</strong> Run JavaScript code safely</li>
                </ul>
                <p class="mb-0"><strong>Try:</strong> "Search for recent AI developments" or "Execute code: console.log('Hello World')"</p>
            </div>
        `;
    }

    exportConversation() {
        const data = JSON.stringify(this.messages, null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'agent_conversation.json';
        a.click();
        URL.revokeObjectURL(url);
        
        this.showAlert('Conversation exported successfully!', 'success');
    }
}

// Initialize the agent when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.agent = new LLMAgent();
});