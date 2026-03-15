import cloudinary from "@/lib/Cloudinary";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const nextCursor = searchParams.get("next_cursor") ?? undefined;
        const type = searchParams.get("type") ?? "all";

        // Fetch both image and video if "all", else fetch by type
        const types = type === "all" ? ["image", "video"] : [type];

        const allResources: any[] = [];
        let lastCursor: string | null = null;

        for (const resourceType of types) {
            const result = await cloudinary.api.resources({
                type: "upload",
                prefix: "vault-gallery",
                resource_type: resourceType as "image" | "video",
                max_results: type === "all" ? 12 : 24,
                next_cursor: nextCursor,
                tags: true,
            });
            allResources.push(...(result.resources ?? []));
            if (result.next_cursor) lastCursor = result.next_cursor;
        }

        // Sort by created_at desc
        allResources.sort((a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );

        return Response.json({
            resources: allResources,
            next_cursor: lastCursor,
        });
    } catch (err: any) {
        console.error("Media API error:", err);
        return Response.json({ error: err.message, resources: [], next_cursor: null }, { status: 500 });
    }
}
