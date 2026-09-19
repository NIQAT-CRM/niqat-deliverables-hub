"use client";

import { Button } from "@/components/ui/Button";

export function PrintButton() {
  return (
    <Button type="button" className="no-print" onClick={() => window.print()}>
      Print / Save as PDF
    </Button>
  );
}
