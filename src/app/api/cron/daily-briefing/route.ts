import { processDailyBriefing } from "@/server/actions/automation";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    
    // Security check: Verify CRON_SECRET matches env variable
    // For Vercel Cron, this is automatically populated if configured
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      // Allow development bypass if explicitly enabled (optional)
      if (process.env.NODE_ENV === "production" || process.env.CRON_SECRET) {
          return new NextResponse("Unauthorized", { status: 401 });
      }
    }

    const result = await processDailyBriefing();

    if (result.success) {
      return NextResponse.json({ success: true, message: result.message });
    } else {
      return NextResponse.json({ success: false, error: result.message }, { status: 500 });
    }
  } catch (error) {
    console.error("Cron Job Error:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
