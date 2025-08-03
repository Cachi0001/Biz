| column_name              | data_type                | is_nullable | column_default           |
| ------------------------ | ------------------------ | ----------- | ------------------------ |
| id                       | uuid                     | NO          | uuid_generate_v4()       |
| user_id                  | uuid                     | YES         | null                     |
| endpoint                 | text                     | NO          | null                     |
| keys                     | jsonb                    | NO          | null                     |
| active                   | boolean                  | NO          | true                     |
| created_at               | timestamp with time zone | YES         | now()                    |
| updated_at               | timestamp with time zone | YES         | now()                    |
| token                    | text                     | NO          | null                     |
| device_type              | character varying        | YES         | 'web'::character varying |
| device_info              | jsonb                    | YES         | '{}'::jsonb              |
| fcm_token                | text                     | YES         | null                     |
| notification_preferences | jsonb                    | YES         | '{}'::jsonb              |
| last_used_at             | timestamp with time zone | YES         | now()                    |

| total_subscriptions | active_subscriptions | with_fcm_token |
| ------------------- | -------------------- | -------------- |
| 0                   | 0                    | 0              |