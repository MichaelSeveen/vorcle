import { GetMeetingDataSchema } from "@/lib/zod-schema";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { unstable_cache } from "@/lib/data-table/unstable_cache";

interface PastMeetings {
  userId: string;
  input: GetMeetingDataSchema;
}

export async function getPastMeetings({ userId, input }: PastMeetings) {
  return await unstable_cache(
    async () => {
      try {
        const offset = (input.page - 1) * input.perPage;

        const where: Prisma.MeetingWhereInput = {
          userId,
          meetingEnded: true,
          AND: [
            input.title
              ? {
                  title: { contains: input.title, mode: "insensitive" },
                }
              : {},

            input.createdAt?.length > 0
              ? {
                  createdAt: {
                    gte: input.createdAt[0]
                      ? new Date(Number(input.createdAt[0]))
                      : undefined,
                    lte: input.createdAt[1]
                      ? new Date(Number(input.createdAt[1]))
                      : undefined,
                  },
                }
              : {},
          ],
        };

        const orderBy: Prisma.MeetingOrderByWithRelationInput[] =
          input.sort?.length > 0
            ? input.sort.map((item) => ({
                [item.id]: item.desc ? "desc" : "asc",
              }))
            : [{ createdAt: "desc" }];

        const [data, total] = await Promise.all([
          prisma.meeting.findMany({
            where,
            orderBy,
            skip: offset,
            take: input.perPage,
          }),

          prisma.meeting.count({ where }),
        ]);

        const pageCount = Math.ceil(total / input.perPage);

        return {
          data,
          pageCount,
        };
      } catch (error) {
        console.error("Error fetching past meetings", error);
        return {
          data: [],
          pageCount: 0,
        };
      }
    },
    [JSON.stringify(input)],
    {
      revalidate: 1,
      tags: ["user-past-meetings"],
    }
  )();
}
