const fs = require("fs");

const DB_PATH = "./database/trackers.json";
const STATE_PATH = "./database/state.json";

// 🧠 LOAD DB (trackers)
function loadDB() {
    try {
        return JSON.parse(fs.readFileSync(DB_PATH));
    } catch {
        return {};
    }
}

// 🧠 LOAD STATE (cache persistant V4)
function loadState() {
    try {
        return JSON.parse(fs.readFileSync(STATE_PATH));
    } catch {
        return {};
    }
}

// 🧠 SAVE STATE
function saveState(state) {
    fs.writeFileSync(STATE_PATH, JSON.stringify(state, null, 4));
}

// 🔥 MOCK FETCH (à brancher API TikTok plus tard)
async function fetchProfile(username) {
    return {
        postId: "post_" + username,
        bio: "bio_" + username,
        displayName: username,
        followers: Math.floor(Math.random() * 10000)
    };
}

// 🧠 SAFE COMPARE
function changed(a, b) {
    return (a ?? "").toString() !== (b ?? "").toString();
}

// 🧠 FORMAT CHANGE CLEAN
function formatChange(label, oldVal, newVal) {
    return `${label}\nancien : ${oldVal ?? "inconnu"}\nnouveau : ${newVal ?? "inconnu"}`;
}

module.exports = (client) => {

    let db = loadDB();
    let state = loadState();

    console.log("🟢 Stalker Engine V4 lancé");

    setInterval(async () => {

        db = loadDB();
        state = loadState();

        for (const userId in db) {

            const user = db[userId];
            const channel = client.channels.cache.get(user.channelId);

            if (!channel) continue;

            for (const username in user.targets) {

                const settings = user.targets[username];

                const data = await fetchProfile(username);

                const key = `${userId}_${username}`;

                const old = state[key] || {};
                const history = old.history || [];

                let changes = [];

                // 📢 POST
                if (settings.posts && changed(old.postId, data.postId)) {
                    changes.push(
                        "📢 Nouveau post\nancien : " + (old.postId ?? "aucun") +
                        "\nnouveau : " + data.postId
                    );
                }

                // 📝 BIO
                if (settings.bio && changed(old.bio, data.bio)) {
                    changes.push(formatChange("📝 Bio modifiée", old.bio, data.bio));
                }

                // 🪪 PSEUDO
                if (settings.displayName && changed(old.displayName, data.displayName)) {
                    changes.push(formatChange("🪪 Pseudo modifié", old.displayName, data.displayName));
                }

                // 👥 FOLLOWERS (anti bruit)
                if (settings.followers) {
                    const oldF = Number(old.followers || 0);
                    const newF = Number(data.followers || 0);

                    if (oldF !== newF) {
                        changes.push(`👥 Followers\nancien : ${oldF}\nnouveau : ${newF}`);
                    }
                }

                // 🚨 rien changé
                if (changes.length === 0) continue;

                // 🧠 UPDATE HISTORY (V4)
                history.push({
                    time: Date.now(),
                    changes
                });

                // 🔥 LIMIT HISTORY (anti overflow)
                if (history.length > 20) history.shift();

                // 🧠 SAVE STATE
                state[key] = {
                    ...data,
                    history
                };

                saveState(state);

                // 🔥 MESSAGE CLEAN
                let msg =
                    `🟢 INFO 📊 @${username}\n\n` +
                    changes.join("\n\n");

                // 👤 MENTIONS
                if (settings.mention?.length > 0) {
                    msg += `\n\n👤 Mention: ${settings.mention.map(u => `<@${u}>`).join(", ")}`;
                }

                channel.send(msg);
            }
        }

    }, 180000);
};
