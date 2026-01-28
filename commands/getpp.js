const DEFAULT_PIC = 'https://i.imgur.com/2wzGhpF.jpeg';

function normalizeJid(input, fallbackJid) {
    if (!input) return fallbackJid;
    const digits = input.replace(/\D/g, '');
    if (!digits) return fallbackJid;
    return `${digits}@s.whatsapp.net`;
}

async function getProfilePicture(sock, targetJid) {
    try {
        return await sock.profilePictureUrl(targetJid, 'image');
    } catch {
        return DEFAULT_PIC;
    }
}

async function getppCommand(sock, chatId, message, args) {
    try {
        const senderId = message.key.participant || message.key.remoteJid;
        const targetArg = args?.[0] || '';
        const targetJid = normalizeJid(targetArg, senderId);

        const pp = await getProfilePicture(sock, targetJid);
        await sock.sendMessage(chatId, {
            image: { url: pp },
            caption: `Profile picture for @${targetJid.split('@')[0]}`,
            mentions: [targetJid]
        }, { quoted: message });
    } catch (error) {
        console.error('Error in getpp command:', error);
        await sock.sendMessage(chatId, { text: 'Failed to get profile picture!' }, { quoted: message });
    }
}

module.exports = getppCommand;
