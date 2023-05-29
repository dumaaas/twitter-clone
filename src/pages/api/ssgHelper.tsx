import { createServerSideHelpers } from "@trpc/react-query/server"
import SuperJSON from "superjson"
import { appRouter } from "~/server/api/root"
import { createInnerTRPCContext } from "~/server/api/trpc"

export function ssgHelper() {
    return createServerSideHelpers({
        router: appRouter,
        ctx: createInnerTRPCContext({ session: null, revalidateSSG: null }),
        transformer: SuperJSON
    })
}