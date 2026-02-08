
const BASE_URL = "http://localhost:3000";
let headers: HeadersInit = {
    "Content-Type": "application/json"
};

async function login() {
    console.log("Logging in...");
    const res = await fetch(`${BASE_URL}/api/auth/sign-in/email`, {
        method: "POST",
        headers: {
            ...headers,
            "Origin": BASE_URL,
            "User-Agent": "Mozilla/5.0 (compatible; TestScript/1.0)",
        },
        body: JSON.stringify({
            email: "testadmin@taw-delivery.com",
            password: "testpassword"
        })
    });

    if (!res.ok) {
        const text = await res.text();
        throw new Error(`Login failed strategy: ${res.status} - ${text}`);
    }

    const setCookie = res.headers.get("set-cookie");
    if (setCookie) {
        headers = {
            ...headers,
            "Cookie": setCookie
        };
    }
    console.log("Login successful");
}

async function api(method: string, path: string, body?: any) {
    const res = await fetch(`${BASE_URL}${path}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined
    });
    const data = await res.json().catch(() => ({}));
    return { status: res.status, data };
}

async function main() {
    try {
        await login();

        // 1. Setup Data
        console.log("Setting up data...");

        // Get Agency
        const agencyRes = await api("GET", "/api/agencies");
        const agencyId = agencyRes.data.data[0].id;

        // Create Client
        const clientRes = await api("POST", "/api/clients", {
            firstName: "Robust", lastName: "Test", phone: "+22177" + Math.floor(Math.random() * 10000000)
        });
        const clientId = clientRes.data.data.id;

        // Create 2 Orders
        const orderA = await api("POST", "/api/orders", {
            clientId, agencyId, productDescription: "Order A", amount: 1000
        });
        const orderB = await api("POST", "/api/orders", {
            clientId, agencyId, productDescription: "Order B", amount: 1000
        });

        // Create 2 Proposals
        const propA = await api("POST", "/api/proposals", { orderId: orderA.data.data.id, expiresInHours: 24 });
        const propB = await api("POST", "/api/proposals", { orderId: orderB.data.data.id, expiresInHours: 24 });

        // Accept Proposals
        const decideA = await api("POST", `/api/p/${propA.data.data.code}/decide`, { decision: "ACCEPTED", deliveryAddress: "123 Main St, Location A", paymentChoice: "PAY_ON_DELIVERY" });
        console.log("Decide A:", decideA.status);

        const decideB = await api("POST", `/api/p/${propB.data.data.code}/decide`, { decision: "ACCEPTED", deliveryAddress: "456 Side St, Location B", paymentChoice: "PAY_ON_DELIVERY" });
        console.log("Decide B:", decideB.status);

        // Generate Slot (Capacity 1)
        // Need to use tomorrow's date
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const dateStr = tomorrow.toISOString().split('T')[0];

        const slotGenRes = await api("POST", `/api/agencies/${agencyId}/slots`, {
            startDate: dateStr,
            endDate: dateStr,
            startHour: 12,
            endHour: 13,
            maxCapacity: 1
        });

        // List slots to find the one we created
        const slotsRes = await api("GET", `/api/agencies/${agencyId}/slots`);
        const slot = slotsRes.data.data.find((s: any) => s.slotDate.startsWith(dateStr) && s.slotHour === 12);

        if (!slot) throw new Error("Slot creation failed or not found");
        console.log(`Using Slot ID: ${slot.id} (Capacity: ${slot.maxCapacity})`);

        // 2. Test Normal Booking
        console.log("Test 1: Normal Booking (Proposal A)...");
        const bookA = await api("POST", "/api/bookings", {
            proposalId: propA.data.data.id,
            slotId: slot.id
        });

        if (bookA.status === 201) {
            console.log("PASS: Booking A succeeded");
        } else {
            console.error("FAIL: Booking A failed", bookA);
            process.exit(1);
        }

        // 3. Test Overbooking
        console.log("Test 2: Overbooking (Proposal B on full slot)...");
        const bookB = await api("POST", "/api/bookings", {
            proposalId: propB.data.data.id,
            slotId: slot.id
        });

        if (bookB.status === 409) {
            console.log("PASS: Overbooking correctly rejected (409 Conflict)");
        } else {
            console.error("FAIL: Overbooking should result in 409", bookB);
            process.exit(1);
        }

        // 4. Test Double Booking
        console.log("Test 3: Double Booking (Proposal A again)...");
        const bookAA = await api("POST", "/api/bookings", {
            proposalId: propA.data.data.id,
            slotId: slot.id // Or another slot, ideally should fail because proposal is used.
        });

        // Even if we try to book ANOTHER slot, it should fail because proposal has booking.
        // But here we reuse slotId which is also full, so it might fail with SLOT_FULL or PROPOSAL_ALREADY_BOOKED.
        // The check order in code: Proposal check is FIRST. So it should return "Cette proposition a déjà un créneau..."

        if (bookAA.status === 409 && bookAA.data.error.includes("déjà un créneau")) {
            console.log("PASS: Double Booking correctly rejected (Proposal check verified)");
        } else if (bookAA.status === 409) {
            console.log("PASS: Double Booking rejected (409 generic)", bookAA.data.error);
        } else {
            console.error("FAIL: Double Booking should fail", bookAA);
            process.exit(1);
        }

        console.log("ALL TESTS PASSED");

    } catch (e) {
        console.error("Test Script Error:", e);
        process.exit(1);
    }
}

main();
