import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Card,
  Form,
  Input,
  Button,
  Icon,
  Label,
  Message
} from 'semantic-ui-react';
import { v4 as uuidv4 } from 'uuid';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex';
import rehypeHighlight from 'rehype-highlight';
import 'katex/dist/katex.min.css';
import 'highlight.js/styles/github.min.css';

const ChatComponent = forwardRef(({
  modelName = 'qwen-plus',
  initialMessages = [],
  onSendMessage = null,
  showTokenInfo = true,
  maxHeight = '60vh'
}, ref) => {
  const { t } = useTranslation();
  const [messages, setMessages] = useState(initialMessages.length > 0 ? initialMessages : [
    {
      id: uuidv4(),
      role: 'assistant',
      content: '在的！有什么可以帮您的吗？ 😊',
      timestamp: new Date(),
      tokens: { in: 10, out: 10, total: 20 },
      time: '0.51s'
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useImperativeHandle(ref, () => ({
    clearChat: () => {
      setMessages([]);
    },
    addMessage: (message) => {
      setMessages(prev => [...prev, { ...message, id: uuidv4() }]);
    },
    getMessages: () => {
      return messages;
    },
    updateMessage: (id, updates) => {
      setMessages(prev => prev.map(msg => 
        msg.id === id ? { ...msg, ...updates } : msg
      ));
    }
  }));

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;
    
    // Add user message
    const userMessage = {
      id: uuidv4(),
      role: 'user',
      content: inputMessage,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setLoading(true);
    
    if (onSendMessage) {
      onSendMessage(
        inputMessage, 
        userMessage, 
        // 初始回调
        (assistantMessage) => {
          setMessages(prev => [...prev, { ...assistantMessage, id: assistantMessage.id || uuidv4() }]);
        },
        // 更新回调
        (id, updates) => {
          setMessages(prev => prev.map(msg => 
            msg.id === id ? { ...msg, ...updates } : msg
          ));
        },
        () => {
          setLoading(false);
        }
      );
      
    } else {
      // 默认行为 - 模拟响应
      const responseId = uuidv4();
      setMessages(prev => [...prev, {
        id: responseId,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        tokens: { in: 0, out: 0, total: 0 },
        time: '0s'
      }]);

      let simulatedResponse = '我已收到您的消息，正在处理中...';
      let currentText = '';
      let charIndex = 0;
      
      const intervalId = setInterval(() => {
        if (charIndex < simulatedResponse.length) {
          currentText += simulatedResponse.charAt(charIndex);
          charIndex++;
          
          setMessages(prev => prev.map(msg => 
            msg.id === responseId ? { 
              ...msg, 
              content: currentText,
              tokens: { in: 10, out: charIndex / 4, total: 10 + charIndex / 4 }
            } : msg
          ));
        } else {
          clearInterval(intervalId);
          setMessages(prev => prev.map(msg => 
            msg.id === responseId ? { 
              ...msg, 
              time: '1.23s' 
            } : msg
          ));
          setLoading(false);
        }
      }, 50);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <Card fluid className='chat-card'>
      <Card.Content>
        <Card.Header className='header'>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Icon name='comment' />
            <span>Assistant</span>
            <Label style={{ marginLeft: '10px' }} size='small'>{modelName}</Label>
          </div>
        </Card.Header>

        <div style={{ height: maxHeight, overflowY: 'auto', padding: '10px', marginTop: '10px' }} className="chat-messages">
          {messages.length === 0 && (
            <Message info>
              <Message.Header>开始新的对话</Message.Header>
              <p>发送消息开始与AI助手对话</p>
            </Message>
          )}

          {messages.map((message, index) => (
            <div key={index} style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                <div
                  style={{
                    fontWeight: 'bold',
                    marginRight: '10px',
                    minWidth: '80px'
                  }}
                >
                  {message.role === 'assistant' ? 'Assistant' : 'User'}
                </div>
                <div style={{ flex: 1 }}>
                  <Markdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex, rehypeHighlight]}>
                  {message.content}
                  </Markdown>

                  {showTokenInfo && message.tokens && (
                    <div style={{ fontSize: '0.8em', color: 'gray', marginTop: '5px' }}>
                      <Icon name='clock' /> {message.time}
                      <Icon name='arrow right' style={{ marginLeft: '10px' }} /> In: {message.tokens.in}
                      <Icon name='arrow left' style={{ marginLeft: '10px' }} /> Out: {message.tokens.out}
                      <Icon name='calculator' style={{ marginLeft: '10px' }} /> Total: {message.tokens.total}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card.Content>

      <Card.Content extra>
        <Form>
          <Input
            fluid
            placeholder="Type your message... (Shift+Enter for new line)"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            action={
              <Button
                color='blue'
                icon='send'
                content='Send'
                onClick={handleSendMessage}
                loading={loading}
                disabled={loading}
              />
            }
          />
        </Form>
      </Card.Content>
    </Card>
  );
});

// Add display name for debugging
ChatComponent.displayName = 'ChatComponent';

export default ChatComponent;