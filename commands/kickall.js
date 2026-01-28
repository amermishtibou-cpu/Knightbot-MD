const isAdmin = require('../lib/isAdmin');

async function kickAllCommand(sock, chatId, senderId, message) {
    const isOwner = message.key.fromMe;
    if (!isOwner) {
        const { isSenderAdmin, isBotAdmin } = await isAdmin(sock, chatId, senderId);

        if (!isBotAdmin) {
            await sock.sendMessage(chatId, { text: 'Please make the bot an admin first.' }, { quoted: message });
            return;
        }

        if (!isSenderAdmin) {
            await sock.sendMessage(chatId, { text: 'Only group admins can use the kickall command.' }, { quoted: message });
            return;
        }
    }

    const metadata = await sock.groupMetadata(chatId);
    const participants = metadata.participants || [];
    const botId = sock.user?.id || '';
    const botLid = sock.user?.lid || '';
    const botNumber = botId.includes(':') ? botId.split(':')[0] : (botId.includes('@') ? botId.split('@')[0] : botId);
    const botLidNumeric = botLid.includes(':') ? botLid.split(':')[0] : (botLid.includes('@') ? botLid.split('@')[0] : botLid);

    const usersToKick = participants
        .filter(p => p.admin !== 'admin' && p.admin !== 'superadmin')
        .map(p => p.id || p.lid)
        .filter(Boolean)
        .filter(userId => {
            const userPhoneNumber = userId.includes(':') ? userId.split(':')[0] : (userId.includes('@') ? userId.split('@')[0] : userId);
            const userLidNumeric = userId.includes('@lid') ? userId.split('@')[0].split(':')[0] : '';

            if (
                userId === botId ||
                userId === botLid ||
                userPhoneNumber === botNumber ||
                (userLidNumeric && botLidNumeric && userLidNumeric === botLidNumeric)
            ) {
                return false;
            }

            return true;
        });

    if (usersToKick.length === 0) {
        await sock.sendMessage(chatId, { text: 'No non-admin members to kick.' }, { quoted: message });
        return;
    }

    try {
        await sock.groupParticipantsUpdate(chatId, usersToKick, 'remove');
        await sock.sendMessage(chatId, { text: `Kicked ${usersToKick.length} members successfully.` });
    } catch (error) {
        console.error('Error in kickall command:', error);
        await sock.sendMessage(chatId, { text: 'Failed to kick members!' });
    }
}

module.exports = kickAllCommand;
