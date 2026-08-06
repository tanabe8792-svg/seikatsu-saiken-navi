import { Phone } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EMERGENCY_CONTACTS } from "@/lib/emergency-contacts";

interface EmergencyContactsProps {
  compact?: boolean;
}

export function EmergencyContacts({ compact = false }: EmergencyContactsProps) {
  if (compact) {
    return (
      <div className="flex gap-2">
        {EMERGENCY_CONTACTS.map((contact) => (
          <a
            key={contact.id}
            href={`tel:${contact.number}`}
            className="flex flex-1 flex-col items-center rounded-xl border border-destructive/30 bg-destructive/5 px-2 py-3 text-center transition-colors hover:bg-destructive/10"
          >
            <span className="text-xs text-muted-foreground">{contact.label}</span>
            <span className="text-xl font-bold text-destructive">{contact.number}</span>
          </a>
        ))}
      </div>
    );
  }

  return (
    <Card className="border-destructive/30">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg text-destructive">
          <Phone className="h-5 w-5" />
          緊急のとき（タップで発信）
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-2">
        {EMERGENCY_CONTACTS.map((contact) => (
          <a
            key={contact.id}
            href={`tel:${contact.number}`}
            className="flex items-center justify-between rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 transition-colors hover:bg-destructive/10"
          >
            <div>
              <p className="text-base font-semibold">{contact.label}</p>
              <p className="text-sm text-muted-foreground">{contact.description}</p>
            </div>
            <span className="text-2xl font-bold text-destructive">{contact.number}</span>
          </a>
        ))}
      </CardContent>
    </Card>
  );
}
