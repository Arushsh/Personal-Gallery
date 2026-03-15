// Two hardcoded user roles — change these credentials before sharing the app
export const USERS = [
    {
        id: "1",
        name: "Uploader",
        email: "varush395@gmail.com",
        password: "Arush@123",
        role: "uploader",
    },
    {
        id: "2",
        name: "Viewer",
        email: "mishrajii@gmail.com",
        password: "Shivangi@123",
        role: "viewer",
    },
] as const;

export type UserRole = "uploader" | "viewer";

export function findUser(email: string, password: string) {
    return USERS.find((u) => u.email === email && u.password === password) ?? null;
}
