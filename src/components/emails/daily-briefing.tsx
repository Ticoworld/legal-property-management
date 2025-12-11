import {
  Html,
  Head,
  Body,
  Container,
  Text,
  Link,
  Preview,
  Section,
  Heading,
  Hr,
  Button,
} from "@react-email/components";
import * as React from "react";

export type BriefingData = {
  noticesDue: Array<{
    id: string;
    tenantName: string;
    address: string;
    suggestedDate: string;
  }>;
  expiringLeases: Array<{
    id: string;
    tenantName: string;
    address: string;
    endDate: string;
    daysRemaining: number;
  }>;
  maintenanceCount: number;
  date: string;
};

export const DailyBriefingEmail = ({
  noticesDue = [],
  expiringLeases = [],
  maintenanceCount = 0,
  date = new Date().toDateString(),
}: BriefingData) => {
  const hasActions =
    noticesDue.length > 0 || expiringLeases.length > 0 || maintenanceCount > 0;

  return (
    <Html>
      <Head />
      <Preview>Daily Briefing: {date}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Daily Briefing</Heading>
          <Text style={text}>{date}</Text>

          <Text style={paragraph}>
            Good Morning. Here is your status update for today.
          </Text>

          {!hasActions ? (
            <Section style={goodBox}>
              <Text style={goodText}>
                ✅ No critical actions required today.
              </Text>
            </Section>
          ) : (
            <>
              {/* Section 1: Notices (Red) */}
              {noticesDue.length > 0 && (
                <Section style={section}>
                  <Heading as="h2" style={{ ...h2, color: "#DC2626" }}>
                    🚨 Legal Actions Due
                  </Heading>
                  {noticesDue.map((notice) => (
                    <div key={notice.id} style={item}>
                      <Text style={itemTitle}>Serve Notice to Quit</Text>
                      <Text style={itemText}>
                        Tenant: <strong>{notice.tenantName}</strong>
                      </Text>
                      <Text style={itemSubtext}>
                        Property: {notice.address}
                      </Text>
                    </div>
                  ))}
                </Section>
              )}

              {/* Section 2: Expiries (Yellow) */}
              {expiringLeases.length > 0 && (
                <Section style={section}>
                  <Heading as="h2" style={{ ...h2, color: "#D97706" }}>
                    ⚠️ Upcoming Expiries (30 Days)
                  </Heading>
                  {expiringLeases.map((lease) => (
                    <div key={lease.id} style={item}>
                      <Text style={itemTitle}>Lease Expiring</Text>
                      <Text style={itemText}>
                        Tenant: <strong>{lease.tenantName}</strong>
                      </Text>
                      <Text style={itemSubtext}>Ends on: {lease.endDate}</Text>
                    </div>
                  ))}
                </Section>
              )}

              {/* Section 3: Operations (Blue) */}
              {maintenanceCount > 0 && (
                <Section style={section}>
                  <Heading as="h2" style={{ ...h2, color: "#2563EB" }}>
                    ℹ️ Operations
                  </Heading>
                  <div style={item}>
                    <Text style={itemText}>
                      You have <strong>{maintenanceCount}</strong> pending
                      maintenance requests requiring attention.
                    </Text>
                  </div>
                </Section>
              )}
            </>
          )}

          <Hr style={hr} />

          <Section style={btnContainer}>
            <Button style={button} href="http://localhost:3000/dashboard">
              Open Dashboard
            </Button>
          </Section>

          <Text style={footer}>
            Legal Property Management System • Automated Daily Briefing
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

// Styles
const main = {
  backgroundColor: "#f6f9fc",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "20px 0 48px",
  marginBottom: "64px",
};

const h1 = {
  color: "#333",
  fontSize: "24px",
  fontWeight: "bold",
  textAlign: "center" as const,
  margin: "30px 0",
};

const h2 = {
  fontSize: "18px",
  fontWeight: "bold",
  margin: "0 0 10px",
};

const text = {
  color: "#333",
  fontSize: "16px",
  lineHeight: "24px",
  textAlign: "center" as const,
};

const paragraph = {
  color: "#525f7f",
  fontSize: "16px",
  lineHeight: "24px",
  textAlign: "center" as const,
  marginBottom: "20px",
};

const section = {
  padding: "20px",
  backgroundColor: "#f9fafb",
  border: "1px solid #e2e8f0",
  borderRadius: "5px",
  margin: "0 20px 20px",
};

const item = {
  marginBottom: "10px",
  paddingBottom: "10px",
  borderBottom: "1px solid #e2e8f0",
};

const itemTitle = {
  fontSize: "14px",
  fontWeight: "bold",
  color: "#333",
  margin: "0 0 4px",
};

const itemText = {
  fontSize: "14px",
  color: "#333",
  margin: "0 0 2px",
};

const itemSubtext = {
  fontSize: "12px",
  color: "#6b7280",
  margin: "0",
};

const goodBox = {
  backgroundColor: "#ECFDF5",
  padding: "20px",
  borderRadius: "5px",
  textAlign: "center" as const,
  border: "1px solid #10B981",
  margin: "0 20px",
};

const goodText = {
  color: "#047857",
  fontSize: "16px",
  fontWeight: "bold",
  margin: 0,
};

const btnContainer = {
  textAlign: "center" as const,
  marginTop: "20px",
};

const button = {
  backgroundColor: "#5469d4",
  borderRadius: "5px",
  color: "#fff",
  fontSize: "16px",
  fontWeight: "bold",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "block",
  width: "100%",
  padding: "10px",
};

const hr = {
  borderColor: "#e6ebf1",
  margin: "20px 0",
};

const footer = {
  color: "#8898aa",
  fontSize: "12px",
  lineHeight: "16px",
  textAlign: "center" as const,
};

export default DailyBriefingEmail;
