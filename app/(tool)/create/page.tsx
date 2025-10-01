import AppShell from "@/components/layout/AppShell";
import CreationForm from "@/components/builder/CreationForm";

export default function Page() {
  return (
    <AppShell active="create">
      <CreationForm />
    </AppShell>
  );
}


