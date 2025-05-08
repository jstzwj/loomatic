import React, { useState } from 'react';
import { Input, Menu, Segment, Sidebar, Dropdown, Checkbox, Divider, Card, Icon, Label, Button } from 'semantic-ui-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

// mock数据
const mockModels = [
  {
    name: 'Mistral: Mistral Medium 3',
    provider: 'mistralai',
    context: '131K',
    inputCost: '$0.40/M',
    outputCost: '$2/M',
    tags: ['Text'],
    tokens: '354M',
    desc: 'Mistral Medium 3 是高性能企业级大模型，兼顾前沿能力和成本。',
    id: 'mistral-medium-3',
  },
  {
    name: 'Google: Gemini 2.5 Pro Preview',
    provider: 'google',
    context: '1.05M',
    inputCost: '$1.25/M',
    outputCost: '$10/M',
    tags: ['Text', 'Image'],
    tokens: '78.8B',
    desc: 'Gemini 2.5 Pro 是 Google 最新一代 AI 模型，适合高级推理、编程、学术等任务。',
    id: 'gemini-2-5-pro',
  },
  {
    name: 'Arcee AI: Caller Large',
    provider: 'arcee-ai',
    context: '33K',
    inputCost: '$0.55/M',
    outputCost: '$0.85/M',
    tags: ['Text', 'Function'],
    tokens: '3.86M',
    desc: 'Caller Large 是 Arcee 的函数调用专用模型，适合工具编排和 API 调用。',
    id: 'arcee-caller-large',
  },
];

const inputModalities = [
  { key: 'text', text: 'Text', value: 'Text' },
  { key: 'image', text: 'Image', value: 'Image' },
  { key: 'file', text: 'File', value: 'File' },
];

const Models = () => {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [selectedModalities, setSelectedModalities] = useState([]);
  const navigate = useNavigate();

  // 过滤逻辑（仅示例）
  const filteredModels = mockModels.filter(m => {
    if (search && !m.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (selectedModalities.length > 0 && !selectedModalities.some(tag => m.tags.includes(tag))) return false;
    return true;
  });

  return (
    <div style={{ display: 'flex', gap: 32, alignItems: 'flex-start', padding: 24 }}>
      {/* 左侧过滤器 */}
      <div style={{ width: 260, minWidth: 220 }}>
        <div style={{ fontWeight: 600, fontSize: 18, marginBottom: 16 }}>{t('model.filter')}</div>
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontWeight: 500, marginBottom: 8 }}>{t('model.input_modalities') || '输入模态'}</div>
          {inputModalities.map(opt => (
            <Checkbox
              key={opt.key}
              label={opt.text}
              checked={selectedModalities.includes(opt.value)}
              onChange={() => {
                setSelectedModalities(selectedModalities.includes(opt.value)
                  ? selectedModalities.filter(v => v !== opt.value)
                  : [...selectedModalities, opt.value]);
              }}
              style={{ display: 'block', marginBottom: 8 }}
            />
          ))}
        </div>
        <Divider />
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontWeight: 500, marginBottom: 8 }}>{t('model.context_length') || 'Context 长度'}</div>
          <Label basic>4K</Label>
          <Label basic>64K</Label>
          <Label basic>1M</Label>
        </div>
        <Divider />
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontWeight: 500, marginBottom: 8 }}>{t('model.prompt_pricing') || '价格'}</div>
          <Label basic>Free</Label>
          <Label basic>$0.5</Label>
          <Label basic>$10+</Label>
        </div>
        <Divider />
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontWeight: 500, marginBottom: 8 }}>{t('model.series') || '系列'}</div>
          <Label basic>GPT</Label>
          <Label basic>Claude</Label>
          <Label basic>Gemini</Label>
        </div>
        <Divider />
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontWeight: 500, marginBottom: 8 }}>{t('model.categories') || '分类'}</div>
          <Label basic>编程</Label>
          <Label basic>学术</Label>
          <Label basic>健康</Label>
        </div>
      </div>
      {/* 右侧模型列表 */}
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 24 }}>
          <Input
            icon='search'
            placeholder={t('model.search_placeholder') || '搜索模型...'}
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: 320, marginRight: 16 }}
          />
          <Button icon='sort' content={t('model.sort') || '排序'} basic />
        </div>
        <div>
          {filteredModels.map(model => (
            <Card fluid key={model.id} style={{ marginBottom: 18, cursor: 'pointer' }} onClick={() => navigate(`/model/${model.id}`)}>
              <Card.Content>
                <Card.Header style={{ fontSize: 20, fontWeight: 600 }}>{model.name}</Card.Header>
                <Card.Meta style={{ margin: '8px 0' }}>
                  <Label>{model.context} context</Label>
                  <Label>{model.tokens} tokens</Label>
                  <Label>{model.inputCost} input</Label>
                  <Label>{model.outputCost} output</Label>
                  {model.tags.map(tag => <Label key={tag}>{tag}</Label>)}
                </Card.Meta>
                <Card.Description style={{ color: '#666' }}>{model.desc}</Card.Description>
              </Card.Content>
            </Card>
          ))}
          {filteredModels.length === 0 && <div style={{ color: '#888', marginTop: 32 }}>{t('model.no_result') || '暂无结果'}</div>}
        </div>
      </div>
    </div>
  );
};

export default Models; 