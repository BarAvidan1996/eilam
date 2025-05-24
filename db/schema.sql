-- Create equipment_lists table
CREATE TABLE IF NOT EXISTS equipment_lists (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create equipment_items table
CREATE TABLE IF NOT EXISTS equipment_items (
  id UUID PRIMARY KEY,
  list_id UUID REFERENCES equipment_lists(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT DEFAULT 'other',
  quantity INTEGER DEFAULT 1,
  unit TEXT DEFAULT 'יחידות',
  description TEXT,
  obtained BOOLEAN DEFAULT FALSE,
  importance_level INTEGER DEFAULT 3,
  expiration_date DATE,
  wants_expiry_reminder BOOLEAN DEFAULT FALSE,
  sms_notification BOOLEAN DEFAULT FALSE,
  usage_instructions TEXT,
  shelf_life TEXT,
  recommended_quantity_per_person TEXT,
  personalized_note TEXT,
  is_mandatory BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_equipment_items_list_id ON equipment_items(list_id);
CREATE INDEX IF NOT EXISTS idx_equipment_lists_user_id ON equipment_lists(user_id);
