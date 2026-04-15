import { Metadata } from "next";

export const defaultMetadata: Metadata = {
  title: "Word Works AI - Voice AI Solutions Dashboard",
  description: "Voice AI Solutions Dashboard",
};

export default function SEO({ metadata }: { metadata?: Metadata }) {
  console.log(metadata);
  return (
    <>
      {/* Next.js App Router automatically applies metadata from the page-level */}
    </>
  );
}
