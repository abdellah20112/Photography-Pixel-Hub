import {
  Button,
  Section,
  Text,
} from "@react-email/components";

import { BaseEmailLayout } from "../layouts/base";

/* ============================================
   Welcome Email Template
   Sent to new clients when they are added.
   ============================================ */

export type WelcomeEmailProps = {
  name: string;
  galleryUrl: string;
};

export function WelcomeEmail({ name, galleryUrl }: WelcomeEmailProps) {
  return (
    <BaseEmailLayout preview="مرحباً بك في Photography Pixel Hub">
      <Text style={{ fontSize: 16 }}>مرحباً {name}،</Text>
      <Text style={{ fontSize: 16, color: "#555" }}>
        تم إنشاء حسابك بنجاح. يمكنك الآن الوصول إلى معرض الصور الخاص بك.
      </Text>
      <Section style={{ textAlign: "center", margin: "32px 0" }}>
        <Button
          href={galleryUrl}
          style={{
            backgroundColor: "#000",
            color: "#fff",
            padding: "12px 24px",
            borderRadius: 8,
            textDecoration: "none",
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          عرض المعرض
        </Button>
      </Section>
    </BaseEmailLayout>
  );
}
