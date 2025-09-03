import prisma from "@/lib/prisma";

export async function authorizeSlack(source: { teamId?: string }) {
  try {
    const { teamId } = source;

    if (!teamId) {
      throw new Error("No team ID provided");
    }
    const installation = await prisma.slackInstallation.findUnique({
      where: {
        teamId,
      },
    });

    if (!installation || !installation.active) {
      console.error("Installaion not found or inactive for the team:", teamId);
      throw new Error(`Installation not found for team: ${teamId}`);
    }

    return {
      botToken: installation.botToken,
      teamId: installation.teamId,
    };
  } catch (error) {
    console.error("Auth error:", error);
    throw error;
  }
}
