export type NotificationType =
  | 'document_processed'
  | 'invoice_due_7_days'
  | 'invoice_due_3_days'
  | 'invoice_due_1_day'
  | 'invoice_overdue'
  | 'invoice_missing_current'
  | 'invoice_missing_pre_due'
  | 'budget_warning_80'
  | 'budget_exceeded'
  | 'credit_limit_80'
  | 'credit_limit_exceeded'
  | 'goal_milestone_25'
  | 'goal_milestone_50'
  | 'goal_milestone_75'
  | 'goal_achieved'
  | 'recurring_due_tomorrow'
  | 'balance_low'
  | 'balance_negative_risk'
  | 'weekly_digest'
  | 'daily_digest'
  | string

export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent'

export interface AppNotification {
  id: number
  user_id: number
  type: NotificationType
  title: string
  message: string
  icon?: string | null
  color?: string | null
  priority: NotificationPriority
  entity_type?: string | null
  entity_id?: number | null
  action_url?: string | null
  action_label?: string | null
  is_read: boolean
  read_at?: string | null
  is_dismissed: boolean
  dismissed_at?: string | null
  metadata?: Record<string, any> | null
  created_at: string
}

export interface NotificationSummary {
  total_count: number
  unread_count: number
  high_priority_count: number
  recent_notifications: AppNotification[]
}

export interface UnreadCountResponse {
  unread_count: number
  high_priority_count: number
}
