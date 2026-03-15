import cloudinary from "@/lib/Cloudinary";
import { auth } from "@/lib/nextauth";

export async function POST(req: Request) {
    try {
        // Check session — uploader role required
        const session = await auth();
        const role = (session?.user as any)?.role;

        if (!session || role !== "uploader") {
            return Response.json({ error: "Unauthorized — uploader role required" }, { status: 401 });
        }

        const data = await req.formData();
        const file = data.get("file") as File;
        if (!file) return Response.json({ error: "No file provided" }, { status: 400 });

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const isVideo = file.type.startsWith("video/");

        const result = await new Promise((resolve, reject) => {
            cloudinary.uploader.upload_stream(
                {
                    folder: "vault-gallery",
                    resource_type: isVideo ? "video" : "image",
                    ...(isVideo ? {} : { transformation: [{ quality: "auto:good" }] }),
                },
                (error, result) => {
                    if (error) reject(error);
                    else resolve(result);
                }
            ).end(buffer);
        });

        return Response.json(result);
    } catch (err: any) {
        console.error("Upload error:", err);
        return Response.json({ error: err.message ?? "Upload failed" }, { status: 500 });
    }
}