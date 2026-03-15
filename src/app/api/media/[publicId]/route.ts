import cloudinary from "@/lib/Cloudinary";
import { auth } from "@/lib/nextauth";

export async function DELETE(
    req: Request,
    { params }: { params: { publicId: string } }
) {
    const session = await auth();
    if (!session || (session.user as any)?.role !== "uploader") {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const publicId = decodeURIComponent(params.publicId);
    const { resource_type } = await req.json().catch(() => ({ resource_type: "image" }));

    await cloudinary.uploader.destroy(publicId, { resource_type: resource_type ?? "image" });
    return Response.json({ success: true });
}
