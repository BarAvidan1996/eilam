"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

export default function Documentation() {
  return (
    <div className="p-4 max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>תיעוד מערכת עיל״ם - דרישות להעברה לשרת אחר</CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible>
            <AccordionItem value="base44-deps">
              <AccordionTrigger>תלויות BASE44 שצריך להחליף</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-bold">ניהול משתמשים ואימות:</h3>
                    <pre className="bg-gray-100 p-2 rounded-md">
                      {`import { User } from '@/entities/User';
// Methods used:
- User.me()
- User.login()
- User.logout()
- User.updateMyUserData()`}
                    </pre>
                  </div>

                  <div>
                    <h3 className="font-bold">ניהול נתונים:</h3>
                    <pre className="bg-gray-100 p-2 rounded-md">
                      {`// Currently using BASE44's entity system:
import { Task, EquipmentList } from '@/entities';
// Methods used:
- Task.list()
- Task.create()
- Task.update()
- Task.delete()
- EquipmentList.list()
- EquipmentList.create()
- EquipmentList.update()
- EquipmentList.delete()`}
                    </pre>
                  </div>

                  <div>
                    <h3 className="font-bold">אינטגרציות:</h3>
                    <pre className="bg-gray-100 p-2 rounded-md">
                      {`import { InvokeLLM, SendEmail, UploadFile, GenerateImage } from "@/integrations/Core";`}
                    </pre>
                  </div>

                  <div>
                    <h3 className="font-bold">ניתוב:</h3>
                    <pre className="bg-gray-100 p-2 rounded-md">{`import { createPageUrl } from '@/utils';`}</pre>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="env-vars">
              <AccordionTrigger>משתני סביבה נדרשים</AccordionTrigger>
              <AccordionContent>
                <pre className="bg-gray-100 p-2 rounded-md">
                  {`# Authentication
AUTH_SECRET=your-auth-secret
AUTH_PROVIDER=your-auth-provider # e.g., supabase, firebase

# Database
DATABASE_URL=your-database-url

# Translation (if using DeepL)
DEEPL_API_KEY=your-deepl-api-key

# File Storage
STORAGE_PROVIDER=your-storage-provider # e.g., s3, cloudinary
STORAGE_API_KEY=your-storage-api-key
STORAGE_SECRET=your-storage-secret

# Notifications
NOTIFICATIONS_PROVIDER=your-notifications-provider # For expiry reminders`}
                </pre>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="npm-deps">
              <AccordionTrigger>תלויות NPM</AccordionTrigger>
              <AccordionContent>
                <pre className="bg-gray-100 p-2 rounded-md">
                  {`{
  "dependencies": {
    "react": "^18.x",
    "react-dom": "^18.x",
    "react-router-dom": "^6.x",
    "tailwindcss": "^3.x",
    "@radix-ui/react-accordion": "^1.x",
    "@radix-ui/react-avatar": "^1.x",
    "@radix-ui/react-checkbox": "^1.x",
    "@radix-ui/react-dialog": "^1.x",
    "@radix-ui/react-dropdown-menu": "^1.x",
    "@radix-ui/react-label": "^1.x",
    "@radix-ui/react-popover": "^1.x",
    "@radix-ui/react-select": "^1.x",
    "@radix-ui/react-tooltip": "^1.x",
    "class-variance-authority": "^0.7.x",
    "clsx": "^2.x",
    "date-fns": "^2.x",
    "lucide-react": "^0.290.x",
    "tailwind-merge": "^1.x",
    "@hello-pangea/dnd": "^16.x"  // For drag and drop functionality
  }
}`}
                </pre>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="db-schema">
              <AccordionTrigger>מבנה בסיס הנתונים</AccordionTrigger>
              <AccordionContent>
                <pre className="bg-gray-100 p-2 rounded-md">
                  {`-- Users Table
CREATE TABLE users (
    id UUID PRIMARY KEY,
    email VARCHAR NOT NULL UNIQUE,
    full_name VARCHAR,
    created_at TIMESTAMP DEFAULT NOW(),
    last_login TIMESTAMP,
    preferences JSONB
);

-- Tasks Table
CREATE TABLE tasks (
    id UUID PRIMARY KEY,
    title VARCHAR NOT NULL,
    description TEXT,
    status VARCHAR,
    priority VARCHAR,
    category VARCHAR,
    due_date DATE,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Equipment Lists Table
CREATE TABLE equipment_lists (
    id UUID PRIMARY KEY,
    name VARCHAR NOT NULL,
    description TEXT,
    user_id UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    profile JSONB, -- Stores the profile used to generate this list
    items JSONB[] -- Array of equipment items with their details
);

-- Equipment Items Schema (JSONB structure within equipment_lists)
{
    "name": "string",
    "category": "string",
    "quantity": "number",
    "unit": "string",
    "obtained": "boolean",
    "expiryDate": "date",
    "sendExpiryReminder": "boolean",
    "description": "string",
    "usage_instructions": "string",
    "importance": "number"
}

-- Shelters Table
CREATE TABLE shelters (
    id UUID PRIMARY KEY,
    name VARCHAR NOT NULL,
    address VARCHAR,
    capacity INTEGER,
    coordinates POINT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Chat History Table
CREATE TABLE chat_history (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    title VARCHAR,
    messages JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);`}
                </pre>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="required-apis">
              <AccordionTrigger>נקודות קצה (APIs) נדרשות</AccordionTrigger>
              <AccordionContent>
                <pre className="bg-gray-100 p-2 rounded-md">
                  {`// User Management
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
GET /api/auth/me
PUT /api/auth/profile

// Tasks
GET /api/tasks
POST /api/tasks
PUT /api/tasks/:id
DELETE /api/tasks/:id

// Equipment Lists
GET /api/equipment
POST /api/equipment
PUT /api/equipment/:id
DELETE /api/equipment/:id

// Equipment Items
POST /api/equipment/:listId/items
PUT /api/equipment/:listId/items/:itemId
DELETE /api/equipment/:listId/items/:itemId

// Expiry Notifications
POST /api/notifications/expiry/subscribe
DELETE /api/notifications/expiry/unsubscribe

// Shelters
GET /api/shelters
POST /api/shelters/favorite
DELETE /api/shelters/favorite/:id

// Chat
GET /api/chat/history
POST /api/chat/message`}
                </pre>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="additional-notes">
              <AccordionTrigger>הערות נוספות להעברה</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-bold">ניתוב (Routing):</h3>
                    <p>להחליף את createPageUrl בפונקציונליות מקבילה של react-router</p>
                  </div>

                  <div>
                    <h3 className="font-bold">ניהול מצב (State Management):</h3>
                    <ul className="list-disc list-inside">
                      <li>להוסיף ספריית ניהול מצב (למשל Redux או Zustand)</li>
                      <li>לנהל מצב גלובלי של המשתמש והאפליקציה</li>
                      <li>לנהל התראות על פריטים שפג תוקפם</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-bold">Middleware:</h3>
                    <ul className="list-disc list-inside">
                      <li>להוסיף middleware לאימות</li>
                      <li>להוסיף middleware לניהול שפה</li>
                      <li>להוסיף middleware לניהול הרשאות</li>
                      <li>להוסיף middleware לניהול התראות</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-bold">אבטחה:</h3>
                    <ul className="list-disc list-inside">
                      <li>להוסיף CORS</li>
                      <li>להוסיף rate limiting</li>
                      <li>להוסיף validation</li>
                      <li>להוסיף sanitization</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-bold">Logging ו-Monitoring:</h3>
                    <ul className="list-disc list-inside">
                      <li>להוסיף מערכת logging</li>
                      <li>להוסיף error tracking</li>
                      <li>להוסיף performance monitoring</li>
                      <li>להוסיף monitoring להתראות פג תוקף</li>
                    </ul>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>
    </div>
  )
}
