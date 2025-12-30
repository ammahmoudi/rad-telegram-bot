// Default welcome messages for different languages
// These are used as fallback when no custom pack messages are configured

export const DEFAULT_WELCOME_MESSAGES = {
  en: `👋 Hi {name}!

🤖 I'm Rad, your AI assistant that can help you manage Planka tasks and Rastar services right from Telegram.

🔧 Available Commands:

📋 Planka:
🔗 /link_planka - Connect your Planka account
📊 /planka_status - Check connection status
🔓 /planka_unlink - Disconnect account

🍽️ Rastar (Food Menu):
🔗 /link_rastar - Connect your Rastar account  
📊 /rastar_status - Check connection status
🔓 /rastar_unlink - Disconnect account

💬 AI Chat:
💬 /new_chat - Start a new conversation
📚 /history - View your chat sessions
🗑️ /clear_chat - Clear current conversation

💡 Getting Started:
Just send me a message to start chatting! I can help you with Planka tasks once you connect your account with /link_planka

⌨️ Quick Access: Use the buttons below to quickly access common features!`,

  fa: `👋 سلام {name}!

🤖 من رد هستم، دستیار هوشمند شما که می‌تونم به شما در مدیریت کارهای پلانکا و خدمات رستار از طریق تلگرام کمک کنم.

🔧 دستورات موجود:

📋 پلانکا:
🔗 /link_planka - اتصال حساب پلانکا
📊 /planka_status - بررسی وضعیت اتصال
🔓 /planka_unlink - قطع اتصال حساب

🍽️ رستار (منوی غذا):
🔗 /link_rastar - اتصال حساب رستار
📊 /rastar_status - بررسی وضعیت اتصال
🔓 /rastar_unlink - قطع اتصال حساب

💬 گفتگوی هوشمند:
💬 /new_chat - شروع گفتگوی جدید
📚 /history - مشاهده تاریخچه گفتگوها
🗑️ /clear_chat - پاک کردن گفتگوی فعلی

💡 شروع کار:
فقط یه پیام برام بفرست تا شروع کنیم! می‌تونم بعد از اتصال حساب پلانکا با /link_planka بهت کمک کنم.

⌨️ دسترسی سریع: از دکمه‌های زیر برای دسترسی سریع به امکانات استفاده کنید!`,
} as const;

/**
 * Get welcome message from user's assigned pack or default pack
 */
export async function getWelcomeMessage(language: 'fa' | 'en' = 'en', telegramUserId?: string, userName?: string): Promise<string> {
  const { getPrisma } = await import('@rad/shared');
  
  try {
    const prisma = getPrisma();
    
    let packId: string | undefined;
    
    // Check if user has a custom pack assigned
    if (telegramUserId) {
      const assignment = await prisma.userPackAssignment.findUnique({
        where: { telegramUserId },
      });
      
      if (assignment) {
        packId = assignment.packId;
      }
    }
    
    // If no custom pack, find default pack
    if (!packId) {
      const defaultPack = await prisma.characterPack.findFirst({
        where: { isDefault: true },
      });
      
      if (defaultPack) {
        packId = defaultPack.id;
      }
    }
    
    // Fetch welcome message from the pack
    if (packId) {
      const message = await prisma.packMessage.findUnique({
        where: {
          packId_language_messageType: {
            packId,
            language,
            messageType: 'welcome',
          },
        },
      });
      
      if (message) {
        let content = message.content;
        if (userName) {
          content = content.replace(/\{name\}/g, userName);
        }
        return content;
      }
    }
    
    // Fallback to default welcome message
    let message: string = DEFAULT_WELCOME_MESSAGES[language];
    if (userName) {
      message = message.replace(/\{name\}/g, userName);
    }
    return message;
  } catch (error) {
    console.error('Error fetching welcome message from database:', error);
    let message: string = DEFAULT_WELCOME_MESSAGES[language];
    if (userName) {
      message = message.replace(/\{name\}/g, userName);
    }
    return message;
  }
}
