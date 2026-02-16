"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";

interface ProposalViewProps {
  initialProposal: {
    id: string;
    code: string;
    decision: string;
    expiresAt: string;
    deliveryAddress: string | null;
    paymentChoice: string | null;
    order: {
      productDescription: string;
      amount: number;
      locationKnown?: boolean;
      client: {
        firstName: string;
        lastName: string;
      };
      agency: {
        name: string;
      };
      pricing?: {
        productAmount: number;
        deliveryFee: number | null;
        totalAmount: number;
      };
      deliveryZone?: {
        id: string;
        name: string;
        city: string;
        baseFee: number;
      } | null;
    };
  };
}

interface DeliveryZone {
  id: string;
  name: string;
  city: string;
  baseFee: number;
}

interface SlotDay {
  date: string;
  dateLabel: string;
  slots: {
    id: string;
    hour: number;
    hourLabel: string;
    remainingCapacity: number;
    isAlmostFull: boolean;
  }[];
}

type Step = "overview" | "zone" | "slot" | "payment" | "confirm";

export function ProposalView({ initialProposal }: ProposalViewProps) {
  const [proposal, setProposal] = useState(initialProposal);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Multi-step state
  const [step, setStep] = useState<Step>("overview");
  const [zones, setZones] = useState<DeliveryZone[]>([]);
  const [slotDays, setSlotDays] = useState<SlotDay[]>([]);
  const [loadingZones, setLoadingZones] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Selections
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<string | null>(null);
  const [deliveryAddress, setDeliveryAddress] = useState("");

  const locationKnown = proposal.order.locationKnown ?? false;

  const selectedZone = zones.find((z) => z.id === selectedZoneId);

  const fetchProposal = async () => {
    try {
      const response = await fetch(`/api/p/${proposal.code}`);
      if (response.ok) {
        const result = await response.json();
        setProposal(result.data ?? result);
      }
    } catch (error) {
      console.error("Error fetching proposal:", error);
    }
  };

  const fetchZones = async () => {
    setLoadingZones(true);
    try {
      const res = await fetch(`/api/p/${proposal.code}/zones`);
      if (res.ok) {
        const result = await res.json();
        const data = result.data ?? result;
        setZones(data.zones || []);
      }
    } catch (error) {
      console.error("Error fetching zones:", error);
      toast.error("Erreur lors du chargement des zones");
    } finally {
      setLoadingZones(false);
    }
  };

  const fetchSlots = async () => {
    setLoadingSlots(true);
    try {
      const res = await fetch(`/api/p/${proposal.code}/slots`);
      if (res.ok) {
        const result = await res.json();
        const data = result.data ?? result;
        setSlotDays(data.slotsByDate || []);
      }
    } catch (error) {
      console.error("Error fetching slots:", error);
      toast.error("Erreur lors du chargement des créneaux");
    } finally {
      setLoadingSlots(false);
    }
  };

  // When user clicks Accept, start the multi-step flow
  const startAcceptFlow = () => {
    if (locationKnown) {
      // Skip zone selection, go directly to slots
      fetchSlots();
      setStep("slot");
    } else {
      fetchZones();
      setStep("zone");
    }
  };

  const handleZoneSelected = (zoneId: string) => {
    setSelectedZoneId(zoneId);
    fetchSlots();
    setStep("slot");
  };

  const handleSlotSelected = (slotId: string) => {
    setSelectedSlotId(slotId);
    setStep("payment");
  };

  const handlePaymentSelected = (choice: string) => {
    setSelectedPayment(choice);
    setStep("confirm");
  };

  const handleConfirm = async () => {
    if (!selectedSlotId || !selectedPayment) {
      toast.error("Veuillez compléter toutes les étapes");
      return;
    }

    setIsSubmitting(true);
    try {
      const body: Record<string, unknown> = {
        decision: "ACCEPTED",
        slotId: selectedSlotId,
        paymentChoice: selectedPayment,
      };

      if (!locationKnown && selectedZoneId) {
        body.deliveryZoneId = selectedZoneId;
      }

      if (deliveryAddress.trim()) {
        body.deliveryAddress = deliveryAddress.trim();
      }

      const response = await fetch(`/api/p/${proposal.code}/decide`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Erreur lors de la confirmation");
        return;
      }

      toast.success("Livraison confirmée ✓");
      await fetchProposal();
      setStep("overview");
    } catch (error) {
      toast.error("Erreur de connexion");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRefuse = async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/p/${proposal.code}/decide`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision: "REFUSED" }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Erreur lors de la décision");
        return;
      }

      toast.success("Retrait en agence confirmé");
      await fetchProposal();
    } catch (error) {
      toast.error("Erreur de connexion");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isExpired = new Date() > new Date(proposal.expiresAt);

  // ─── Step indicators ───
  const getStepNumber = () => {
    if (step === "zone") return 1;
    if (step === "slot") return locationKnown ? 1 : 2;
    if (step === "payment") return locationKnown ? 2 : 3;
    if (step === "confirm") return locationKnown ? 3 : 4;
    return 0;
  };
  const totalSteps = locationKnown ? 3 : 4;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            Votre Livraison
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            {proposal.order.agency?.name || "TGVAIRWABO"}
          </p>
        </div>

        {/* Order Details Card */}
        <div className="rounded-xl bg-white p-6 shadow-lg dark:bg-zinc-800">
          <div className="space-y-4">
            <div>
              <p className="text-sm text-zinc-500">Client</p>
              <p className="font-medium">
                {proposal.order.client.firstName}{" "}
                {proposal.order.client.lastName}
              </p>
            </div>
            <div>
              <p className="text-sm text-zinc-500">Commande</p>
              <p className="font-medium">{proposal.order.productDescription}</p>
            </div>
            <div>
              <p className="text-sm text-zinc-500">Montant</p>
              <p className="text-xl font-bold text-emerald-600">
                {(
                  proposal.order.pricing?.productAmount ??
                  proposal.order.amount ??
                  0
                ).toLocaleString()}{" "}
                FCFA
              </p>
            </div>
          </div>
        </div>

        {/* Status / Actions */}
        {isExpired ? (
          <div className="rounded-lg bg-red-50 p-4 text-center text-red-600 dark:bg-red-900/20">
            Cette proposition a expiré
          </div>
        ) : proposal.decision === "PENDING" ? (
          <>
            {/* ─── OVERVIEW STEP ─── */}
            {step === "overview" && (
              <div className="space-y-3">
                <button
                  className="w-full rounded-lg bg-emerald-600 py-4 text-lg font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
                  onClick={startAcceptFlow}
                  disabled={isSubmitting}
                >
                  ✓ Accepter la Livraison
                </button>
                <button
                  className="w-full rounded-lg border border-zinc-300 py-4 text-lg font-semibold text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-300 disabled:opacity-50"
                  onClick={handleRefuse}
                  disabled={isSubmitting}
                >
                  {isSubmitting
                    ? "Traitement..."
                    : "✗ Refuser (Retrait en agence)"}
                </button>
              </div>
            )}

            {/* ─── ZONE SELECTION STEP ─── */}
            {step === "zone" && (
              <div className="rounded-xl bg-white p-6 shadow-lg dark:bg-zinc-800 space-y-4">
                <StepHeader
                  current={getStepNumber()}
                  total={totalSteps}
                  title="Choisissez votre quartier"
                  onBack={() => setStep("overview")}
                />
                {loadingZones ? (
                  <div className="flex justify-center py-8">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-600" />
                  </div>
                ) : zones.length === 0 ? (
                  <p className="text-center text-zinc-500 py-4">
                    Aucune zone disponible pour le moment
                  </p>
                ) : (
                  <div className="space-y-2 max-h-72 overflow-y-auto">
                    {zones.map((zone) => (
                      <button
                        key={zone.id}
                        className={`w-full rounded-lg border p-3 text-left transition hover:border-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 ${
                          selectedZoneId === zone.id
                            ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20"
                            : "border-zinc-200 dark:border-zinc-700"
                        }`}
                        onClick={() => handleZoneSelected(zone.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-zinc-900 dark:text-zinc-100">
                              {zone.name}
                            </p>
                            <p className="text-sm text-zinc-500">{zone.city}</p>
                          </div>
                          <span className="text-sm font-semibold text-emerald-600">
                            {Number(zone.baseFee).toLocaleString()} FCFA
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ─── SLOT SELECTION STEP ─── */}
            {step === "slot" && (
              <div className="rounded-xl bg-white p-6 shadow-lg dark:bg-zinc-800 space-y-4">
                <StepHeader
                  current={getStepNumber()}
                  total={totalSteps}
                  title="Choisissez un créneau"
                  onBack={() => setStep(locationKnown ? "overview" : "zone")}
                />
                {loadingSlots ? (
                  <div className="flex justify-center py-8">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-600" />
                  </div>
                ) : slotDays.length === 0 ? (
                  <p className="text-center text-zinc-500 py-4">
                    Aucun créneau disponible pour le moment
                  </p>
                ) : (
                  <div className="space-y-4 max-h-80 overflow-y-auto">
                    {slotDays.map((day) => (
                      <div key={day.dateLabel}>
                        <p className="text-sm font-semibold text-zinc-600 dark:text-zinc-400 mb-2">
                          {day.dateLabel}
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                          {day.slots.map((slot) => {
                            const maxCap = 4;
                            const filled = maxCap - slot.remainingCapacity;
                            const fillColor =
                              slot.remainingCapacity <= 1
                                ? "bg-red-500"
                                : slot.remainingCapacity <= 2
                                  ? "bg-yellow-500"
                                  : "bg-emerald-500";
                            const borderColor =
                              selectedSlotId === slot.id
                                ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20"
                                : slot.remainingCapacity <= 1
                                  ? "border-red-200 dark:border-red-800"
                                  : "border-zinc-200 dark:border-zinc-700";

                            return (
                              <button
                                key={slot.id}
                                className={`rounded-lg border p-3 text-center transition hover:border-emerald-400 ${borderColor}`}
                                onClick={() => handleSlotSelected(slot.id)}
                              >
                                <p className="font-medium text-zinc-900 dark:text-zinc-100">
                                  {slot.hourLabel}
                                </p>
                                {/* Capacity dots: ● filled, ○ empty */}
                                <div className="flex justify-center gap-1 mt-1.5">
                                  {Array.from({ length: maxCap }).map(
                                    (_, i) => (
                                      <span
                                        key={i}
                                        className={`inline-block h-2 w-2 rounded-full ${
                                          i < filled
                                            ? fillColor
                                            : "bg-zinc-200 dark:bg-zinc-600"
                                        }`}
                                      />
                                    ),
                                  )}
                                </div>
                                <p
                                  className={`text-xs mt-1 ${
                                    slot.remainingCapacity <= 1
                                      ? "text-red-500 font-semibold"
                                      : "text-zinc-400"
                                  }`}
                                >
                                  {slot.remainingCapacity} place
                                  {slot.remainingCapacity > 1 ? "s" : ""}{" "}
                                  restante
                                  {slot.remainingCapacity > 1 ? "s" : ""}
                                </p>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ─── PAYMENT SELECTION STEP ─── */}
            {step === "payment" && (
              <div className="rounded-xl bg-white p-6 shadow-lg dark:bg-zinc-800 space-y-4">
                <StepHeader
                  current={getStepNumber()}
                  total={totalSteps}
                  title="Mode de paiement"
                  onBack={() => setStep("slot")}
                />
                <div className="space-y-2">
                  {[
                    {
                      value: "PAY_ON_DELIVERY",
                      label: "💰 Paiement à la livraison",
                      desc: "Payez quand vous recevez votre colis",
                    },
                    {
                      value: "ALREADY_PAID",
                      label: "✅ Déjà payé",
                      desc: "J'ai déjà réglé cette commande",
                    },
                    {
                      value: "EXEMPT",
                      label: "🆓 Exempté",
                      desc: "Pas de paiement requis",
                    },
                  ].map((option) => (
                    <button
                      key={option.value}
                      className={`w-full rounded-lg border p-4 text-left transition hover:border-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 ${
                        selectedPayment === option.value
                          ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20"
                          : "border-zinc-200 dark:border-zinc-700"
                      }`}
                      onClick={() => handlePaymentSelected(option.value)}
                      onKeyDown={(e) => {
                        if (e.key === "ArrowDown" || e.key === "ArrowRight") {
                          e.preventDefault();
                          const next = e.currentTarget.nextElementSibling as HTMLButtonElement | null;
                          next?.focus();
                        } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
                          e.preventDefault();
                          const prev = e.currentTarget.previousElementSibling as HTMLButtonElement | null;
                          prev?.focus();
                        }
                      }}
                    >
                      <p className="font-medium text-zinc-900 dark:text-zinc-100">
                        {option.label}
                      </p>
                      <p className="text-sm text-zinc-500 mt-1">
                        {option.desc}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ─── CONFIRM STEP ─── */}
            {step === "confirm" && (
              <div className="rounded-xl bg-white p-6 shadow-lg dark:bg-zinc-800 space-y-4">
                <StepHeader
                  current={getStepNumber()}
                  total={totalSteps}
                  title="Confirmation"
                  onBack={() => setStep("payment")}
                />

                {/* Delivery address input */}
                <div>
                  <label className="block text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                    Adresse de livraison (optionnel)
                  </label>
                  <input
                    type="text"
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    placeholder="Ex: Rue 123, à côté du marché..."
                    className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 p-3 text-sm bg-zinc-50 dark:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {/* Summary */}
                <div className="rounded-lg bg-zinc-50 dark:bg-zinc-900 p-4 space-y-2 text-sm">
                  <p className="font-semibold text-zinc-700 dark:text-zinc-300">
                    Récapitulatif
                  </p>
                  {selectedZone && (
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Quartier</span>
                      <span className="font-medium">{selectedZone.name}</span>
                    </div>
                  )}
                  {selectedZone && (
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Frais de livraison</span>
                      <span className="font-medium text-emerald-600">
                        {Number(selectedZone.baseFee).toLocaleString()} FCFA
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Paiement</span>
                    <span className="font-medium">
                      {selectedPayment === "PAY_ON_DELIVERY"
                        ? "À la livraison"
                        : selectedPayment === "ALREADY_PAID"
                          ? "Déjà payé"
                          : "Exempté"}
                    </span>
                  </div>
                </div>

                <button
                  className="w-full rounded-lg bg-emerald-600 py-4 text-lg font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
                  onClick={handleConfirm}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Traitement..." : "✓ Confirmer la livraison"}
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="rounded-lg bg-emerald-50 p-4 text-center text-emerald-600 dark:bg-emerald-900/20">
            {proposal.decision === "ACCEPTED"
              ? "Livraison confirmée ✓"
              : "Retrait en agence confirmé"}
          </div>
        )}
      </div>
    </main>
  );
}

// ─── Step Header with back button & progress ───

function StepHeader({
  current,
  total,
  title,
  onBack,
}: {
  current: number;
  total: number;
  title: string;
  onBack: () => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <button
          onClick={onBack}
          className="text-sm text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1"
        >
          ← Retour
        </button>
        <span className="text-xs text-zinc-400">
          Étape {current}/{total}
        </span>
      </div>
      <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
        {title}
      </h2>
      {/* Progress bar */}
      <div className="mt-2 h-1.5 rounded-full bg-zinc-200 dark:bg-zinc-700">
        <div
          className="h-full rounded-full bg-emerald-500 transition-all duration-300"
          style={{ width: `${(current / total) * 100}%` }}
        />
      </div>
    </div>
  );
}
