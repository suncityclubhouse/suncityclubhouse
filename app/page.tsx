import { redirect } from "next/navigation";

// Root "/" redirects to the (public) group landing page
export default function RootPage() {
  redirect("/");
}
