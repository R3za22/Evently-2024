"use client";
import { useState } from "react";
import { IS_MOCK } from "@/lib/config";

export default function ResetButton() {
  const [done, setDone] = useState(false);
  if (!IS_MOCK) return null;
  return (
    <div className="flex items-center gap-4">
      <button
        type="button"
        className="btn btn-outline"
        onClick={async () => {
          const { resetMock } = await import("@/lib/api/mock");
          resetMock();
          window.dispatchEvent(new Event("evently-auth"));
          setDone(true);
        }}
      >
        Reset demo data
      </button>
      {done && <span role="status" className="text-paid">Demo data restored.</span>}
    </div>
  );
}
