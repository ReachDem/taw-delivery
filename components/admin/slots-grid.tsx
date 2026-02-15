"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Lock, Users } from "lucide-react";
import { useRouter } from "next/navigation";

interface BookingInfo {
  id: string;
  position: number;
  orderNumber: string;
  productDescription: string;
  clientName: string;
  clientPhone: string;
}

interface SlotData {
  id: string;
  slotHour: number;
  maxCapacity: number;
  currentBookings: number;
  isLocked: boolean;
  bookings: BookingInfo[];
}

interface SlotsGridProps {
  slots: SlotData[];
  currentDate: string; // YYYY-MM-DD
  agencyName: string;
  basePath: string;
}

function formatDateFR(dateStr: string): string {
  const days = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
  const months = [
    "janvier",
    "février",
    "mars",
    "avril",
    "mai",
    "juin",
    "juillet",
    "août",
    "septembre",
    "octobre",
    "novembre",
    "décembre",
  ];
  const d = new Date(dateStr + "T00:00:00");
  return `${days[d.getDay()]} ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

export function SlotsGrid({
  slots,
  currentDate,
  agencyName,
  basePath,
}: SlotsGridProps) {
  const router = useRouter();

  const navigateDate = (offset: number) => {
    const d = new Date(currentDate + "T00:00:00");
    d.setDate(d.getDate() + offset);
    const newDate = d.toISOString().split("T")[0];
    const separator = basePath.includes("?") ? "&" : "?";
    router.push(`${basePath}${separator}date=${newDate}`);
  };

  const totalBookings = slots.reduce((sum, s) => sum + s.currentBookings, 0);
  const totalCapacity = slots.reduce((sum, s) => sum + s.maxCapacity, 0);
  const occupancyPercent =
    totalCapacity > 0 ? Math.round((totalBookings / totalCapacity) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Date Navigation */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateDate(-1)}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Veille
            </Button>
            <div className="text-center">
              <p className="text-lg font-semibold">
                {formatDateFR(currentDate)}
              </p>
              <p className="text-sm text-muted-foreground">
                {totalBookings}/{totalCapacity} livraisons · {occupancyPercent}%
                rempli
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigateDate(1)}>
              Lendemain
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Slots Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />8 créneaux · 4 livraisons max par
            créneau
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3">
            {slots.map((slot) => {
              const fillPercent =
                slot.maxCapacity > 0
                  ? (slot.currentBookings / slot.maxCapacity) * 100
                  : 0;
              const remaining = slot.maxCapacity - slot.currentBookings;
              const statusColor = slot.isLocked
                ? "bg-zinc-400"
                : remaining === 0
                  ? "bg-red-500"
                  : remaining === 1
                    ? "bg-orange-500"
                    : remaining <= 2
                      ? "bg-yellow-500"
                      : "bg-emerald-500";
              const statusBadge = slot.isLocked ? (
                <Badge
                  variant="outline"
                  className="bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                >
                  <Lock className="h-3 w-3 mr-1" /> Verrouillé
                </Badge>
              ) : remaining === 0 ? (
                <Badge
                  variant="outline"
                  className="bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400"
                >
                  Complet
                </Badge>
              ) : remaining === 1 ? (
                <Badge
                  variant="outline"
                  className="bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400"
                >
                  1 place
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  className="bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400"
                >
                  {remaining} places
                </Badge>
              );

              return (
                <div
                  key={slot.id}
                  className="rounded-lg border border-zinc-200 dark:border-zinc-700 p-4 space-y-3"
                >
                  {/* Slot header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold text-zinc-900 dark:text-zinc-100 tabular-nums w-24">
                        {slot.slotHour}h – {slot.slotHour + 1}h
                      </span>
                      {statusBadge}
                    </div>
                    <span className="text-sm font-medium text-zinc-500">
                      {slot.currentBookings}/{slot.maxCapacity}
                    </span>
                  </div>

                  {/* Capacity bar */}
                  <div className="h-2.5 w-full rounded-full bg-zinc-100 dark:bg-zinc-800">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${statusColor}`}
                      style={{ width: `${fillPercent}%` }}
                    />
                  </div>

                  {/* Capacity dots */}
                  <div className="flex gap-2">
                    {Array.from({ length: slot.maxCapacity }).map((_, i) => {
                      const isFilled = i < slot.currentBookings;
                      const booking = slot.bookings.find(
                        (b) => b.position === i + 1,
                      );
                      return (
                        <div
                          key={i}
                          className={`flex-1 rounded-md border p-2 text-center text-xs transition ${
                            isFilled
                              ? "border-emerald-300 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-900/30"
                              : "border-dashed border-zinc-300 bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800/50"
                          }`}
                          title={
                            booking
                              ? `${booking.clientName} — ${booking.orderNumber}`
                              : "Libre"
                          }
                        >
                          {booking ? (
                            <div className="space-y-0.5">
                              <p className="font-medium text-emerald-700 dark:text-emerald-400 truncate">
                                {booking.clientName.split(" ")[0]}
                              </p>
                              <p className="text-zinc-400 truncate">
                                #{booking.orderNumber.slice(-4)}
                              </p>
                            </div>
                          ) : (
                            <p className="text-zinc-400">Libre</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {slots.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                Aucun créneau pour cette date
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
