/**
 * Discord webhook utility for sending rich embed messages.
 */

interface EmbedField {
  name: string;
  value: string;
}

export async function sendDiscordEmbed(
  title: string,
  fields: EmbedField[],
  color: number
): Promise<void> {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;

  if (!webhookUrl) {
    console.error("DISCORD_WEBHOOK_URL is not set — skipping Discord notification");
    return;
  }

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        embeds: [
          {
            title,
            fields: fields.map((f) => ({
              name: f.name,
              value: f.value,
              inline: false,
            })),
            color,
            timestamp: new Date().toISOString(),
          },
        ],
      }),
    });

    if (!response.ok) {
      console.error(
        `Discord webhook failed: ${response.status} ${response.statusText}`
      );
    }
  } catch (error) {
    console.error("Discord webhook error:", error);
  }
}
