"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";

interface Agency {
  id: string;
  name: string;
  city: string;
}

interface AgencySelectorProps {
  agencies: Agency[];
  selectedId: string;
  currentDate: string;
}

export function AgencySelector({
  agencies,
  selectedId,
  currentDate,
}: AgencySelectorProps) {
  const router = useRouter();

  const handleAgencyChange = (agencyId: string) => {
    router.push(`/super/slots?agency=${agencyId}&date=${currentDate}`);
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-muted-foreground whitespace-nowrap">
            Agence :
          </label>
          <Select value={selectedId} onValueChange={handleAgencyChange}>
            <SelectTrigger className="w-[280px]">
              <SelectValue placeholder="Sélectionner une agence" />
            </SelectTrigger>
            <SelectContent>
              {agencies.map((agency) => (
                <SelectItem key={agency.id} value={agency.id}>
                  {agency.name} — {agency.city}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}
