"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  User,
  Phone,
  Mail,
  Package,
  QrCode,
  Loader2,
  Send,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

const proposalFormSchema = z.object({
  // Client Information
  clientName: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  phone: z
    .string()
    .min(9, "Numéro de téléphone invalide")
    .regex(/^[\d\s+()-]+$/, "Format de téléphone invalide"),
  email: z.string().email("Email invalide").optional().or(z.literal("")),

  // Shipment Details
  refId: z.string().optional(),
  contents: z.string().min(3, "Description requise"),
  amount: z.string().optional(),
});

type ProposalFormData = z.infer<typeof proposalFormSchema>;

interface ProposalFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  showCancel?: boolean;
}

export function ProposalForm({
  onSuccess,
  onCancel,
  showCancel = false,
}: ProposalFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState<"form" | "sending">("form");

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ProposalFormData>({
    resolver: zodResolver(proposalFormSchema),
    defaultValues: {
      clientName: "",
      phone: "",
      email: "",
      refId: "",
      contents: "",
      amount: "",
    },
  });

  const onSubmit = async (data: ProposalFormData) => {
    setIsSubmitting(true);
    setStep("sending");

    try {
      // Single atomic endpoint: creates client, order, proposal + sends SMS
      const response = await fetch("/api/proposals/create-and-send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientName: data.clientName,
          phone: data.phone,
          email: data.email || undefined,
          refId: data.refId || undefined,
          contents: data.contents,
          amount: data.amount || undefined,
          expiresInHours: 48,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Erreur lors de la création de la proposition");
      }

      const { proposal, sms } = result.data;

      // Check SMS status
      if (sms.status === "failed") {
        toast.warning(
          `Proposition ${proposal.code} créée mais l'envoi SMS a échoué. Veuillez réessayer.`
        );
      } else {
        toast.success(
          `Proposition ${proposal.code} envoyée avec succès à ${data.phone}`
        );
      }

      reset();
      onSuccess?.();
      router.refresh();
    } catch (error) {
      console.error("Error creating proposal:", error);
      toast.error(
        error instanceof Error ? error.message : "Erreur lors de la création"
      );
    } finally {
      setIsSubmitting(false);
      setStep("form");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Header Badge */}
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
          <span className="w-2 h-2 bg-emerald-500 rounded-full mr-2" />
          Nouveau brouillon
        </Badge>
        <span className="text-sm text-muted-foreground">TGVAIRWABO Logistics</span>
      </div>

      {/* Section 1: Client Information */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <User className="h-4 w-4" />
          INFORMATIONS CLIENT
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="clientName">Nom du client</Label>
            <Input
              id="clientName"
              placeholder="Entrez le nom complet"
              {...register("clientName")}
              className={errors.clientName ? "border-red-500" : ""}
            />
            {errors.clientName && (
              <p className="text-xs text-red-500">{errors.clientName.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="phone">Téléphone mobile</Label>
              <span className="text-xs text-emerald-600">Requis pour SMS</span>
            </div>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="phone"
                placeholder="+237 6XX XXX XXX"
                className={`pl-10 ${errors.phone ? "border-red-500" : ""}`}
                {...register("phone")}
              />
            </div>
            {errors.phone && (
              <p className="text-xs text-red-500">{errors.phone.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Adresse email (optionnel)</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="contact@example.com"
                className={`pl-10 ${errors.email ? "border-red-500" : ""}`}
                {...register("email")}
              />
            </div>
            {errors.email && (
              <p className="text-xs text-red-500">{errors.email.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* Section 2: Shipment Details */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Package className="h-4 w-4" />
          DÉTAILS DU COLIS
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="refId">Référence TGVAIRWABO</Label>
            <div className="relative">
              <Input
                id="refId"
                placeholder="TGV-XXXXX"
                className="pr-10"
                {...register("refId")}
              />
              <QrCode className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="contents">Contenu & Manutention</Label>
            <Textarea
              id="contents"
              placeholder="Décrivez le contenu, les dimensions, le poids et les instructions spéciales..."
              rows={3}
              className={errors.contents ? "border-red-500" : ""}
              {...register("contents")}
            />
            {errors.contents && (
              <p className="text-xs text-red-500">{errors.contents.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Montant (FCFA) - optionnel</Label>
            <Input
              id="amount"
              type="number"
              placeholder="0"
              {...register("amount")}
            />
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-3 pt-4">
        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-base"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              {step === "sending" ? "Envoi en cours..." : "Création..."}
            </>
          ) : (
            <>
              Générer la Proposition TGVAIRWABO
              <Send className="ml-2 h-5 w-5" />
            </>
          )}
        </Button>

        {showCancel && onCancel && (
          <Button
            type="button"
            variant="ghost"
            onClick={onCancel}
            disabled={isSubmitting}
            className="w-full"
          >
            Annuler
          </Button>
        )}
      </div>
    </form>
  );
}
