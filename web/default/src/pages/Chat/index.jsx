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
import { Tiktoken } from "js-tiktoken/lite";
import o200k_base from "js-tiktoken/ranks/o200k_base";
import {
  API,
  copy,
  showError,
  showSuccess,
  showWarning,
  timestamp2string,
} from '../../helpers';
import { v4 as uuidv4 } from 'uuid';
import './ChatPanel.css';

const ChatPage = () => {
  const { t } = useTranslation();
  const [apiKeySource, setApiKeySource] = useState('');
  const [apiKeyOptions, setApiKeyOptions] = useState([]);
  const [loadingTokens, setLoadingTokens] = useState(false);
  const [selectedModel, setSelectedModel] = useState('');
  const [modelOptions, setModelOptions] = useState([]);
  const [loadingModels, setLoadingModels] = useState(false);
  const [endpointType, setEndpointType] = useState('/v1/chat/completions');
  const [serverAddress, setServerAddress] = useState('');

  const chatRef = useRef(null);

  useEffect(() => {
    fetchServerStatus();
    fetchApiTokens();
    fetchAvailableModels();
  }, []);

  const fetchServerStatus = async () => {
    try {
      const res = await API.get('/api/status');
      const { success, message, data } = res.data;

      if (success && data) {
        setServerAddress(data.server_address || '');
      } else {
        showError(message || '获取服务器状态失败');
      }
    } catch (error) {
      showError('获取服务器状态时发生错误: ' + (error.message || '未知错误'));
    }
  };

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
        showError(message || 'Failed to fetch available models. Please try again later.');
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

  const clearChat = () => {
    if (chatRef.current && chatRef.current.clearChat) {
      chatRef.current.clearChat();
      showSuccess('The chat has been cleared successfully!');
    }
  };

  const getDisplayModelName = () => {
    if (!selectedModel) return '';
    return selectedModel.includes('/') ? selectedModel.split('/')[1] : selectedModel;
  };
  const handleSendMessage = async (message, userMessage, callback, updateCallback, finalCallback) => {
    if (!apiKeySource) {
      showError('Empty API Key Source');
      callback({
        id: uuidv4(),
        role: 'assistant',
        content: 'Please select an API key source and model first.',
        timestamp: new Date(),
        tokens: { in: 0, out: 0, total: 0 },
        time: '0s'
      });
      return;
    }
    if (!apiKeySource || !selectedModel) {
      showError('请选择API密钥和模型');
      callback({
        id: uuidv4(),
        role: 'assistant',
        content: '请先选择API密钥和模型',
        timestamp: new Date(),
        tokens: { in: 0, out: 0, total: 0 },
        time: '0s'
      });
      return;
    }

    if (!serverAddress) {
      showError('服务器地址未配置');
      callback({
        id: uuidv4(),
        role: 'assistant',
        content: '服务器地址未配置',
        timestamp: new Date(),
        tokens: { in: 0, out: 0, total: 0 },
        time: '0s'
      });
      return;
    }

    const llmUrl = new URL(serverAddress);
    llmUrl.pathname = '/v1';
    try {
      const openai = new OpenAI({
        apiKey: apiKeySource,
        baseURL: llmUrl.toString(),
        dangerouslyAllowBrowser: true
      });

      const currentMessages = chatRef.current.getMessages();
      const messages = currentMessages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      messages.push({
        role: 'user',
        content: message
      });

      const startTime = Date.now();
      const responseId = uuidv4();

      // 初始近似计算输入token
      const tokenizer = new Tiktoken(o200k_base);
      const approxInputTokens = messages.reduce((acc, msg) => {
        return acc + tokenizer.encode(msg.content).length;
      }, 0);

      // 初始回调
      callback({
        id: responseId,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        tokens: {
          in: approxInputTokens,
          out: 0,
          total: approxInputTokens
        },
        time: '0s'
      });

      let fullResponse = '';
      let approxOutputTokens = 0;
      let finalTokenUsage = null;

      const stream = await openai.chat.completions.create({
        model: selectedModel,
        messages: messages,
        temperature: 0.7,
        stream: true,
        stream_options: {
          include_usage: true  // 启用最终token统计
        }
      });

      for await (const chunk of stream) {
        // 检查是否是最终使用统计块
        if (chunk.usage && chunk.choices.length === 0) {
          finalTokenUsage = chunk.usage;
          continue;
        }

        const content = chunk.choices[0]?.delta?.content || '';
        fullResponse += content;

        // 流式过程中的准确计算
        approxOutputTokens += tokenizer.encode(content).length; // 使用编码器计算输出token数

        // 实时更新消息
        updateCallback(responseId, {
          content: fullResponse,
          tokens: {
            in: finalTokenUsage?.prompt_tokens || approxInputTokens,
            out: finalTokenUsage?.completion_tokens || approxOutputTokens,
            total: finalTokenUsage?.total_tokens || (approxInputTokens + approxOutputTokens)
          },
          time: `${((Date.now() - startTime) / 1000).toFixed(2)}s`
        });
      }

      // 最终更新（确保使用准确token数）
      const duration = (Date.now() - startTime) / 1000;
      updateCallback(responseId, {
        content: fullResponse,
        tokens: {
          in: finalTokenUsage?.prompt_tokens || approxInputTokens,
          out: finalTokenUsage?.completion_tokens || approxOutputTokens,
          total: finalTokenUsage?.total_tokens || (approxInputTokens + approxOutputTokens)
        },
        time: `${duration.toFixed(2)}s`
      });
    } catch (error) {
      console.error('API请求失败:', error);
      const responseId = uuidv4();
      updateCallback(responseId, {
        content: `请求出错: ${error.message}`,
        timestamp: new Date(),
        tokens: { in: 0, out: 0, total: 0 },
        time: '0s'
      });
      showError(`请求失败: ${error.message}`);
    }
    finalCallback();
  };
  const texConfig = {
    loader: { load: ["input/asciimath"] }
  };

  return (
    <div className='chatpanel-container'>
      <Grid>
        <Grid.Column width={4}>
          <Card fluid>
            <Card.Content>
              <Card.Header>
                <Icon name='setting' /> {t('chat.chat_settings.title')}
              </Card.Header>
              <Divider />

              <div style={{ marginBottom: '15px' }}>
                <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>
                  <Icon name='key' /> {t('chat.chat_settings.api_key')}
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
                    placeholder={t('chat.chat_settings.api_key_placeholder')}
                  />
                )}
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>
                  <Icon name='code' /> {t('chat.chat_settings.select_model')}
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
                    placeholder={t('chat.chat_settings.select_model_placeholder')}
                    disabled={modelOptions.length === 0}
                  />
                )}
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>
                  <Icon name='plug' /> {t('chat.chat_settings.endpoint_type')}
                </label>
                <Dropdown
                  fluid
                  selection
                  options={endpointOptions}
                  value={endpointType}
                  onChange={(e, { value }) => setEndpointType(value)}
                />
              </div>

              <Button fluid onClick={clearChat}>
                <Icon name='trash' /> {t('chat.chat_settings.clear_chat')}
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