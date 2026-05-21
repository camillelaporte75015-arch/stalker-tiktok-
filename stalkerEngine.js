const fs = require("fs");

function loadDB() {
    try {
        return JSON.parse(fs.readFileSync("./database/trackers.json"));
    } catch (e) {
        return {};
    }
}

// 🟡 FAKE FETCH STABLE (remplaçable plus tard par vrai scraper)
async function fetchProfile(username) {
    return {
        postId: "mock_" + username,
        bio: "bio_" + username,
        displayName: username,
        followers: Math.floor(Math.random() * 10000)
    };
}

module.exports = (client) => {

    const cache = {};

    console.log("🟢 Stalker Engine lancé");

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

                let messages = [];

                // 📢 POSTS
                if (settings.posts && old.postId !== data.postId) {
                    messages.push("📢 Nouveau post détecté");
                }

                // 📝 BIO
                if (settings.bio && old.bio !== data.bio) {
                    messages.push("📝 Bio modifiée");
                }

                // 🪪 PSEUDO
                if (settings.displayName && old.displayName !== data.displayName) {
                    messages.push("🪪 Pseudo modifié");
                }

                // 👥 FOLLOWERS
                if (settings.followers && old.followers !== data.followers) {
                    messages.push(`👥 Followers: ${old.followers || 0} → ${data.followers}`);
                }

                // 🔔 SEND
                if (messages.length > 0) {

                    let msg = `📊 @${username}\n\n` + messages.join("\n");

                    if (settings.mention && settings.mention.length > 0) {
                        msg += `\n\n👤 Mention: ${settings.mention.map(u => `<@${u}>`).join(", ")}`;
                    }

                    channel.send(msg);
                }
            }
        }

    }, 180000); // 3 min
};
