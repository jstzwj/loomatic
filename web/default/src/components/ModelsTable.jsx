import React from 'react';
import { Button, Table, Dropdown, Icon } from 'semantic-ui-react';
import { useTranslation } from 'react-i18next';

const mockModels = [
  {
    id: 'f3b33ad6-99...',
    name: 'aliyun/qwen-plus-2025-04-28',
    provider: 'openai',
    litellm: 'openai/qwen-plus-2025-04-28',
    createdAt: '-',
    updatedAt: '-',
    createdBy: '-',
    inputCost: 0.11,
    outputCost: 0.29,
    team: '-',
  },
  {
    id: '4d8a0e05-4f...',
    name: 'deepseek/deepseek-chat',
    provider: 'deepseek',
    litellm: 'deepseek/deepseek-chat',
    createdAt: '-',
    updatedAt: '-',
    createdBy: '-',
    inputCost: 0.27,
    outputCost: 1.10,
    team: '-',
  },
  // ... 省略更多静态数据 ...
];

const modelOptions = [
  { key: 'all', value: 'all', text: 'All Models' },
  { key: 'qwen', value: 'qwen', text: 'qwen-plus' },
];
const teamOptions = [
  { key: 'all', value: 'all', text: 'All Teams' },
];

const ModelsTable = () => {
  const { t } = useTranslation();
  return (
    <div style={{ background: '#fff', borderRadius: 8, padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 600 }}>{t('model.management')}</div>
          <div style={{ color: '#888', fontSize: 14 }}>{t('model.subtitle')}</div>
        </div>
        <div>
          <Button color='blue' icon labelPosition='left' style={{ marginRight: 8 }}>
            <Icon name='plus' /> {t('model.add')}
          </Button>
          <Button color='red' icon labelPosition='left'>
            <Icon name='trash' /> {t('model.delete_selected')}
          </Button>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
        <Dropdown
          placeholder={t('model.filter_name')}
          selection
          options={modelOptions}
          defaultValue='all'
          style={{ minWidth: 200 }}
        />
        <Dropdown
          placeholder={t('model.filter_team')}
          selection
          options={teamOptions}
          defaultValue='all'
          style={{ minWidth: 200 }}
        />
      </div>
      <div style={{ marginBottom: 8, color: '#888' }}>{t('model.showing', { count: mockModels.length })}</div>
      <Table celled selectable compact>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>{t('model.id')}</Table.HeaderCell>
            <Table.HeaderCell>{t('model.name')}</Table.HeaderCell>
            <Table.HeaderCell>{t('model.provider')}</Table.HeaderCell>
            <Table.HeaderCell>{t('model.litellm')}</Table.HeaderCell>
            <Table.HeaderCell>{t('model.created_at')}</Table.HeaderCell>
            <Table.HeaderCell>{t('model.updated_at')}</Table.HeaderCell>
            <Table.HeaderCell>{t('model.created_by')}</Table.HeaderCell>
            <Table.HeaderCell>{t('model.input_cost')}</Table.HeaderCell>
            <Table.HeaderCell>{t('model.output_cost')}</Table.HeaderCell>
            <Table.HeaderCell>{t('model.team')}</Table.HeaderCell>
            <Table.HeaderCell>{t('model.actions')}</Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {mockModels.map((m, idx) => (
            <Table.Row key={m.id}>
              <Table.Cell>{m.id}</Table.Cell>
              <Table.Cell>{m.name}</Table.Cell>
              <Table.Cell>{m.provider}</Table.Cell>
              <Table.Cell>{m.litellm}</Table.Cell>
              <Table.Cell>{m.createdAt}</Table.Cell>
              <Table.Cell>{m.updatedAt}</Table.Cell>
              <Table.Cell>{m.createdBy}</Table.Cell>
              <Table.Cell>{m.inputCost}</Table.Cell>
              <Table.Cell>{m.outputCost}</Table.Cell>
              <Table.Cell>{m.team}</Table.Cell>
              <Table.Cell>
                <Button icon='edit' size='small' basic color='blue' title={t('model.edit')} />
                <Button icon='trash' size='small' basic color='red' title={t('model.delete')} />
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table>
    </div>
  );
};

export default ModelsTable; 