const fs = require("fs");

const DB_PATH = "./database/trackers.json";
const STATE_PATH = "./database/state.json";

/* =========================
   LOAD DB
========================= */
function loadDB() {
    try {
        return JSON.parse(fs.readFileSync(DB_PATH));
    } catch {
        return {};
    }
}

/* =========================
   LOAD STATE
========================= */
function loadState() {
    try {
        return JSON.parse(fs.readFileSync(STATE_PATH));
    } catch {
        return {};
    }
}

/* =========================
   SAVE STATE
========================= */
function saveState(state) {
    fs.writeFileSync(STATE_PATH, JSON.stringify(state, null, 4));
}

/* =========================
   MOCK FETCH (API later)
========================= */
async function fetchProfile(username) {
    return {
        bio: "bio_" + username,
        displayName: username,
        followers: Math.floor(Math.random() * 10000),
        avatar: "https://via.placeholder.com/150"
    };
}

/* =========================
   FORMAT HELPERS
========================= */
function formatBlock(title, oldVal, newVal) {
    return `${title}\nancien : ${oldVal ?? "null"}\nnouveau : ${newVal ?? "null"}`;
}

/* =========================
   ENGINE V6+
========================= */
module.exports = (client) => {

    let state = loadState();
    const lastSent = {};

    console.log("🟢 ENGINE V6+ lancé");

    setInterval(async () => {

        const db = loadDB();
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

                let changes = [];

                /* =========================
                   BIO
                ========================= */
                if (settings.bio && old.bio !== data.bio) {
                    changes.push(formatBlock("📝 Bio modifiée", old.bio, data.bio));
                }

                /* =========================
                   PSEUDO
                ========================= */
                if (settings.displayName && old.displayName !== data.displayName) {
                    changes.push(formatBlock("🪪 Pseudo modifié", old.displayName, data.displayName));
                }

                /* =========================
                   FOLLOWERS
                ========================= */
                if (settings.followers) {
                    const oldF = Number(old.followers || 0);
                    const newF = Number(data.followers || 0);

                    if (oldF !== newF) {
                        changes.push(
                            `👥 Followers\nancien : ${oldF}\nnouveau : ${newF} (+${newF - oldF})`
                        );
                    }
                }

                /* =========================
                   AVATAR
                ========================= */
                if (settings.avatar && old.avatar !== data.avatar) {
                    changes.push("🖼️ Avatar modifié");
                }

                /* =========================
                   NO CHANGES
                ========================= */
                if (changes.length === 0) continue;

                /* =========================
                   ANTI DUPLICATE SIMPLE
                ========================= */
                const hash = JSON.stringify(changes);
                if (lastSent[key] === hash) continue;
                lastSent[key] = hash;

                /* =========================
                   UPDATE STATE
                ========================= */
                state[key] = {
                    ...data,
                    lastUpdate: Date.now()
                };

                saveState(state);

                /* =========================
                   SEND MESSAGE
                ========================= */
                const base = `🟢 INFO 📊 @${username}\n\n`;

                let msg;

                if (changes.length === 1) {
                    msg = base + changes[0];
                } else {
                    msg = base + changes.join("\n\n");
                }

                channel.send(msg);
            }
        }

    }, 60000); // 1 minute clean
};
