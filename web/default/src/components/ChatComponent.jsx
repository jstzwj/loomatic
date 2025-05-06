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
      role: 'assistant',
      content: '在的！有什么可以帮您的吗？ 😊',
      timestamp: new Date(),
      tokens: { in: 10, out: 10, total: 20 },
      time: '0.51s'
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // Expose methods to parent component through ref
  useImperativeHandle(ref, () => ({
    clearChat: () => {
      setMessages([]);
    },
    addMessage: (message) => {
      setMessages(prev => [...prev, message]);
    },
    getMessages: () => {
      return messages;
    }
  }));

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;
    
    // Add user message
    const userMessage = {
      role: 'user',
      content: inputMessage,
      timestamp: new Date()
    };
    
    setMessages([...messages, userMessage]);
    setInputMessage('');
    setLoading(true);
    
    // If a custom onSendMessage handler is provided, use it
    if (onSendMessage) {
      onSendMessage(inputMessage, userMessage, handleReceiveResponse);
    } else {
      // Default behavior - simulate response
      setTimeout(() => {
        const assistantMessage = {
          role: 'assistant',
          content: '我已收到您的消息，正在处理中...',
          timestamp: new Date(),
          tokens: { in: Math.floor(Math.random() * 20) + 5, out: Math.floor(Math.random() * 30) + 10, total: 0 },
          time: (Math.random() * 2).toFixed(2) + 's'
        };
        assistantMessage.tokens.total = assistantMessage.tokens.in + assistantMessage.tokens.out;
        
        handleReceiveResponse(assistantMessage);
      }, 1000);
    }
  };

  const handleReceiveResponse = (assistantMessage) => {
    setMessages(prev => [...prev, assistantMessage]);
    setLoading(false);
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
                  {message.content}
                  
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