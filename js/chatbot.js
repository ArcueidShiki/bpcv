// AI Chatbot Integration with DeepSeek API
class CVChatbot {
  constructor() {
    this.apiKey = null; // Will be loaded securely
    this.baseUrl = 'https://api.deepseek.com/v1/chat/completions';
    this.chatMessages = document.getElementById('chatMessages');
    this.chatInput = document.getElementById('chatInput');
    this.sendButton = document.getElementById('sendButton');
    this.conversationHistory = [];
    
    this.initializeBot();
    this.setupEventListeners();
  }

  async initializeBot() {
    // Load API key securely from environment or config
    try {
      // In production, this should be loaded from a secure backend endpoint
      // For now, we'll use a placeholder that should be replaced with actual secure implementation
      this.apiKey = await this.loadApiKey();
    } catch (error) {
      console.warn('API key not loaded, chatbot will use mock responses');
    }
  }

  async loadApiKey() {
    // This should be replaced with a secure backend endpoint
    // that returns the API key after proper authentication
    try {
      const response = await fetch('/api/get-deepseek-key', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'same-origin'
      });
      
      if (response.ok) {
        const data = await response.json();
        return data.apiKey;
      }
    } catch (error) {
      console.warn('Failed to load API key securely');
    }
    
    // No fallback prompt - use mock responses only
    return null;
  }

  setupEventListeners() {
    // Enter key to send message
    this.chatInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
    });

    // Send button click
    this.sendButton.addEventListener('click', () => this.sendMessage());
  }

  async sendMessage() {
    const message = this.chatInput.value.trim();
    if (!message) return;

    // Add user message to chat
    this.addMessage(message, 'user');
    this.chatInput.value = '';
    this.sendButton.disabled = true;

    try {
      // Get bot response
      const response = await this.getBotResponse(message);
      this.addMessage(response, 'bot');
    } catch (error) {
      console.error('Error getting bot response:', error);
      this.addMessage('Sorry, I encountered an error. Please try again later.', 'bot');
    } finally {
      this.sendButton.disabled = false;
      this.chatInput.focus();
    }
  }

  addMessage(content, type) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `${type}-message`;
    
    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.textContent = type === 'user' ? '👤' : '🤖';
    
    const messageContent = document.createElement('div');
    messageContent.className = 'message-content';
    messageContent.textContent = content;
    
    messageDiv.appendChild(avatar);
    messageDiv.appendChild(messageContent);
    
    this.chatMessages.appendChild(messageDiv);
    this.chatMessages.scrollTop = this.chatMessages.scrollHeight;

    // Add to conversation history
    this.conversationHistory.push({ role: type === 'user' ? 'user' : 'assistant', content });
  }

  async getBotResponse(userMessage) {
    if (!this.apiKey) {
      return this.getMockResponse(userMessage);
    }

    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            {
              role: 'system',
              content: `You are Jensen Arcueid's AI assistant. You have comprehensive knowledge about his background:
              
              Professional Experience:
              - Software Engineer at Huawei (2021-2024): Worked on HarmonyOS system debugging tools, performance optimization
              - Full Stack Developer at ByteDance (2021-2022): Developed web applications for healthcare
              - Healthcare IT Support Intern at St John of God Hospital (2024): Technical support for medical systems
              
              Education:
              - Currently pursuing Master of Information Technology at University of Western Australia (2024-2025)
              - Bachelor of Medicine (incomplete) at Peking University (2020-2021) - transferred to pursue tech career
              - Bachelor of Pharmacy at Harbin Medical University (2015-2019)
              
              Technical Skills:
              - Programming: C++, Python, JavaScript, Java, C, TypeScript
              - Backend: Linux servers, Spring Boot, Flask, Redis
              - Frontend: React, Next.js, Vue.js, Three.js, HTML/CSS
              - Tools: Git, Docker, AWS, databases (MySQL, MongoDB, SQLite)
              
              Notable Projects:
              - AuraWell Agent: AI-powered wellness companion
              - Housing Crisis Solution: 3rd place winner in hackathon, data-driven housing analytics
              - Hiperf: HarmonyOS performance debugging tool
              - Portfolio website with Three.js 3D effects
              
              Achievements:
              - 3rd place in Housing Crisis Hackathon 2024 (Perth, Australia)
              - Contributed to open-source HarmonyOS development
              - Reduced debugging time by 40% with performance tools at Huawei
              
              Personal:
              - Currently located in Perth, Australia
              - Trilingual: English (fluent), Chinese (native), Japanese (basic)
              - Passionate about building scalable, efficient, and innovative solutions
              
              Answer questions about Jensen's experience, skills, projects, and career journey. Be helpful, professional, and enthusiastic.`
            },
            ...this.conversationHistory.slice(-10), // Keep last 10 messages for context
            { role: 'user', content: userMessage }
          ],
          max_tokens: 300,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      return data.choices[0].message.content.trim();
    } catch (error) {
      console.error('DeepSeek API error:', error);
      return this.getMockResponse(userMessage);
    }
  }

  getMockResponse(userMessage) {
    const lowerMessage = userMessage.toLowerCase();
    
    // Technical skills responses
    if (lowerMessage.includes('skill') || lowerMessage.includes('technolog')) {
      return "Jensen has extensive experience with C++, Python, JavaScript, and modern frameworks like React and Next.js. He's also proficient in backend technologies including Linux servers, Spring Boot, and various databases. His expertise spans from system-level programming at Huawei to full-stack web development.";
    }
    
    // Experience responses
    if (lowerMessage.includes('experience') || lowerMessage.includes('work')) {
      return "Jensen has diverse experience including 1.5+ years at Huawei working on HarmonyOS debugging tools, full-stack development at ByteDance, and recent healthcare IT internship at St John of God Hospital in Perth. He's contributed to reducing debugging time by 40% and worked on large-scale system development.";
    }
    
    // Education responses
    if (lowerMessage.includes('education') || lowerMessage.includes('study') || lowerMessage.includes('university')) {
      return "Jensen is currently pursuing a Master of Information Technology at the University of Western Australia (2024-2025). He has a unique background transitioning from medicine (Peking University) to technology, with a Bachelor of Pharmacy from Harbin Medical University (2015-2019).";
    }
    
    // Projects responses
    if (lowerMessage.includes('project') || lowerMessage.includes('portfolio')) {
      return "Jensen's notable projects include AuraWell Agent (AI wellness companion), Housing Crisis Solution (3rd place hackathon winner), and Hiperf (HarmonyOS debugging tool). His portfolio showcases both technical depth and practical problem-solving skills across healthcare, system tools, and web applications.";
    }
    
    // Location responses
    if (lowerMessage.includes('location') || lowerMessage.includes('perth') || lowerMessage.includes('australia')) {
      return "Jensen is currently based in Perth, Western Australia, where he's completing his Master's degree and actively seeking software engineering opportunities. He chose Perth for its excellent tech ecosystem and quality of life.";
    }
    
    // Hackathon responses
    if (lowerMessage.includes('hackathon') || lowerMessage.includes('competition')) {
      return "Jensen recently achieved 3rd place out of 50+ teams in the Housing Crisis Hackathon 2024 in Perth. His solution used Python and machine learning to create predictive analytics for housing market trends with an interactive Streamlit dashboard.";
    }
    
    // Contact responses
    if (lowerMessage.includes('contact') || lowerMessage.includes('hire') || lowerMessage.includes('opportunity')) {
      return "You can reach Jensen at 24323312@student.uwa.edu.au or connect with him on LinkedIn. He's actively seeking software engineering opportunities in Australia and is particularly interested in roles involving backend development, system optimization, or full-stack web applications.";
    }
    
    // Default response
    return "Thanks for your question! Jensen is a passionate software engineer with experience at Huawei and ByteDance, currently studying at UWA in Perth. He's skilled in C++, Python, JavaScript, and has won 3rd place in a recent hackathon. Is there anything specific you'd like to know about his background, projects, or skills?";
  }
}

// Initialize chatbot when page loads
window.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('chatMessages')) {
    new CVChatbot();
  }
});

// Global function for HTML onclick
function sendMessage() {
  const chatbot = window.cvChatbot || new CVChatbot();
  chatbot.sendMessage();
}
