---
description: Start the Advocate Case Hub with WhatsApp Reminders
---

This workflow starts both the frontend and the backend reminder service.

1. Ensure you are in the project root directory.

// turbo
2. Start the Backend Reminder Service:
```bash
cd backend && npm run dev
```

// turbo
3. Start the Frontend Website (in a new terminal tab):
```bash
npm run dev
```

4. Open your browser:
   - Website: http://localhost:8080
   - Backend API: http://localhost:5001

5. (Optional) Testing:
   - To manually trigger WhatsApp/Email reminders for tomorrow's events:
     Visit http://localhost:5001/api/events/trigger-reminders
