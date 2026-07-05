export const DEVELOPER_EMAILS = ['bartoszmiazgowicz@gmail.com'];

export function isDeveloperEmail(email?: string | null): boolean {
    return !!email && DEVELOPER_EMAILS.includes(email.toLowerCase());
}
