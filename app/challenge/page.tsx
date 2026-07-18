import { redirect } from "next/navigation";

export default function ChallengePage() {
  redirect("/practice?challenge=today");
}
