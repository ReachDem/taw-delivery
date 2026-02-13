"use client";

import { X, Truck } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ProposalForm } from "./proposal-form";
import { useIsMobile } from "@/hooks/use-mobile";

interface ProposalModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProposalModal({ open, onOpenChange }: ProposalModalProps) {
  const isMobile = useIsMobile();

  const handleSuccess = () => {
    onOpenChange(false);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  // Mobile: Use Drawer (bottom sheet)
  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[95vh]">
          <DrawerHeader className="border-b pb-4">
            <div className="flex items-center justify-between">
              <DrawerClose asChild>
                <Button variant="ghost" size="icon" className="-ml-2">
                  <X className="h-5 w-5" />
                </Button>
              </DrawerClose>
              <div className="text-center flex-1">
                <p className="text-xs text-emerald-600 font-semibold">
                  TGVAIRWABO
                </p>
                <DrawerTitle className="text-base">
                  Nouvelle Proposition
                </DrawerTitle>
              </div>
              <div className="w-10" /> {/* Spacer for balance */}
            </div>
          </DrawerHeader>
          <ScrollArea className="flex-1 p-4 overflow-y-auto max-h-[calc(95vh-100px)]">
            <ProposalForm
              onSuccess={handleSuccess}
              onCancel={handleCancel}
              showCancel={false}
            />
          </ScrollArea>
        </DrawerContent>
      </Drawer>
    );
  }

  // Desktop: Use Dialog (modal)
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="px-6 py-4 border-b shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-600 text-white">
              <Truck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-emerald-600 font-semibold">
                TGVAIRWABO
              </p>
              <DialogTitle>Nouvelle Proposition</DialogTitle>
            </div>
          </div>
        </DialogHeader>
        <ScrollArea className="flex-1 px-6 py-4">
          <ProposalForm
            onSuccess={handleSuccess}
            onCancel={handleCancel}
            showCancel={true}
          />
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
