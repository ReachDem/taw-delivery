import prisma from "@/lib/prisma";
import { getAgencyDetails, getAgencySettings } from "@/app/actions/agency";
import { redirect } from "next/navigation";
import { SlotsGrid } from "@/components/admin/slots-grid";

export default async function AdminSlotsPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const agency = await getAgencyDetails();
  if (!agency) redirect("/admin/dashboard");

  const settings = await getAgencySettings(agency.id);

  const params = await searchParams;
  const selectedDate = params.date ? new Date(params.date) : new Date();
  selectedDate.setHours(0, 0, 0, 0);

  // Use agency settings for slot generation
  const START_HOUR = settings.slotStartHour;
  const END_HOUR = settings.slotEndHour;
  const MAX_CAPACITY = settings.slotMaxCapacity;

  const existingCount = await prisma.timeSlot.count({
    where: {
      agencyId: agency.id,
      slotDate: selectedDate,
    },
  });

  if (existingCount < END_HOUR - START_HOUR) {
    const slotsToCreate = [];
    for (let hour = START_HOUR; hour < END_HOUR; hour++) {
      slotsToCreate.push({
        agencyId: agency.id,
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

  // Fetch slots with bookings info
  const slots = await prisma.timeSlot.findMany({
    where: {
      agencyId: agency.id,
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
          Gérer les créneaux de livraison — {agency.name}
        </p>
      </div>

      <SlotsGrid
        slots={serializedSlots}
        currentDate={dateStr}
        agencyName={agency.name}
        basePath="/admin/dashboard/slots"
      />
    </div>
  );
}
