import { Suspense } from "react";
import PromptsClient from "@/components/promts-client";

export default function PromptsPageWrapper() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PromptsClient />
    </Suspense>
  );
}
