import prisma from "@/lib/prisma";
import { SlotsGrid } from "@/components/admin/slots-grid";
import { AgencySelector } from "@/components/super-admin/agency-selector";

export default async function SuperSlotsPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; agency?: string }>;
}) {
  const params = await searchParams;

  // Fetch all agencies
  const agencies = await prisma.agency.findMany({
    select: { id: true, name: true, city: true },
    orderBy: { name: "asc" },
  });

  if (agencies.length === 0) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <h1 className="text-3xl font-bold tracking-tight">Créneaux</h1>
        <p className="text-muted-foreground">Aucune agence configurée</p>
      </div>
    );
  }

  const selectedAgencyId = params.agency || agencies[0].id;
  const selectedAgency =
    agencies.find((a) => a.id === selectedAgencyId) || agencies[0];

  const selectedDate = params.date ? new Date(params.date) : new Date();
  selectedDate.setHours(0, 0, 0, 0);

  // Lazy generate slots
  const START_HOUR = 9;
  const END_HOUR = 17;
  const MAX_CAPACITY = 4;

  const existingCount = await prisma.timeSlot.count({
    where: {
      agencyId: selectedAgency.id,
      slotDate: selectedDate,
    },
  });

  if (existingCount < END_HOUR - START_HOUR) {
    const slotsToCreate = [];
    for (let hour = START_HOUR; hour < END_HOUR; hour++) {
      slotsToCreate.push({
        agencyId: selectedAgency.id,
        slotDate: selectedDate,
        slotHour: hour,
        maxCapacity: MAX_CAPACITY,
      });
    }
    await prisma.timeSlot.createMany({
      data: slotsToCreate,
      skipDuplicates: true,
    });
  }

  // Fetch slots with booking details
  const slots = await prisma.timeSlot.findMany({
    where: {
      agencyId: selectedAgency.id,
      slotDate: selectedDate,
    },
    orderBy: { slotHour: "asc" },
    include: {
      bookings: {
        include: {
          proposal: {
            include: {
              order: {
                select: {
                  orderNumber: true,
                  productDescription: true,
                  client: {
                    select: { firstName: true, lastName: true, phone: true },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  const serializedSlots = slots.map((slot) => ({
    id: slot.id,
    slotHour: slot.slotHour,
    maxCapacity: slot.maxCapacity,
    currentBookings: slot.currentBookings,
    isLocked: slot.isLocked,
    bookings: slot.bookings.map((b) => ({
      id: b.id,
      position: b.position,
      orderNumber: b.proposal.order.orderNumber,
      productDescription: b.proposal.order.productDescription,
      clientName: `${b.proposal.order.client.firstName} ${b.proposal.order.client.lastName}`,
      clientPhone: b.proposal.order.client.phone,
    })),
  }));

  const dateStr = selectedDate.toISOString().split("T")[0];

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Créneaux</h1>
        <p className="text-muted-foreground">
          Gérer les créneaux de livraison de toutes les agences
        </p>
      </div>

      <AgencySelector
        agencies={agencies.map((a) => ({
          id: a.id,
          name: a.name,
          city: a.city,
        }))}
        selectedId={selectedAgency.id}
        currentDate={dateStr}
      />

      <SlotsGrid
        slots={serializedSlots}
        currentDate={dateStr}
        agencyName={selectedAgency.name}
        basePath={`/super/slots?agency=${selectedAgency.id}`}
      />
    </div>
  );
}
