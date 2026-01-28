const { downloadContentFromMessage } = require('@whiskeysockets/baileys');

async function viewonceCommand(sock, chatId, message, targetChatId = chatId) {
    // Extract quoted imageMessage or videoMessage from your structure
    const quoted = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    const quotedImage = quoted?.imageMessage;
    const quotedVideo = quoted?.videoMessage;

    if (quotedImage && quotedImage.viewOnce) {
        // Download and send the image
        const stream = await downloadContentFromMessage(quotedImage, 'image');
        let buffer = Buffer.from([]);
        for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);
        const quote = targetChatId === chatId ? { quoted: message } : undefined;
        await sock.sendMessage(targetChatId, { image: buffer, fileName: 'media.jpg', caption: quotedImage.caption || '' }, quote);
    } else if (quotedVideo && quotedVideo.viewOnce) {
        // Download and send the video
        const stream = await downloadContentFromMessage(quotedVideo, 'video');
        let buffer = Buffer.from([]);
        for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);
        const quote = targetChatId === chatId ? { quoted: message } : undefined;
        await sock.sendMessage(targetChatId, { video: buffer, fileName: 'media.mp4', caption: quotedVideo.caption || '' }, quote);
    } else {
        await sock.sendMessage(chatId, { text: '❌ Please reply to a view-once image or video.' }, { quoted: message });
    }
}

module.exports = viewonceCommand; 
