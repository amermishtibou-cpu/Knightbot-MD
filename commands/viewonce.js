const { downloadContentFromMessage } = require('@whiskeysockets/baileys');

async function downloadViewOnceMedia(mediaMessage, mediaType) {
    const stream = await downloadContentFromMessage(mediaMessage, mediaType);
    let buffer = Buffer.from([]);
    for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);
    return buffer;
}

function getViewOncePayload(message) {
    const quoted = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    const quotedImage = quoted?.imageMessage;
    const quotedVideo = quoted?.videoMessage;

    if (quotedImage && quotedImage.viewOnce) {
        return {
            type: 'image',
            message: quotedImage,
            caption: quotedImage.caption || '',
            fileName: 'media.jpg'
        };
    }

    if (quotedVideo && quotedVideo.viewOnce) {
        return {
            type: 'video',
            message: quotedVideo,
            caption: quotedVideo.caption || '',
            fileName: 'media.mp4'
        };
    }

    return null;
}

async function viewOnceCommand(sock, chatId, message) {
    const payload = getViewOncePayload(message);
    if (!payload) {
        await sock.sendMessage(chatId, { text: '❌ Please reply to a view-once image or video.' }, { quoted: message });
        return;
    }

    const buffer = await downloadViewOnceMedia(payload.message, payload.type);
    const content = payload.type === 'image'
        ? { image: buffer, fileName: payload.fileName, caption: payload.caption }
        : { video: buffer, fileName: payload.fileName, caption: payload.caption };

    await sock.sendMessage(chatId, content, { quoted: message });
}

async function viewOncePersonalCommand(sock, chatId, senderId, message) {
    const payload = getViewOncePayload(message);
    if (!payload) {
        await sock.sendMessage(chatId, { text: '❌ Please reply to a view-once image or video.' }, { quoted: message });
        return;
    }

    const buffer = await downloadViewOnceMedia(payload.message, payload.type);
    const content = payload.type === 'image'
        ? { image: buffer, fileName: payload.fileName, caption: payload.caption }
        : { video: buffer, fileName: payload.fileName, caption: payload.caption };

    await sock.sendMessage(senderId, content);
    if (chatId !== senderId) {
        await sock.sendMessage(chatId, { text: '✅ Sent the view-once media to your personal chat.' }, { quoted: message });
    }
}

module.exports = { viewOnceCommand, viewOncePersonalCommand };
