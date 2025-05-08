package model

import (
	"gorm.io/gorm"
)

// Models 表结构，存储模型相关信息
// Capabilities 字段建议用JSON字符串存储能力列表

type Model struct {
	ID                int            `json:"id" gorm:"primaryKey;autoIncrement:true"`
	Name              string         `json:"name" gorm:"type:varchar(64);uniqueIndex;not null"`         // 模型英文名
	DisplayName       string         `json:"display_name" gorm:"type:varchar(128);not null"`            // 显示名
	Description       string         `json:"description" gorm:"type:text"`                              // 描述
	Tags              string         `json:"tags" gorm:"type:varchar(256)"`                             // 标签，逗号分隔
	InputTokenPrice   float64        `json:"input_token_price" gorm:"type:decimal(10,6);default:0"`     // 输入token价格
	OutputTokenPrice  float64        `json:"output_token_price" gorm:"type:decimal(10,6);default:0"`    // 输出token价格
	ContextLength     int            `json:"context_length" gorm:"type:int;default:0"`                  // 上下文长度
	Capabilities      string         `json:"capabilities" gorm:"type:text"`                             // 能力，建议存储为JSON字符串
	CreatedAt         int64          `json:"created_at" gorm:"autoCreateTime:milli"`
	UpdatedAt         int64          `json:"updated_at" gorm:"autoUpdateTime:milli"`
	DeletedAt         gorm.DeletedAt `json:"deleted_at" gorm:"index"`
} 