"use client";

import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogFooter, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type ThemeFormModalProps = {
  open: boolean;
  title: string;
  submitLabel: string;
  initialValues?: {
    title: string;
    description: string;
  };
  loading?: boolean;
  onClose: () => void;
  onSubmit: (values: { title: string; description: string }) => Promise<void> | void;
};

export default function ThemeFormModal({
  open,
  title,
  submitLabel,
  initialValues,
  loading = false,
  onClose,
  onSubmit,
}: ThemeFormModalProps) {
  const titleRef = useRef<HTMLInputElement | null>(null);
  const descriptionRef = useRef<HTMLTextAreaElement | null>(null);

  if (!open) return null;

  return (
    <Dialog open={open} onClose={onClose}>
      <div>
        <DialogTitle>{title}</DialogTitle>
        <div className="mt-4 space-y-3">
          <Input
            ref={titleRef}
            defaultValue={initialValues?.title || ""}
            placeholder="Theme title"
          />
          <Textarea
            ref={descriptionRef}
            defaultValue={initialValues?.description || ""}
            className="min-h-28"
            placeholder="Theme description"
          />
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={loading}
            onClick={() =>
              onSubmit({
                title: titleRef.current?.value || "",
                description: descriptionRef.current?.value || "",
              })
            }
          >
            {loading ? "Saving..." : submitLabel}
          </Button>
        </DialogFooter>
      </div>
    </Dialog>
  );
}
