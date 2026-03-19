import { redirect } from "next/navigation";

// Sections are now managed per-program at /courses/[id]/sections
export default function SectionsRedirectPage() {
    redirect("/courses");
}
