# Commands
commands-start = Start
commands-start-description = Start the bot and see the main menu
commands-menu = Menu
commands-menu-description = Show main menu
commands-settings = Settings
commands-settings-description = Bot settings
commands-help = Help
commands-help-description = Show this help message
commands-clear-chat = Clear Chat
commands-clear-chat-description = Clear current conversation
commands-link-planka = Link Planka
commands-link-planka-description = Link your Planka account
commands-planka-status = Planka Status
commands-planka-status-description = Check Planka connection status
commands-planka-unlink = Unlink Planka
commands-planka-unlink-description = Unlink your Planka account
commands-link-rastar = Link Rastar
commands-link-rastar-description = Link your Rastar account
commands-rastar-status = Rastar Status
commands-rastar-status-description = Check Rastar connection status
commands-rastar-unlink = Unlink Rastar
commands-rastar-unlink-description = Unlink your Rastar account

# AI Status
ai-thinking = 💭 Thinking...
ai-generating = ✨ Generating response...
ai-processing = ⚙️ Processing...

# Buttons
buttons-planka-status = 📊 Planka Status
buttons-rastar-status = 🍽️ Rastar Status
buttons-connect-planka = 📋 Connect Planka
buttons-connect-rastar = 🍽️ Connect Rastar
buttons-new-chat = 💬 New Chat
buttons-history = 📚 History
buttons-settings = ⚙️ Settings
buttons-new-chat = 💬 New Chat
buttons-clear-chat = 🗑️ Clear Chat

# Chat management
chat-new-topic-created = ✨ New chat created: <b>{$topicName}</b>\nWelcome to your new conversation!
chat-new-chat-only-private = This feature is only available in private chats.
chat-forum-mode-required = To use this feature, Forum Topic Mode must be enabled in @BotFather.
chat-new-chat-failed = Failed to create new chat. Please try again.
chat-no-active-thread = No active conversation to clear.
chat-cleared-successfully = ✅ Chat cleared successfully.
chat-history-cleared = ✅ <b>Chat history cleared!</b>

Your previous messages are still visible, but I've forgotten our conversation history.

Feel free to start a fresh conversation!
chat-clear-only-private = This feature is only available in private chats.
chat-clear-failed = Failed to clear chat. Please try again.
buttons-today-menu = What's today's menu?
buttons-unselected-days = Which days haven't I selected food?
buttons-delayed-tasks = Show my delayed tasks
buttons-my-boards = List my Planka boards
buttons-week-menu = What's for lunch this week?
buttons-create-task = Create a new task
buttons-my-cards = My cards
buttons-select-lunch = Select today's lunch
buttons-tomorrow-menu = Tomorrow's menu
buttons-add-card-comment = Add a comment to a card
buttons-missing-daily-reports = Missing daily reports
buttons-list-no-report-names = List names without reports
buttons-my-assigned-tasks = My assigned tasks
buttons-humanity-qc-cards = Humanity QC cards
# Inline Buttons
inline-buttons-link-planka = 🔗 Link Planka
inline-buttons-unlink-planka = 🔓 Unlink
inline-buttons-relink-planka = 🔗 Relink
inline-buttons-list-boards = 📋 List Boards
inline-buttons-delayed-tasks = 🔴 Delayed Tasks
inline-buttons-create-card = ➕ Create Card
inline-buttons-link-rastar = 🔗 Link Rastar
inline-buttons-unlink-rastar = 🔓 Unlink
inline-buttons-relink-rastar = 🔗 Relink
inline-buttons-today-menu = 📋 Today's Menu
inline-buttons-unselected-days = ⚠️ Unselected Days
inline-buttons-week-menu = 📅 Week Menu

# Menu
menu-welcome = 🤖 <b>Main Menu</b>\n\nChoose an option below:
menu-ai-chat = 💬 AI Chat
menu-planka = 📋 Planka
menu-rastar = 🍽️ Rastar
menu-settings = ⚙️ Settings
# Welcome
welcome-title = 👋 Hi {$name}!
welcome-ai-description = 🤖 I'm an AI assistant that can help you manage your Planka tasks and Rastar food menu right from Telegram.
welcome-description = I can help you manage your Planka tasks and Rastar food menu right from Telegram.
welcome-available-commands = 🔧 Available Commands:
welcome-planka-section = 📋 Planka:
welcome-rastar-section = 🍽️ Rastar (Food Menu):
welcome-chat-section = 💬 Chat:
welcome-getting-started = 💡 Getting Started:
welcome-ai-start-message = Just send me a message to start chatting! I can help you with Planka tasks and food menu once you connect your accounts.
welcome-start-message = Start by connecting your accounts with /link_planka and /link_rastar!
welcome-quick-access = ⌨️ Quick Access: Use the buttons below for instant access!

# Planka
planka-already-linked = ✅ Your Planka account is already linked!
planka-base-url = Base URL: {$url}
planka-token-expires = Token expires in: {$hours} hours
planka-relink-instructions = 💡 To re-link your account:
planka-step1 = 1. First run /planka_unlink
planka-step2 = 2. Then run /link_planka again
planka-link-title = 🔗 Link Your Planka Account
planka-link-step1 = 1️⃣ Click the link below (or copy and paste in browser):
planka-link-portal = Open Secure Link Portal
planka-link-copy = 📋 Or copy this URL:
planka-link-localhost-note = For localhost, paste this URL in your browser
planka-link-step2 = 2️⃣ Enter your Planka credentials
planka-link-step3 = 3️⃣ Return here after successful linking
planka-link-expires = ⏱️ This link expires in 10 minutes
planka-link-security = 🔒 Your password is never stored - only used to get an access token
planka-not-connected = ❌ Not Connected
planka-not-connected-message = Your Planka account is not linked yet.
planka-connect-instruction = 🔗 Run /link_planka to connect your account
planka-connect-command = Run /link_planka to connect an account
planka-connection-expired = 🔒 <b>Planka connection expired!</b>

Your authentication token is no longer valid.

👉 Please reconnect: /link_planka
planka-connection-expired-short = 🔒 Planka connection expired. Reconnect: /link_planka
planka-token-expired = ⚠️ Token Expired
planka-token-expired-message = ❌ Your access token has expired and can no longer be used.
planka-reconnect-title = 🔄 To reconnect:
planka-reconnect-steps = 🔄 Reconnection Steps
planka-reconnect-step1 = 1. Run /planka_unlink to remove the expired token
planka-reconnect-step2 = 2. Then run /link_planka to get a new token
planka-token-invalid = Token Invalid
planka-token-invalid-message = Your token is no longer valid
planka-unlink-first = First unlink your account
planka-link-again = Then link again
planka-connected = ✅ Connected
planka-token-expires-in = ⏰ Token expires in: {$hours}h {$minutes}m
planka-can-use = 💡 You can now use Planka commands in this bot
planka-connection-expired = 🔒 <b>Planka connection expired!</b>

Your authentication token is no longer valid.

👉 Please reconnect: /link_planka
planka-connection-expired-short = 🔒 Planka connection expired. Reconnect: /link_planka
planka-disconnect-command = To disconnect: /planka_unlink
planka-unlinked = ✅ Account Unlinked
planka-unlinked-message = Your Planka account has been disconnected.
planka-no-account = ℹ️ No Account Linked
planka-no-account-message = There was no Planka account connected to unlink.

# Rastar
rastar-already-linked = ✅ Your Rastar account is already linked!
rastar-email = Email
rastar-token-expires = Token expires in {$hours} hours
rastar-token-expires-in = ⏰ Token expires in: {$hours}h {$minutes}m
rastar-relink-instructions = 💡 To re-link your account:
rastar-step1 = 1. First run /rastar_unlink
rastar-step2 = 2. Then run /link_rastar again
rastar-link-title = 🔗 Link Your Rastar Account
rastar-link-step1 = 1️⃣ Click the link below (or copy and paste in browser):
rastar-link-portal = Open Secure Link Portal
rastar-link-copy = 📋 Or copy this URL:
rastar-link-localhost-note = For localhost, paste this URL in your browser
rastar-link-step2 = 2️⃣ Enter your Rastar credentials (my.rastar.company)
rastar-link-step3 = 3️⃣ Return here after successful linking
rastar-link-expires = ⚠️ Note: This link expires in 10 minutes and can only be used once.
rastar-after-linking = 🍽️ After linking, you can:
rastar-feature-menu = • View daily food menus
rastar-feature-select = • Select your lunch choices
rastar-feature-manage = • Manage your food selections
rastar-feature-menu-desc = View daily food menus
rastar-feature-select-desc = Select your lunch choices
rastar-feature-manage-desc = Manage your food selections
rastar-not-connected = ❌ Rastar Not Connected
rastar-not-connected-title = Rastar Not Connected
rastar-not-connected-subtitle = 🍽️ Rastar provides access to:
rastar-not-connected-message = Your Rastar account is not linked yet.
rastar-connect-instruction = 💡 To connect:
rastar-connect-command = Run /link_rastar to securely link your account
rastar-to-connect = 💡 To connect:
rastar-token-expired = ⚠️ Token Expired
rastar-user-id = 🆔 User ID: {$userId}
rastar-user-id-label = User ID
rastar-token-expired-message = ❌ Your access token has expired and can no longer be used.
rastar-reconnect-title = 🔄 To reconnect:
rastar-reconnect-instructions = 🔄 Reconnection Steps
rastar-reconnect-step1 = Run /rastar_unlink to remove the expired token
rastar-reconnect-step2 = Then run /link_rastar to get a new token
rastar-connected = ✅ Connected
rastar-available-features = 💡 Available features:
rastar-chat-instruction = 💬 You can also chat with me naturally:
rastar-example = e.g., "What's for lunch today?" or "Select food for tomorrow"
rastar-connection-expired = 🔒 <b>Rastar connection expired!</b>

Your authentication has expired.

👉 Please reconnect: /link_rastar
rastar-connection-expired-short = 🔒 Rastar connection expired. Reconnect: /link_rastar
rastar-disconnected = ✅ Account Disconnected
rastar-disconnected-message = Your Rastar account ({$email}) has been disconnected from this bot.
rastar-reconnect-later = 🔗 You can reconnect anytime by running:
rastar-error = ❌ Error
rastar-error-message = There was an error disconnecting your account. It may already be disconnected.
rastar-try-again = 🔄 Try running /rastar_status to check your connection status.
rastar-reconnect-title = 🔄 To reconnect:
rastar-reconnect-step1 = Run /rastar_unlink to remove the expired token
rastar-reconnect-step2 = Then run /link_rastar to get a new token
rastar-connected = ✅ Rastar Connected
rastar-token-expires-in = ⏰ Token expires in: {$hours}h {$minutes}m
rastar-available-features = 🍽️ Available Features:
rastar-chat-instruction = 💬 Just chat with me to use these features!
rastar-example = Example: "Show me today's menu" or "Select lunch option 2"
rastar-disconnected = ✅ Rastar Disconnected
rastar-disconnected-message = Account {$email} has been unlinked.
rastar-error = ⚠️ Error
rastar-error-message = Could not disconnect your Rastar account.

# Chat
chat-new-started = New Chat Started
chat-history-cleared = Previous conversation history has been cleared.
chat-send-message = Send me a message to start a fresh conversation!
chat-new-session = 🆕 New chat session started!
chat-no-sessions = 📚 No chat sessions yet. Send me a message to start!
chat-messages = messages
chat-recent-sessions = Recent Chat Sessions
chat-showing = Showing {$shown} of {$total} sessions
chat-cleared = ✅ Chat history has been cleared!
chat-fresh-start = Starting fresh. Send me a message!
chat-ai-not-configured = ❌ AI chat is not configured.
chat-user-not-identified = Could not identify your Telegram user.

# Errors
errors-user-not-identified = Could not identify your Telegram user.
errors-ai-not-configured = ❌ AI is not configured on this bot.
errors-ai-not-configured-short = ❌ AI not configured.

# Menu
menu-welcome = 👋 Welcome! Choose an option below:
menu-ai-chat = 💬 AI Chat
menu-planka = 📋 Planka
menu-rastar = 🍽️ Rastar
menu-settings = ⚙️ Settings
menu-back = 🔙 Back to Main Menu
menu-title = Quick Access Menu
menu-use-buttons = Use the buttons below to quickly access features:
menu-planka-status = Planka Status
menu-planka-status-desc = Check Planka connection
menu-rastar-status = Rastar Status
menu-rastar-status-desc = Check Rastar connection
menu-today-menu = Today's Menu
menu-today-menu-desc = View food options
menu-unselected-days = Unselected Days
menu-unselected-days-desc = Check missing food selections
menu-delayed-tasks = Delayed Tasks
menu-delayed-tasks-desc = View overdue Planka tasks
menu-my-boards = My Boards
menu-my-boards-desc = View Planka boards
menu-new-chat = New Chat
menu-new-chat-desc = Start fresh conversation
menu-history = History
menu-history-desc = View chat history
menu-or-type = Or just type your message naturally!

# Settings
settings-title = ⚙️ Settings
settings-language = 🌐 Language
settings-current-language = Current language: {$language}
settings-change-language = Change Language
settings-select-language = 🌐 Select Language:
settings-persian = 🇮🇷 فارسی
settings-english = 🇬🇧 English
settings-language-changed = ✅ Language changed to {$language}
settings-keyboard-updated = ✅ Keyboard updated!
settings-connections = 🔗 Connections
settings-planka-connection = Planka
settings-rastar-connection = Rastar
settings-notifications = 🔔 Notifications
settings-notifications-enabled = ✅ Notifications enabled!
settings-notifications-disabled = 🔕 Notifications disabled!
settings-enable-reminders = Enable food selection reminders
settings-back = 🔙 Back

# Inline Buttons
inline-buttons-link-planka = 🔗 Link Planka
inline-buttons-unlink-planka = 🔓 Unlink
inline-buttons-today-menu = 📋 Today's Menu
inline-buttons-week-menu = 📅 This Week's Menu

# Loading
loading-fetching-boards = 📋 Fetching your boards...
loading-checking-delayed-tasks = 🔴 Checking for delayed tasks...
loading-fetching-today-menu = 🍽️ Fetching today's menu...
loading-checking-unselected-days = ⚠️ Checking for days without food selection...
loading-fetching-week-menu = 📅 Fetching this week's menu...

# Prompts
prompts-list-boards = List all my Planka boards
prompts-delayed-tasks = Show me all my delayed tasks and overdue cards in Planka
prompts-today-menu = Show me today's food menu
prompts-unselected-days = Show me all days where I haven't selected food yet
prompts-week-menu = Show me the complete food menu for this week

# Errors
errors-generic = ⚠️ Something went wrong. Please try again in a moment.
errors-generic-title = ⚠️ Error
errors-generic-description = Something went wrong while processing your request.
errors-try-again = Please try again in a moment.
errors-contact-support = If this persists, contact support.
errors-rate-limit-title = ⏱️ Rate Limit Reached
errors-rate-limit-description = The {$model} is temporarily busy or rate-limited.
errors-rate-limit-what-to-do = What to do:
errors-rate-limit-wait = • Wait a moment and try again
errors-rate-limit-message-saved = • Your message was saved
errors-rate-limit-note = This usually clears in 30-60 seconds
errors-network-title = 🌐 Network Connection Error
errors-network-description = There was a problem connecting to the AI service.
errors-network-try = What to do:
errors-network-wait-retry = • Wait a moment and try again
errors-network-check-connection = • Check your internet connection
errors-network-server-issue = • The service may be temporarily unavailable
errors-model-compatibility-title = ⚙️ Model Compatibility Issue
errors-model-compatibility-description = The current AI model doesn't support the tools needed for this operation.
errors-model-compatibility-compatible-models = Compatible models:
errors-model-compatibility-ask-admin = Please ask an admin to switch to a compatible model
errors-credits-title = 💳 Insufficient Credits
errors-credits-description = The API account has reached its usage limit or run out of credits.
errors-credits-ask-admin = Please ask an admin to add credits or check the API account
errors-auth-title = 🔐 Authentication Error
errors-auth-description = There's an issue with the API authentication credentials.
errors-auth-ask-admin = Please ask an admin to check the API configuration
errors-timeout-title = ⏱️ Request Timeout
errors-timeout-description = The request took too long to process.
errors-timeout-try = What to do:
errors-timeout-simplify = • Try a simpler query
errors-timeout-retry = • Try again in a moment
errors-timeout-break-up = • Break your request into smaller parts
errors-streaming-connection-title = ⚠️ Connection Issue
errors-streaming-connection-description = The AI service connection was interrupted.
errors-streaming-connection-gemini-note-title = Note:
errors-streaming-connection-gemini-note = Gemini reasoning models occasionally have connection issues when generating responses.
errors-streaming-connection-what-to-do = What you can do:
errors-streaming-connection-retry = • Send your message again - it usually works on retry
errors-streaming-connection-ask-admin = • Ask an admin to switch to Claude (more stable)
errors-streaming-connection-try = Try:
errors-streaming-connection-simplify = • Simplify your query

# Button callback messages
button-callback-invalid-button-data = ❌ Invalid button data
button-callback-failed-to-process = ❌ Failed to process button action

# AI button messages
ai-buttons-invalid-data = ❌ Invalid button data
ai-buttons-not-for-you = ❌ This button is not for you
ai-buttons-processing = ⚙️ Processing...
ai-buttons-cancelled = ✅ Action cancelled
ai-buttons-unknown-action = ❌ Unknown action: {$action}
ai-buttons-error = ❌ An error occurred

# AI button actions
ai-buttons-command-suggestion = 💡 Please use the {$command} command directly.
ai-buttons-no-message = ❌ No message to send

# Success
success-action-completed = ✅ Action completed successfully!
success-saved = ✅ Saved!
success-updated = ✅ Updated!
success-deleted = ✅ Deleted!
success-created = ✅ Created!

# Menu & Navigation
menu-back-button = « Back
menu-language-button = 🌐 Language
menu-settings-button = ⚙️ Settings
menu-main-title = 🤖 Main Menu

# Language selection
language-select-title = 🌐 Select Language:
language-english-button = 🇬🇧 English
language-persian-button = 🇮🇷 فارسی
language-auto-detect = 🔄 Use Telegram Language
language-changed-to-en = ✅ Language changed to English

💡 This overrides your Telegram language setting for this bot only.
language-changed-to-fa = ✅ زبان به فارسی تغییر کرد

💡 این تنظیم زبان تلگرام شما را فقط برای این ربات تغییر می‌دهد.

# Chat sessions
chat-sessions-title = 📚 Chat Sessions
chat-no-sessions = 📚 No chat sessions yet. Send me a message to start!
chat-send-message = 💬 Send me a message to start a fresh conversation!
chat-failed-clear = ❌ Failed to clear chat history. Please try again.
chat-thread-invalid = ⚠️ This thread cannot be deleted. Please make sure you're inside a valid topic thread.
chat-thread-delete-failed = ❌ Failed to delete this thread. Make sure you have permission to manage topics.
chat-thread-delete-help = <b>How to delete this topic:</b>

1. Open the topic
2. Tap the three dots ⋯ at the top
3. Select "Delete Topic"

<i>Note: Only group admins can delete topics.</i>

# Error handling
error-user-not-found = ❌ Could not identify your Telegram user.
error-user-not-found-retry = Please try again or use /start

# Help and commands
help-title = <b>🤖 Bot Help</b>

I'm an AI assistant that can help you manage tasks in Planka and select meals in Rastar, all from Telegram!

<b>📋 Planka Commands:</b>
• /link_planka - Link your Planka account
• /planka_status - Check connection status
• /planka_unlink - Unlink your account

<b>🍽️ Rastar Commands:</b>
• /link_rastar - Link your Rastar account
• /rastar_status - Check connection status
• /rastar_unlink - Unlink your account

<b>💬 Chat Commands:</b>
• /start - Show main menu
• /menu - Open menu
• /settings - Open settings
• /help - Show this message
• /clear_chat - Clear conversation history

<b>💡 Quick Tips:</b>
• Use the buttons below for instant access
• Change your language in settings
• Connect your accounts to unlock features

settings-header = ⚙️ <b>Bot Settings</b>

Customize your experience:

quick-access-label = ⌨️ <b>Quick Access</b>

Use these buttons for instant access to features:

ai-button-usage = 💡 <b>How to use AI Buttons:</b>

When I give you suggestions, click the buttons to:
• Get more details
• Perform actions
• Navigate tasks

<i>These buttons are personalized for you!</i>

# Chat commands
chat-new-started = New Chat Started
chat-history-cleared = Chat history cleared!
chat-recent-sessions = Recent Chat Sessions
chat-messages = messages
chat-showing = Showing {$shown} of {$total} sessions
chat-simple-mode-only = ⚠️ This command is only available in simple chat mode.

In thread mode, each topic/thread is already a separate conversation.
Create a new thread to start a fresh conversation.
chat-thread-mode-info = ⚠️ This command is only available in simple chat mode.

In thread mode, each topic/thread has its own conversation history.
Create a new thread to start a fresh conversation.
errors-user-not-identified = ❌ I couldn't identify you. Please try /start or /menu.
errors-ai-not-configured = ❌ AI is not configured yet. Please try again later.
errors-ai-not-configured-short = ❌ AI not configured
