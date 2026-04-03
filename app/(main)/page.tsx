/** @format */

import HomePage from "@/components/home/HomePage";
import { auth } from "@/lib/auth";

export default async function Page() {
    const session = await auth();
    return <HomePage session={session} />;
}
