const prisma = require("./prisma");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

/**
 * Persist newsletter subscriber to local database
 * Best-effort async operation to ensure we keep subscriber data even if
 * external newsletter service (Beehiiv) is unavailable.
 *
 * @param {string} email - Subscriber email
 * @param {string} firstName - First name (optional)
 * @param {string} lastName - Last name (optional)
 * @returns {Promise<void>}
 */
async function persistSubscriberLocally(email, firstName = "", lastName = "") {
    try {
        const fullName = `${firstName} ${lastName}`.trim();
        const existing = await prisma.user.findUnique({ where: { email } });

        if (!existing) {
            // Create new subscriber with random password
            const rounds = parseInt(process.env.BCRYPT_ROUNDS || "12", 10) || 12;
            const randomPw = crypto.randomBytes(16).toString("hex");
            const hashed = await bcrypt.hash(randomPw, await bcrypt.genSalt(rounds));

            await prisma.user.create({
                data: {
                    email,
                    name: fullName || undefined,
                    password: hashed,
                    role: "SUBSCRIBER",
                },
            });
        } else {
            // Update name if missing
            if (!existing.name && fullName) {
                await prisma.user.update({
                    where: { id: existing.id },
                    data: { name: fullName },
                });
            }
        }
    } catch (err) {
        // Log but don't throw - this is best-effort
        console.warn("Failed to persist subscriber locally:", err?.message);
    }
}

module.exports = {
    persistSubscriberLocally,
};
