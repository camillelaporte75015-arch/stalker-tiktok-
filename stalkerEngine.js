const fs = require("fs");

const DB_PATH = "./database/trackers.json";

function loadDB() {
    try {
        return JSON.parse(fs.readFileSync(DB_PATH, "utf8"));
    } catch {
        return {};
    }
}

module.exports = (client) => {

    console.log("🟢 ENGINE V8 CLEAN FIX lancé");

    const cache = new Map();

    /* =========================
       USER UPDATE (GLOBAL)
    ========================= */

    client.on("userUpdate", (oldUser, newUser) => {

        const db = loadDB();

        const oldUsername = oldUser?.username || null;
        const newUsername = newUser?.username || null;

        const oldAvatar = oldUser?.avatar;
        const newAvatar = newUser?.avatar;

        for (const userId in db) {

            const data = db[userId];
            const channel = client.channels.cache.get(data.channelId);
            if (!channel) continue;

            for (const target in data.targets) {

                const changes = [];

                /* =====================
                   PSEUDO
                ===================== */
                if (oldUsername && newUsername && oldUsername !== newUsername) {

                    const msg =
                        `🪪 Pseudo modifié\nancien : ${oldUsername}\nnouveau : ${newUsername}`;

                    const key = `${userId}_${target}_username`;

                    if (cache.get(key) !== msg) {
                        cache.set(key, msg);
                        changes.push(msg);
                    }
                }

                /* =====================
                   AVATAR
                ===================== */
                if (oldAvatar !== newAvatar) {

                    const oldAvatarURL = oldUser?.displayAvatarURL?.({ size: 256 }) || "none";
                    const newAvatarURL = newUser?.displayAvatarURL?.({ size: 256 }) || "none";

                    const msg =
                        `🖼️ Avatar modifié\nancien : ${oldAvatarURL}\nnouveau : ${newAvatarURL}`;

                    const key = `${userId}_${target}_avatar`;

                    if (cache.get(key) !== msg) {
                        cache.set(key, msg);
                        changes.push(msg);
                    }
                }

                if (changes.length === 0) continue;

                channel.send(
                    `🟢 UPDATE 📊 @${target}\n\n` +
                    changes.join("\n\n")
                ).catch(() => {});
            }
        }
    });

    /* =========================
       NICKNAME UPDATE
    ========================= */

    client.on("guildMemberUpdate", (oldMember, newMember) => {

        const db = loadDB();

        const oldNick = oldMember?.nickname || "none";
        const newNick = newMember?.nickname || "none";

        if (oldNick === newNick) return;

        for (const userId in db) {

            const data = db[userId];
            const channel = client.channels.cache.get(data.channelId);
            if (!channel) continue;

            for (const target in data.targets) {

                const msg =
                    `🪪 Nickname modifié\nancien : ${oldNick}\nnouveau : ${newNick}`;

                const key = `${userId}_${target}_nick`;

                if (cache.get(key) === msg) continue;

                cache.set(key, msg);

                channel.send(
                    `🟢 UPDATE 📊 @${target}\n\n${msg}`
                ).catch(() => {});
            }
        }
    });

};
