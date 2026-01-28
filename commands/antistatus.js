const { isJidGroup } = require('@whiskeysockets/baileys');
const { getAntistatus, setAntistatus, removeAntistatus, isSudo } = require('../lib/index');
const isAdmin = require('../lib/isAdmin');

function extractMessageText(message) {
    return (
        message.message?.conversation ||
        message.message?.extendedTextMessage?.text ||
        message.message?.imageMessage?.caption ||
        message.message?.videoMessage?.caption ||
        ''
    );
}

function hasStatusMention(message) {
    const text = extractMessageText(message);
    if (typeof text !== 'string' || !text.trim()) return false;

    const statusLinkRegex = /(https?:\/\/)?(wa\.me\/status|whatsapp\.com\/status)\/[^\s]+/i;
    if (statusLinkRegex.test(text)) return true;

    const mentionRegex = /status@broadcast/i;
    if (mentionRegex.test(text)) return true;

    const mentionedJids = message.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    return mentionedJids.some(jid => jid === 'status@broadcast');
}

async function handleAntistatusCommand(sock, chatId, userMessage, senderId, isSenderAdmin, message) {
    try {
        if (!isSenderAdmin) {
            await sock.sendMessage(chatId, { text: '```For Group Admins Only!```' }, { quoted: message });
            return;
        }

        const args = userMessage.slice(11).toLowerCase().trim().split(' ');
        const action = args[0];

        if (!action) {
            const usage = '```ANTISTATUS SETUP\n\n.antistatus on\n.antistatus off\n```';
            await sock.sendMessage(chatId, { text: usage }, { quoted: message });
            return;
        }

        switch (action) {
            case 'on':
                await setAntistatus(chatId, 'on');
                await sock.sendMessage(chatId, { text: '*_Antistatus has been turned ON_*' }, { quoted: message });
                break;
            case 'off':
                await removeAntistatus(chatId);
                await sock.sendMessage(chatId, { text: '*_Antistatus has been turned OFF_*' }, { quoted: message });
                break;
            case 'get':
                const status = await getAntistatus(chatId, 'on');
                await sock.sendMessage(chatId, { text: `*_Antistatus Configuration:_*\nStatus: ${status ? 'ON' : 'OFF'}` }, { quoted: message });
                break;
            default:
                await sock.sendMessage(chatId, { text: '*_Use .antistatus for usage._*' }, { quoted: message });
        }
    } catch (error) {
        console.error('Error in antistatus command:', error);
        await sock.sendMessage(chatId, { text: '*_Error processing antistatus command_*' }, { quoted: message });
    }
}

async function handleStatusMentionDetection(sock, chatId, message, senderId) {
    try {
        if (!isJidGroup(chatId)) return;

        const antistatusSetting = await getAntistatus(chatId, 'on');
        if (!antistatusSetting || !antistatusSetting.enabled) return;

        if (!hasStatusMention(message)) return;

        const { isSenderAdmin } = await isAdmin(sock, chatId, senderId);
        if (isSenderAdmin) return;
        const senderIsSudo = await isSudo(senderId);
        if (senderIsSudo) return;

        await sock.sendMessage(chatId, {
            delete: {
                remoteJid: chatId,
                fromMe: false,
                id: message.key.id,
                participant: senderId
            }
        });

        await sock.sendMessage(chatId, {
            text: `\`\`\`@${senderId.split('@')[0]} status mention not allowed here\`\`\``,
            mentions: [senderId]
        }, { quoted: message });
    } catch (error) {
        console.error('Error in status mention detection:', error);
    }
}

module.exports = {
    handleAntistatusCommand,
    handleStatusMentionDetection
};
