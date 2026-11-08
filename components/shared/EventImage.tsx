/* eslint-disable @next/next/no-img-element */
import { withBase } from "@/lib/utils";

/** Plain <img>: works in the static export, with data: URLs from the mock upload, and with remote uploadthing URLs. */
export default function EventImage({ src, alt = "", className, eager }: { src: string; alt?: string; className?: string; eager?: boolean }) {
  return <img src={withBase(src)} alt={alt} loading={eager ? "eager" : "lazy"} decoding="async" className={className} />;
}
