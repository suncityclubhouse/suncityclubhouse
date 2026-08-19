"use client";

import { useState } from "react";
import { FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MultiInvoiceModal } from "@/components/admin/MultiInvoiceModal";

export function BookingsActionBar() {
  const [invoiceOpen, setInvoiceOpen] = useState(false);

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setInvoiceOpen(true)}
        className="gap-2 border-stone-200 text-stone-700 hover:bg-stone-50 hover:border-stone-300 transition-all"
      >
        <FileText className="w-3.5 h-3.5" />
        Create Invoice
      </Button>

      <MultiInvoiceModal
        open={invoiceOpen}
        onClose={() => setInvoiceOpen(false)}
      />
    </>
  );
}
