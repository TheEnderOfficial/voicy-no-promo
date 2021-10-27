import Context from '@/models/Context'
import bot from '@/helpers/bot'

const ignoredMessages = [
  'have no rights to send a message',
  'You have exceeded the limit of 60 requests per minute for your app',
  "message can't be deleted",
  'message is not modified',
  'Bad auth, check token/params',
  'replied message not found',
  'CHAT_WRITE_FORBIDDEN',
]

interface ExtraErrorInfo {
  ctx?: Context
  location?: string
}

function constructErrorMessage(
  error: Error,
  { ctx, location }: ExtraErrorInfo
) {
  const { message, stack } = error
  const chatInfo = ctx ? [`Chat <b>${ctx.chat.id}</b>`] : []
  if (ctx && 'username' in ctx.chat) {
    chatInfo.push(`@${ctx.chat.username}`)
  }
  return `${
    location ? `<b>${escape(location)}</b>${ctx ? '\n' : ''}` : ''
  }${chatInfo.filter((v) => !!v).join(', ')}\n${escape(
    message
  )}\n<code>${escape(stack)}</code>`
}

async function sendToTelegramAdmin(error: Error, info: ExtraErrorInfo) {
  try {
    if (ignoredMessages.find((m) => error.message.includes(m))) {
      return
    }
    const message = constructErrorMessage(error, info)
    await bot.api.sendMessage(process.env.ADMIN_ID, message, {
      parse_mode: 'HTML',
    })
  } catch (sendError) {
    console.error('Error reporting:', sendError)
  }
}

export default function report(error: Error, info: ExtraErrorInfo = {}) {
  void sendToTelegramAdmin(error, info)
}

function escape(s: string) {
  return s.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/&/g, '&amp;')
}
