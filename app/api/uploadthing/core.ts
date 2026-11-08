import { createUploadthing, type FileRouter } from "uploadthing/next";
import { getClerkId } from "@/lib/server/session";

const f = createUploadthing();

export const ourFileRouter = {
  imageUploader: f({ image: { maxFileSize: "4MB", maxFileCount: 1 } })
    .middleware(async () => {
      const clerkId = await getClerkId();
      if (!clerkId) throw new Error("Unauthorized");
      return { clerkId };
    })
    .onUploadComplete(async () => {}),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
