export default async function AcceptInvitationLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // This layout does not require authentication
    // Users can accept invitations without being logged in
    return <>{children}</>;
}
