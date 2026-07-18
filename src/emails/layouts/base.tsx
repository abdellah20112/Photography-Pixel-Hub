import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
} from "@react-email/components";

/* ============================================
   Base Email Layout
   Shared wrapper for all email templates.
   ============================================ */

export type BaseEmailLayoutProps = {
  preview: string;
  children: React.ReactNode;
};

export function BaseEmailLayout({
  preview,
  children,
}: BaseEmailLayoutProps) {
  return (
    <Html dir="rtl" lang="ar">
      <Head />
      <Preview>{preview}</Preview>
      <Body style={{ fontFamily: "sans-serif", margin: 0, padding: 0 }}>
        <Container
          style={{
            maxWidth: 600,
            margin: "0 auto",
            padding: "24px",
          }}
        >
          <Heading style={{ fontSize: 24, fontWeight: 700 }}>
            Photography Pixel Hub
          </Heading>
          {children}
          <Text
            style={{
              fontSize: 12,
              color: "#888",
              marginTop: 32,
              paddingTop: 16,
              borderTop: "1px solid #eee",
            }}
          >
            © {new Date().getFullYear()} Photography Pixel Hub. جميع الحقوق
            محفوظة.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
