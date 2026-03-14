import cron from 'node-cron';
import { sendWhatsAppReminder } from './reminderService.js';

class SchedulerService {
  static scheduleDailyReminders() {
    // Schedule a cron job to run every day at 9 AM
    cron.schedule('0 9 * * *', async () => {
      console.log('Running daily reminder job...');
      try {
        await sendWhatsAppReminder();
        console.log('Daily reminders sent successfully.');
      } catch (error) {
        console.error('Error sending daily reminders:', error);
      }
    });
  }
}

export default SchedulerService;