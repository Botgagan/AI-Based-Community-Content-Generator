"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import { url } from "@/lib/axiosInstance";
import { Dialog, DialogDescription, DialogFooter, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type ToastVariant = "default" | "success" | "error";

type ToastInput = {
  title: string;
  description?: string;
  variant?: ToastVariant;
  durationMs?: number;
};

type ToastItem = ToastInput & {
  id: number;
};

type ConfirmOptions = {
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
};

type PromptOptions = {
  title: string;
  description?: string;
  placeholder?: string;
  defaultValue?: string;
  confirmText?: string;
  cancelText?: string;
};

type UIContextValue = {
  toast: (input: ToastInput) => void;
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  prompt: (options: PromptOptions) => Promise<string | null>;
  openInviteModal: (communityId: string) => void;
  showLoader: () => void;
  hideLoader: () => void;
};

const UIContext = createContext<UIContextValue | null>(null);

type ConfirmModalState = {
  type: "confirm";
  options: ConfirmOptions;
  resolve: (value: boolean) => void;
};

type PromptModalState = {
  type: "prompt";
  options: PromptOptions;
  resolve: (value: string | null) => void;
};

type InviteModalState = {
  type: "invite";
  communityId: string;
};

type ModalState = ConfirmModalState | PromptModalState | InviteModalState | null;

export function UIProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [modal, setModal] = useState<ModalState>(null);
  const [globalLoaderCount, setGlobalLoaderCount] = useState(0);

  const [promptValue, setPromptValue] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState("");

  const toastIdRef = useRef(0);

  const hideLoader = useCallback(() => {
    setGlobalLoaderCount((prev) => Math.max(0, prev - 1));
  }, []);

  const showLoader = useCallback(() => {
    setGlobalLoaderCount((prev) => prev + 1);
  }, []);

  const toast = useCallback((input: ToastInput) => {
    const id = ++toastIdRef.current;
    const item: ToastItem = {
      id,
      variant: "default",
      durationMs: 2600,
      ...input,
    };

    setToasts((prev) => [...prev, item]);

    window.setTimeout(() => {
      setToasts((prev) => prev.filter((toastItem) => toastItem.id !== id));
    }, item.durationMs);
  }, []);

  const confirm = useCallback((options: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      setModal({
        type: "confirm",
        options,
        resolve,
      });
    });
  }, []);

  const prompt = useCallback((options: PromptOptions) => {
    return new Promise<string | null>((resolve) => {
      setPromptValue(options.defaultValue || "");
      setModal({
        type: "prompt",
        options,
        resolve,
      });
    });
  }, []);

  const openInviteModal = useCallback((communityId: string) => {
    setInviteEmail("");
    setInviteError("");
    setModal({
      type: "invite",
      communityId,
    });
  }, []);

  const closeModal = () => {
    setModal(null);
    setInviteError("");
  };

  const handleInviteSubmit = async () => {
    if (!modal || modal.type !== "invite") return;

    if (!inviteEmail.trim()) {
      setInviteError("Email is required");
      return;
    }

    try {
      setInviteLoading(true);
      setInviteError("");

      await url.post("/api/invite/send", {
        communityId: modal.communityId,
        email: inviteEmail.trim(),
      });

      toast({
        title: "Invite sent",
        description: "Invite link sent successfully.",
        variant: "success",
      });

      closeModal();
    } catch {
      setInviteError("Failed to send invite. Please try again.");
      toast({
        title: "Invite failed",
        description: "Could not send invite.",
        variant: "error",
      });
    } finally {
      setInviteLoading(false);
    }
  };

  const contextValue = useMemo<UIContextValue>(
    () => ({
      toast,
      confirm,
      prompt,
      openInviteModal,
      showLoader,
      hideLoader,
    }),
    [confirm, hideLoader, openInviteModal, prompt, showLoader, toast]
  );

  const overlayVisible = globalLoaderCount > 0;

  return (
    <UIContext.Provider value={contextValue}>
      {children}

      {overlayVisible && (
        <div className="pointer-events-none fixed inset-0 z-[120] flex items-center justify-center bg-black/20 backdrop-blur-[1px]">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#0071e3]/25 border-t-[#0071e3]" />
        </div>
      )}

      <div className="pointer-events-none fixed right-3 top-3 z-[140] flex w-[calc(100%-1.5rem)] max-w-sm flex-col gap-2 sm:right-5 sm:top-5">
        {toasts.map((item) => (
          <div
            key={item.id}
            className={`pointer-events-auto rounded-[8px] border p-3 shadow-lg backdrop-blur-md ${
              item.variant === "success"
                ? "border-[#0071e3]/25 bg-white text-[#1d1d1f]"
                : item.variant === "error"
                  ? "border-[#1d1d1f]/20 bg-[#1d1d1f] text-white"
                  : "border-white/70 bg-white/95 text-[#1d1d1f]"
            }`}
          >
            <p className="text-sm font-bold">{item.title}</p>
            {item.description ? <p className="mt-1 text-xs opacity-90">{item.description}</p> : null}
          </div>
        ))}
      </div>

      {modal ? (
        <Dialog open={Boolean(modal)} onClose={closeModal} className="max-w-md">
            {modal.type === "confirm" && (
              <>
                <DialogTitle>{modal.options.title}</DialogTitle>
                {modal.options.description ? <DialogDescription>{modal.options.description}</DialogDescription> : null}
                <DialogFooter>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      modal.resolve(false);
                      closeModal();
                    }}
                  >
                    {modal.options.cancelText || "Cancel"}
                  </Button>
                  <Button
                    variant={modal.options.danger ? "destructive" : "default"}
                    onClick={() => {
                      modal.resolve(true);
                      closeModal();
                    }}
                  >
                    {modal.options.confirmText || "Confirm"}
                  </Button>
                </DialogFooter>
              </>
            )}

            {modal.type === "prompt" && (
              <>
                <DialogTitle>{modal.options.title}</DialogTitle>
                {modal.options.description ? <DialogDescription>{modal.options.description}</DialogDescription> : null}
                <Input
                  className="mt-4"
                  placeholder={modal.options.placeholder || "Type here"}
                  value={promptValue}
                  onChange={(e) => setPromptValue(e.target.value)}
                />
                <DialogFooter>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      modal.resolve(null);
                      closeModal();
                    }}
                  >
                    {modal.options.cancelText || "Cancel"}
                  </Button>
                  <Button
                    onClick={() => {
                      modal.resolve(promptValue);
                      closeModal();
                    }}
                  >
                    {modal.options.confirmText || "Submit"}
                  </Button>
                </DialogFooter>
              </>
            )}

            {modal.type === "invite" && (
              <>
                <DialogTitle>Invite Member</DialogTitle>
                <DialogDescription>Send an invite link to add someone to this community.</DialogDescription>
                <Input
                  className="mt-4"
                  placeholder="name@example.com"
                  value={inviteEmail}
                  onChange={(e) => {
                    setInviteEmail(e.target.value);
                    if (inviteError) setInviteError("");
                  }}
                />
                {inviteError ? <p className="mt-2 text-sm text-[#0066cc]">{inviteError}</p> : null}
                <DialogFooter>
                  <Button variant="secondary" onClick={closeModal}>
                    Cancel
                  </Button>
                  <Button onClick={handleInviteSubmit} disabled={inviteLoading}>
                    {inviteLoading ? "Sending..." : "Send Invite"}
                  </Button>
                </DialogFooter>
              </>
            )}
        </Dialog>
      ) : null}
    </UIContext.Provider>
  );
}

export function useUI() {
  const context = useContext(UIContext);
  if (!context) {
    throw new Error("useUI must be used inside UIProvider");
  }
  return context;
}



