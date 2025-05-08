import React from 'react';
import { useParams } from 'react-router-dom';
import { Card, Label, Icon } from 'semantic-ui-react';
import { useTranslation } from 'react-i18next';

const mockModels = {
  'mistral-medium-3': {
    name: 'Mistral: Mistral Medium 3',
    provider: 'mistralai',
    context: '131K',
    inputCost: '$0.40/M',
    outputCost: '$2/M',
    tags: ['Text'],
    tokens: '354M',
    desc: 'Mistral Medium 3 是高性能企业级大模型，兼顾前沿能力和成本。',
  },
  'gemini-2-5-pro': {
    name: 'Google: Gemini 2.5 Pro Preview',
    provider: 'google',
    context: '1.05M',
    inputCost: '$1.25/M',
    outputCost: '$10/M',
    tags: ['Text', 'Image'],
    tokens: '78.8B',
    desc: 'Gemini 2.5 Pro 是 Google 最新一代 AI 模型，适合高级推理、编程、学术等任务。',
  },
  'arcee-caller-large': {
    name: 'Arcee AI: Caller Large',
    provider: 'arcee-ai',
    context: '33K',
    inputCost: '$0.55/M',
    outputCost: '$0.85/M',
    tags: ['Text', 'Function'],
    tokens: '3.86M',
    desc: 'Caller Large 是 Arcee 的函数调用专用模型，适合工具编排和 API 调用。',
  },
};

const ModelDetail = () => {
  const { modelname } = useParams();
  const { t } = useTranslation();
  const model = mockModels[modelname] || {};

  if (!model.name) {
    return <div style={{ padding: 32, color: '#888' }}>{t('model.not_found') || '未找到该模型'}</div>;
  }

  return (
    <div style={{ maxWidth: 700, margin: '40px auto' }}>
      <Card fluid>
        <Card.Content>
          <Card.Header style={{ fontSize: 24, fontWeight: 700 }}>{model.name}</Card.Header>
          <Card.Meta style={{ margin: '12px 0' }}>
            <Label>{model.context} context</Label>
            <Label>{model.tokens} tokens</Label>
            <Label>{model.inputCost} input</Label>
            <Label>{model.outputCost} output</Label>
            {model.tags.map(tag => <Label key={tag}>{tag}</Label>)}
          </Card.Meta>
          <Card.Description style={{ color: '#555', fontSize: 16 }}>{model.desc}</Card.Description>
        </Card.Content>
      </Card>
    </div>
  );
};

export default ModelDetail; 