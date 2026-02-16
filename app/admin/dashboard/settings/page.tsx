import AdminSettingsForm from "@/components/admin/settings-form";

export default function AdminSettingsPage() {
    return (
        <div className="flex flex-col gap-6 p-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">Paramètres</h1>
                <p className="text-muted-foreground">
                    Configuration de votre agence
                </p>
            </div>

            <AdminSettingsForm />
        </div>
    );
}
