const fs = require("fs");

function loadDB() {
    try {
        return JSON.parse(fs.readFileSync("./database/trackers.json"));
    } catch {
        return {};
    }
}

// 🔴 FAKE FETCH (pour l’instant)
async function fetchProfile(username) {
    return {
        postId: Math.floor(Math.random() * 100000),
        bio: "bio",
        displayName: "user",
        followers: Math.floor(Math.random() * 10000)
    };
}

module.exports = (client) => {

    const cache = {};

    setInterval(async () => {

        const db = loadDB();

        for (const userId in db) {

            const user = db[userId];
            const channel = client.channels.cache.get(user.channelId);

            if (!channel) continue;

            for (const username in user.targets) {

                const settings = user.targets[username];

                const data = await fetchProfile(username);
                const old = cache[`${userId}_${username}`] || {};
                cache[`${userId}_${username}`] = data;

                let messages = [];

                if (settings.posts && old.postId !== data.postId) {
                    messages.push("📢 Nouveau post détecté");
                }

                if (settings.bio && old.bio !== data.bio) {
                    messages.push("📝 Bio modifiée");
                }

                if (settings.followers && old.followers !== data.followers) {
                    messages.push("👥 Followers changés");
                }

                if (messages.length > 0) {
                    channel.send(
                        `📊 @${username}\n\n` + messages.join("\n")
                    );
                }
            }
        }

    }, 180000); // 3 min
};
