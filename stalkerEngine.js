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

    /* =========================
       ANTI DOUBLE LOAD (IMPORTANT)
    ========================= */
    if (global.__ENGINE_LOADED__) {
        console.log("⚠️ Engine déjà chargé (skip)");
        return;
    }
    global.__ENGINE_LOADED__ = true;

    console.log("🟢 ENGINE V9 CLEAN FIX lancé");

    const cache = new Map();

    /* =========================
       USER UPDATE
    ========================= */
    client.on("userUpdate", (oldUser, newUser) => {

        const db = loadDB();

        const oldUsername = oldUser.username;
        const newUsername = newUser.username;

        const oldAvatar = oldUser.displayAvatarURL?.({ size: 256, dynamic: true });
        const newAvatar = newUser.displayAvatarURL?.({ size: 256, dynamic: true });

        for (const userId in db) {

            const user = db[userId];
            const channel = client.channels.cache.get(user.channelId);
            if (!channel) continue;

            for (const target in user.targets) {

                const changes = [];

                /* =====================
                   PSEUDO
                ===================== */
                if (oldUsername !== newUsername) {

                    const msg =
                        `🪪 Pseudo modifié\n` +
                        `ancien : ${oldUsername}\n` +
                        `nouveau : ${newUsername}`;

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

                    const msg =
                        `🖼️ Avatar modifié\n` +
                        `ancien : ${oldAvatar}\n` +
                        `nouveau : ${newAvatar}`;

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

        if (oldMember.nickname === newMember.nickname) return;

        for (const userId in db) {

            const user = db[userId];
            const channel = client.channels.cache.get(user.channelId);
            if (!channel) continue;

            for (const target in user.targets) {

                const oldNick = oldMember.nickname || "none";
                const newNick = newMember.nickname || "none";

                const msg =
                    `🪪 Nickname modifié\n` +
                    `ancien : ${oldNick}\n` +
                    `nouveau : ${newNick}`;

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
