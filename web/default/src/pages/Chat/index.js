import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Grid, 
  Card, 
  Dropdown, 
  Icon, 
  Button, 
  Divider,
  Loader
} from 'semantic-ui-react';
import ChatComponent from '../../components/ChatComponent';
import OpenAI from 'openai';
import {
  API,
  copy,
  showError,
  showSuccess,
  showWarning,
  timestamp2string,
} from '../../helpers';

const ChatPage = () => {
  const { t } = useTranslation();
  const [apiKeySource, setApiKeySource] = useState('');
  const [apiKeyOptions, setApiKeyOptions] = useState([]);
  const [loadingTokens, setLoadingTokens] = useState(false);
  const [selectedModel, setSelectedModel] = useState('');
  const [modelOptions, setModelOptions] = useState([]);
  const [loadingModels, setLoadingModels] = useState(false);
  const [endpointType, setEndpointType] = useState('/v1/chat/completions');
  const [selectedTags, setSelectedTags] = useState([]);
  
  const chatRef = useRef(null);

  useEffect(() => {
    fetchApiTokens();
    fetchAvailableModels();
  }, []);

  const fetchApiTokens = async () => {
    setLoadingTokens(true);
    try {
      const res = await API.get('/api/token/?p=0&order=');
      const { success, message, data } = res.data;
      
      if (success && data) {
        const options = data.map(token => ({
          key: token.id,
          text: `${token.name} (余量: ${formatQuota(token.remain_quota)})`,
          value: token.key,
          description: token.unlimited_quota ? '无限额度' : `剩余: ${formatQuota(token.remain_quota)}`,
          content: (
            <div>
              <div><strong>{token.name}</strong></div>
              <div style={{ fontSize: '0.8em', color: 'gray' }}>
                {token.unlimited_quota ? '无限额度' : `剩余额度: ${formatQuota(token.remain_quota)}`}
              </div>
            </div>
          )
        }));
        
        options.unshift({
          key: 'session',
          text: 'Current UI Session',
          value: 'session',
          description: '使用当前会话凭证',
          content: (
            <div>
              <div><strong>Current UI Session</strong></div>
              <div style={{ fontSize: '0.8em', color: 'gray' }}>使用当前会话凭证</div>
            </div>
          )
        });
        
        setApiKeyOptions(options);
        
        if (options.length > 0 && !apiKeySource) {
          setApiKeySource(options[0].value);
        }
      } else {
        showError(message || '获取API令牌失败');
      }
    } catch (error) {
      showError('获取API令牌时发生错误: ' + (error.message || '未知错误'));
    } finally {
      setLoadingTokens(false);
    }
  };

  const fetchAvailableModels = async () => {
    setLoadingModels(true);
    try {
      const res = await API.get('/api/user/available_models');
      const { success, message, data } = res.data;
      
      if (success && Array.isArray(data)) {
        const options = data.map(model => {
          const parts = model.includes('/') ? model.split('/') : ['', model];
          const provider = parts[0];
          const modelName = parts[1];
          
          return {
            key: model,
            text: model,
            value: model,
            content: (
              <div>
                <div><strong>{model}</strong></div>
                {provider && (
                  <div style={{ fontSize: '0.8em', color: 'gray' }}>
                    Provider: {provider}
                  </div>
                )}
              </div>
            )
          };
        });
        
        setModelOptions(options);
        
        if (options.length > 0 && !selectedModel) {
          setSelectedModel(options[0].value);
        }
      } else {
        showError(message || '获取可用模型失败');
      }
    } catch (error) {
      showError('获取可用模型时发生错误: ' + (error.message || '未知错误'));
    } finally {
      setLoadingModels(false);
    }
  };

  const formatQuota = (quota) => {
    if (quota >= 1000000) {
      return (quota / 1000000).toFixed(2) + 'M';
    } else if (quota >= 1000) {
      return (quota / 1000).toFixed(2) + 'K';
    }
    return quota.toString();
  };

  const endpointOptions = [
    { key: 'chat', text: '/v1/chat/completions', value: '/v1/chat/completions' }
  ];

  const tagOptions = [
    { key: 'important', text: 'Important', value: 'important' },
    { key: 'work', text: 'Work', value: 'work' },
    { key: 'personal', text: 'Personal', value: 'personal' }
  ];

  const clearChat = () => {
    if (chatRef.current && chatRef.current.clearChat) {
      chatRef.current.clearChat();
      showSuccess('聊天记录已清空');
    }
  };

  const getDisplayModelName = () => {
    if (!selectedModel) return '';
    return selectedModel.includes('/') ? selectedModel.split('/')[1] : selectedModel;
  };

  const handleSendMessage = async (message, userMessage, callback) => {
    if (!apiKeySource || !selectedModel) {
      showError('请选择API密钥和模型');
      return;
    }

    try {
      // 创建OpenAI客户端
      const openai = new OpenAI({
        apiKey: apiKeySource,
        baseURL: '/api', // 假设你的后端代理了OpenAI API
        dangerouslyAllowBrowser: true // 仅用于演示，生产环境应该在后端处理
      });

      // 获取当前聊天记录
      const currentMessages = chatRef.current.getMessages();
      
      // 构建OpenAI格式的消息
      const messages = currentMessages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      const startTime = Date.now();
      
      // 调用OpenAI API
      const completion = await openai.chat.completions.create({
        model: selectedModel,
        messages: messages,
        temperature: 0.7,
      });

      const endTime = Date.now();
      const duration = (endTime - startTime) / 1000;

      // 构建回复消息
      const assistantMessage = {
        role: 'assistant',
        content: completion.choices[0]?.message?.content || '没有收到回复内容',
        timestamp: new Date(),
        tokens: {
          in: completion.usage?.prompt_tokens || 0,
          out: completion.usage?.completion_tokens || 0,
          total: completion.usage?.total_tokens || 0
        },
        time: `${duration.toFixed(2)}s`
      };
      
      callback(assistantMessage);
    } catch (error) {
      console.error('调用OpenAI API出错:', error);
      showError(`请求失败: ${error.message}`);
      
      // 即使出错也调用回调，以便UI可以处理加载状态
      callback({
        role: 'assistant',
        content: `抱歉，请求出错: ${error.message}`,
        timestamp: new Date(),
        tokens: { in: 0, out: 0, total: 0 },
        time: '0s'
      });
    }
  };

  return (
    <div className='dashboard-container'>
      <Grid>
        <Grid.Column width={4}>
          <Card fluid>
            <Card.Content>
              <Card.Header>
                <Icon name='setting' /> Chat Settings
              </Card.Header>
              <Divider />
              
              <div style={{ marginBottom: '15px' }}>
                <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>
                  <Icon name='key' /> API Key Source
                </label>
                {loadingTokens ? (
                  <Loader active inline='centered' size='small' />
                ) : (
                  <Dropdown
                    fluid
                    selection
                    options={apiKeyOptions}
                    value={apiKeySource}
                    onChange={(e, { value }) => setApiKeySource(value)}
                    placeholder="Select API Key"
                  />
                )}
              </div>
              
              <div style={{ marginBottom: '15px' }}>
                <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>
                  <Icon name='code' /> Select Model
                </label>
                {loadingModels ? (
                  <Loader active inline='centered' size='small' />
                ) : (
                  <Dropdown
                    fluid
                    selection
                    options={modelOptions}
                    value={selectedModel}
                    onChange={(e, { value }) => setSelectedModel(value)}
                    placeholder="Select Model"
                    disabled={modelOptions.length === 0}
                  />
                )}
              </div>
              
              <div style={{ marginBottom: '15px' }}>
                <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>
                  <Icon name='plug' /> Endpoint Type
                </label>
                <Dropdown
                  fluid
                  selection
                  options={endpointOptions}
                  value={endpointType}
                  onChange={(e, { value }) => setEndpointType(value)}
                />
              </div>
              
              <div style={{ marginBottom: '15px' }}>
                <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>
                  <Icon name='tags' /> Tags
                </label>
                <Dropdown
                  fluid
                  multiple
                  selection
                  options={tagOptions}
                  value={selectedTags}
                  onChange={(e, { value }) => setSelectedTags(value)}
                  placeholder="Select tags"
                />
              </div>
              
              <Button fluid onClick={clearChat}>
                <Icon name='trash' /> Clear Chat
              </Button>
            </Card.Content>
          </Card>
        </Grid.Column>
        
        <Grid.Column width={12}>
          <ChatComponent 
            modelName={getDisplayModelName()}
            onSendMessage={handleSendMessage}
            ref={chatRef}
          />
        </Grid.Column>
      </Grid>
    </div>
  );
};

export default ChatPage;