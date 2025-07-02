-- تصدير التصنيفات من قاعدة البيانات المحلية
-- تاريخ التصدير: 2025-06-28T08:18:45.933Z
-- عدد التصنيفات: 9

-- حذف التصنيفات الموجودة (اختياري)
-- DELETE FROM categories;

-- إدراج التصنيفات
INSERT INTO categories (id, name, name_en, slug, description, color, icon, display_order, is_active, parent_id, metadata, created_at, updated_at) VALUES (
  0f7b5d72-7895-42a5-8052-91b2144dff33,
  'تقنية',
  'Technology',
  'technology',
  'أخبار وتطورات التقنية والذكاء الاصطناعي',
  '#8B5CF6',
  '💻',
  1,
  1,
  NULL,
  NULL,
  '2025-06-26T16:43:31.093Z',
  '2025-06-27T18:49:35.699Z'
) ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  name_en = VALUES(name_en),
  description = VALUES(description),
  color = VALUES(color),
  icon = VALUES(icon),
  display_order = VALUES(display_order),
  is_active = VALUES(is_active),
  parent_id = VALUES(parent_id),
  metadata = VALUES(metadata),
  updated_at = VALUES(updated_at);

INSERT INTO categories (id, name, name_en, slug, description, color, icon, display_order, is_active, parent_id, metadata, created_at, updated_at) VALUES (
  b15eeb48-e874-41ce-b7a5-08801fd108d9,
  'أخبار محلية',
  NULL,
  'local-news',
  'آخر الأخبار المحلية والأحداث',
  NULL,
  NULL,
  1,
  1,
  NULL,
  NULL,
  '2025-06-26T16:43:28.778Z',
  '2025-06-26T16:43:28.778Z'
) ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  name_en = VALUES(name_en),
  description = VALUES(description),
  color = VALUES(color),
  icon = VALUES(icon),
  display_order = VALUES(display_order),
  is_active = VALUES(is_active),
  parent_id = VALUES(parent_id),
  metadata = VALUES(metadata),
  updated_at = VALUES(updated_at);

INSERT INTO categories (id, name, name_en, slug, description, color, icon, display_order, is_active, parent_id, metadata, created_at, updated_at) VALUES (
  dda9657e-2754-4b8d-99c0-d55a7673e014,
  'رياضة',
  'Sports',
  'sports',
  'أخبار رياضية محلية وعالمية',
  '#F59E0B',
  '⚽',
  2,
  1,
  NULL,
  NULL,
  '2025-06-26T16:43:30.125Z',
  '2025-06-27T18:49:39.613Z'
) ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  name_en = VALUES(name_en),
  description = VALUES(description),
  color = VALUES(color),
  icon = VALUES(icon),
  display_order = VALUES(display_order),
  is_active = VALUES(is_active),
  parent_id = VALUES(parent_id),
  metadata = VALUES(metadata),
  updated_at = VALUES(updated_at);

INSERT INTO categories (id, name, name_en, slug, description, color, icon, display_order, is_active, parent_id, metadata, created_at, updated_at) VALUES (
  09337ce2-88e3-40fe-bc48-9702e73f6b05,
  'اقتصاد',
  'Economy',
  'economy',
  'تقارير السوق والمال والأعمال والطاقة',
  '#10B981',
  '💰',
  3,
  1,
  NULL,
  NULL,
  '2025-06-26T16:43:32.067Z',
  '2025-06-27T18:49:42.089Z'
) ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  name_en = VALUES(name_en),
  description = VALUES(description),
  color = VALUES(color),
  icon = VALUES(icon),
  display_order = VALUES(display_order),
  is_active = VALUES(is_active),
  parent_id = VALUES(parent_id),
  metadata = VALUES(metadata),
  updated_at = VALUES(updated_at);

INSERT INTO categories (id, name, name_en, slug, description, color, icon, display_order, is_active, parent_id, metadata, created_at, updated_at) VALUES (
  d1137432-b059-44da-a778-40a2f958bb8f,
  'سياسة',
  'Politics',
  'politics',
  'مستجدات السياسة المحلية والدولية وتحليلاتها',
  '#EF4444',
  '🏛️',
  4,
  1,
  NULL,
  NULL,
  '2025-06-27T18:42:11.984Z',
  '2025-06-27T18:49:44.489Z'
) ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  name_en = VALUES(name_en),
  description = VALUES(description),
  color = VALUES(color),
  icon = VALUES(icon),
  display_order = VALUES(display_order),
  is_active = VALUES(is_active),
  parent_id = VALUES(parent_id),
  metadata = VALUES(metadata),
  updated_at = VALUES(updated_at);

INSERT INTO categories (id, name, name_en, slug, description, color, icon, display_order, is_active, parent_id, metadata, created_at, updated_at) VALUES (
  36ab3ffd-bf82-4bd1-a80f-f46ce72c438e,
  'محليات',
  'Local',
  'local',
  'أخبار المناطق والمدن السعودية',
  '#3B82F6',
  '🗺️',
  5,
  1,
  NULL,
  NULL,
  '2025-06-27T18:42:13.660Z',
  '2025-06-27T18:49:46.827Z'
) ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  name_en = VALUES(name_en),
  description = VALUES(description),
  color = VALUES(color),
  icon = VALUES(icon),
  display_order = VALUES(display_order),
  is_active = VALUES(is_active),
  parent_id = VALUES(parent_id),
  metadata = VALUES(metadata),
  updated_at = VALUES(updated_at);

INSERT INTO categories (id, name, name_en, slug, description, color, icon, display_order, is_active, parent_id, metadata, created_at, updated_at) VALUES (
  8611a1b5-891f-4848-80de-4c71dcfd58bf,
  'ثقافة ومجتمع',
  'Culture',
  'culture',
  'فعاليات ثقافية، مناسبات، قضايا اجتماعية',
  '#EC4899',
  '🎭',
  6,
  1,
  NULL,
  NULL,
  '2025-06-27T18:42:15.052Z',
  '2025-06-27T18:49:49.458Z'
) ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  name_en = VALUES(name_en),
  description = VALUES(description),
  color = VALUES(color),
  icon = VALUES(icon),
  display_order = VALUES(display_order),
  is_active = VALUES(is_active),
  parent_id = VALUES(parent_id),
  metadata = VALUES(metadata),
  updated_at = VALUES(updated_at);

INSERT INTO categories (id, name, name_en, slug, description, color, icon, display_order, is_active, parent_id, metadata, created_at, updated_at) VALUES (
  411282b1-44fb-4ddb-a5a6-6ff59821fb9d,
  'مقالات رأي',
  'Opinion',
  'opinion',
  'تحليلات ووجهات نظر كتاب الرأي',
  '#7C3AED',
  '✍️',
  7,
  1,
  NULL,
  NULL,
  '2025-06-27T18:42:16.448Z',
  '2025-06-27T18:49:52.086Z'
) ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  name_en = VALUES(name_en),
  description = VALUES(description),
  color = VALUES(color),
  icon = VALUES(icon),
  display_order = VALUES(display_order),
  is_active = VALUES(is_active),
  parent_id = VALUES(parent_id),
  metadata = VALUES(metadata),
  updated_at = VALUES(updated_at);

INSERT INTO categories (id, name, name_en, slug, description, color, icon, display_order, is_active, parent_id, metadata, created_at, updated_at) VALUES (
  d94d2403-b63a-4193-bd30-cd4d90725cdc,
  'منوعات',
  'Misc',
  'misc',
  'أخبار خفيفة، لقطات، طرائف وأحداث غير تقليدية',
  '#6B7280',
  '🎉',
  8,
  1,
  NULL,
  NULL,
  '2025-06-27T18:42:17.846Z',
  '2025-06-27T18:49:54.584Z'
) ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  name_en = VALUES(name_en),
  description = VALUES(description),
  color = VALUES(color),
  icon = VALUES(icon),
  display_order = VALUES(display_order),
  is_active = VALUES(is_active),
  parent_id = VALUES(parent_id),
  metadata = VALUES(metadata),
  updated_at = VALUES(updated_at);

