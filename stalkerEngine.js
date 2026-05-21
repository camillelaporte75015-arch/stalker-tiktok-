const fs = require("fs");

const DB_PATH = "./database/trackers.json";

function loadDB() {
    try {
        return JSON.parse(fs.readFileSync(DB_PATH));
    } catch {
        return {};
    }
}

module.exports = (client) => {

    console.log("🟢 ENGINE V7 FULL FIX lancé");

    const lastState = new Map();

    /* =========================
       USER UPDATE (GLOBAL)
    ========================= */

    client.on("userUpdate", (oldUser, newUser) => {

        const db = loadDB();

        const oldUsername = oldUser.username;
        const newUsername = newUser.username;

        const oldAvatar = oldUser.displayAvatarURL({ dynamic: true, size: 256 });
        const newAvatar = newUser.displayAvatarURL({ dynamic: true, size: 256 });

        for (const userId in db) {

            const user = db[userId];
            const channel = client.channels.cache.get(user.channelId);
            if (!channel) continue;

            for (const target in user.targets) {

                let changes = [];

                /* =========================
                   PSEUDO
                ========================= */
                if (oldUsername !== newUsername) {

                    const msg =
                        `🪪 Pseudo modifié\n` +
                        `ancien : ${oldUsername}\n` +
                        `nouveau : ${newUsername}`;

                    const key = `${userId}_${target}_username`;

                    if (lastState.get(key) !== msg) {
                        lastState.set(key, msg);
                        changes.push(msg);
                    }
                }

                /* =========================
                   AVATAR
                ========================= */
                if (oldAvatar !== newAvatar) {

                    const msg =
                        `🖼️ Avatar modifié\n` +
                        `ancien : ${oldAvatar}\n` +
                        `nouveau : ${newAvatar}`;

                    const key = `${userId}_${target}_avatar`;

                    if (lastState.get(key) !== msg) {
                        lastState.set(key, msg);
                        changes.push(msg);
                    }
                }

                if (changes.length === 0) continue;

                channel.send(
                    `🟢 INFO 📊 @${target}\n\n` +
                    changes.join("\n\n")
                );
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

                if (lastState.get(key) === msg) return;
                lastState.set(key, msg);

                channel.send(
                    `🟢 INFO 📊 @${target}\n\n` + msg
                );
            }
        }
    });

};
