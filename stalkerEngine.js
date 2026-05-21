const fs = require("fs");

function loadDB() {
    try {
        return JSON.parse(fs.readFileSync("./database/trackers.json"));
    } catch {
        return {};
    }
}

// 🔥 FETCH (placeholder à brancher API réelle TikTok)
async function fetchProfile(username) {
    return {
        postId: null,
        bio: "",
        displayName: username,
        followers: 0
    };
}

// 🔥 CLEAN COMPARE
function changed(a, b) {
    return JSON.stringify(a ?? "") !== JSON.stringify(b ?? "");
}

// 🔥 SCORE SYSTEM
function getSeverity(change) {
    if (change.includes("post")) return 3;      // important
    if (change.includes("Followers")) return 2; // moyen
    return 1;                                   // faible
}

module.exports = (client) => {

    const cache = {};
    const lastSent = {};

    console.log("🟢 Stalker Engine V2 lancé");

    setInterval(async () => {

        const db = loadDB();

        for (const userId in db) {

            const user = db[userId];
            const channel = client.channels.cache.get(user.channelId);

            if (!channel) continue;

            for (const username in user.targets) {

                const settings = user.targets[username];

                const data = await fetchProfile(username);
                const key = `${userId}_${username}`;

                const old = cache[key] || {};
                cache[key] = data;

                let changes = [];

                // 📢 POSTS
                if (settings.posts && changed(old.postId, data.postId)) {
                    changes.push("📢 Nouveau post");
                }

                // 📝 BIO
                if (settings.bio && changed(old.bio, data.bio)) {
                    changes.push("📝 Bio modifiée");
                }

                // 🪪 USERNAME
                if (settings.displayName && changed(old.displayName, data.displayName)) {
                    changes.push("🪪 Pseudo modifié");
                }

                // 👥 FOLLOWERS (anti bruit)
                if (settings.followers) {
                    const oldF = Number(old.followers || 0);
                    const newF = Number(data.followers || 0);

                    if (Math.abs(oldF - newF) >= 5) {
                        changes.push(`👥 Followers: ${oldF} → ${newF}`);
                    }
                }

                // 🚨 SI RIEN → STOP TOTAL
                if (changes.length === 0) continue;

                // 🔥 ANTI DUPLICATE MESSAGE
                const hash = JSON.stringify(changes);
                if (lastSent[key] === hash) continue;
                lastSent[key] = hash;

                // 🔥 SCORE GLOBAL
                const severity = Math.max(...changes.map(getSeverity));

                let prefix =
                    severity === 3 ? "🔴 ALERTE" :
                    severity === 2 ? "🟡 UPDATE" :
                    "🟢 INFO";

                let msg =
                    `${prefix} 📊 @${username}\n\n` +
                    changes.join("\n");

                if (settings.mention?.length > 0) {
                    msg += `\n\n👤 Mention: ${settings.mention.map(u => `<@${u}>`).join(", ")}`;
                }

                channel.send(msg);
            }
        }

    }, 180000);
};
