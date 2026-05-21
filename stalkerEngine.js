const fs = require("fs");

const DB_PATH = "./database/trackers.json";
const STATE_PATH = "./database/state.json";

/* =========================
   LOAD
========================= */
function load(file, fallback) {
    try {
        return JSON.parse(fs.readFileSync(file));
    } catch {
        return fallback;
    }
}

function save(file, data) {
    fs.writeFileSync(file, JSON.stringify(data, null, 4));
}

/* =========================
   MOCK FETCH
========================= */
async function fetchProfile(id) {
    return {
        id,
        fieldA: "value_" + id,
        fieldB: Math.floor(Math.random() * 1000),
        fieldC: "static"
    };
}

/* =========================
   COMPARE
========================= */
function changed(a, b) {
    return (a ?? "").toString() !== (b ?? "").toString();
}

/* =========================
   FORMAT
========================= */
function formatChange(label, oldV, newV) {
    return `**${label}**\nancien: ${oldV ?? "aucun"}\nnouveau: ${newV ?? "aucun"}`;
}

/* =========================
   ENGINE V6 UI
========================= */
module.exports = (client) => {

    let db = load(DB_PATH, {});
    let state = load(STATE_PATH, {});

    console.log("🟢 Engine V6 UI lancé");

    setInterval(async () => {

        db = load(DB_PATH, {});
        state = load(STATE_PATH, {});

        for (const userId in db) {

            const user = db[userId];
            const channel = client.channels.cache.get(user.channelId);

            if (!channel) continue;

            for (const id in user.targets) {

                const settings = user.targets[id];

                const data = await fetchProfile(id);

                const key = `${userId}_${id}`;
                const old = state[key] || {};
                const history = old.history || [];

                let changes = [];

                if (settings.fieldA && changed(old.fieldA, data.fieldA)) {
                    changes.push(formatChange("Field A", old.fieldA, data.fieldA));
                }

                if (settings.fieldB && changed(old.fieldB, data.fieldB)) {
                    changes.push(formatChange("Field B", old.fieldB, data.fieldB));
                }

                if (settings.fieldC && changed(old.fieldC, data.fieldC)) {
                    changes.push(formatChange("Field C", old.fieldC, data.fieldC));
                }

                if (changes.length === 0) continue;

                history.push({ time: Date.now(), changes });
                if (history.length > 15) history.shift();

                state[key] = { ...data, history };
                save(STATE_PATH, state);

                const { buildDashboard } = require("./ui/dashboard");

                const msg = await buildDashboard(id, changes);

                channel.send(msg);
            }
        }

    }, 90000);
};
