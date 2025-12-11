import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { format } from "date-fns";
import type { PaymentFrequency, Gender } from "@prisma/client";
import {
  getNoticePeriodText,
  calculateNoticeExpiryDate,
  getLandlordTerm,
  getPronouns,
  formatNameWithTitle,
} from "@/lib/legal-helpers";
import type { FirmSettings } from "@/server/actions/settings";

// Legal document styles - Times-Roman for official look
const styles = StyleSheet.create({
  page: {
    paddingTop: 36, // 0.5 inch margins
    paddingBottom: 36,
    paddingLeft: 40, // Slightly more on sides for readability
    paddingRight: 40,
    fontFamily: "Times-Roman",
    fontSize: 13,
    lineHeight: 1.3,
    color: "#000000",
    backgroundColor: "#FFFFFF",
  },
  courtHeader: {
    textAlign: "center",
    marginBottom: 5,
  },
  courtLine: {
    fontSize: 14,
    fontFamily: "Times-Bold",
    textTransform: "uppercase",
    textDecoration: "underline",
    marginBottom: 2,
  },
  suitNumber: {
    fontSize: 13,
    fontFamily: "Times-Bold",
    marginTop: 5,
    textAlign: "right",
  },
  partiesSection: {
    marginTop: 10,
    marginBottom: 5,
  },
  partyLine: {
    fontSize: 13,
    marginBottom: 1,
  },
  partyName: {
    fontFamily: "Times-Bold",
  },
  partyRole: {
    marginLeft: 20,
    fontFamily: "Times-Bold",
  },
  versus: {
    textAlign: "left",
    marginVertical: 2,
    fontSize: 13,
    fontFamily: "Times-Bold",
  },
  documentTitle: {
    textAlign: "center",
    fontSize: 16,
    fontFamily: "Times-Bold",
    marginTop: 10,
    marginBottom: 10,
  },
  addressee: {
    marginBottom: 5,
  },
  addresseeLine: {
    fontSize: 13,
    fontFamily: "Times-Bold",
  },
  salutation: {
    marginBottom: 5,
    fontSize: 13,
  },
  bodyParagraph: {
    fontSize: 13,
    textAlign: "justify",
    marginBottom: 5,
    lineHeight: 1.4,
  },
  dateSection: {
    marginTop: 15,
    marginBottom: 15,
  },
  dateLine: {
    fontSize: 13,
  },
  signatureSection: {
    marginTop: 30,
    alignItems: "flex-end",
    marginRight: 0, // Align with right margin
  },
  signatureBlock: {
    width: 250,
  },
  signatureLine: {
    marginTop: 10,
    marginBottom: 4,
    fontSize: 13,
  },
  solicitorName: {
    fontSize: 13,
    fontFamily: "Times-Bold",
  },
  solicitorDetails: {
    fontSize: 12, // Increased size
    fontFamily: "Times-Bold", // Added bold
    marginTop: 1,
  },
  serviceSection: {
    marginTop: 15,
    paddingTop: 5,
  },
  serviceTitle: {
    textDecoration: "underline",
    fontFamily: "Times-Bold",
    marginBottom: 2,
    fontSize: 13,
  },
});

// Type definitions for props
export type NoticeToQuitTenancy = {
  id: string;
  tenantName: string;
  paymentFrequency: PaymentFrequency | null;
  expiryDate: Date | string;
};

export type NoticeToQuitProperty = {
  address: string;
  city: string;
  state: string;
};

export type NoticeToQuitUnit = {
  name: string;
  type: string;
} | null;

export type NoticeToQuitSolicitor = {
  name: string | null;
};

export type NoticeToQuitLandlord = {
  firstName: string;
  lastName: string;
  title?: string | null;
  gender?: Gender | null;
};

type NoticeToQuitPDFProps = {
  tenancy: NoticeToQuitTenancy;
  property: NoticeToQuitProperty;
  unit: NoticeToQuitUnit;
  solicitor: NoticeToQuitSolicitor;
  landlord: NoticeToQuitLandlord;
  settings: FirmSettings;
  currentDate?: Date;
};

// Format unit type for display
function formatUnitType(type: string): string {
  return type
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

export const NoticeToQuitPDFDocument: React.FC<NoticeToQuitPDFProps> = ({
  tenancy,
  property,
  unit,
  solicitor,
  landlord,
  settings,
  currentDate = new Date(),
}) => {
  // Format landlord name with title
  const landlordName = formatNameWithTitle(
    landlord.title,
    landlord.firstName,
    landlord.lastName
  );
  const propertyAddress = `${property.address}, ${property.city}`;
  const stateName = property.state.replace(/_/g, " ").toUpperCase();
  const year = currentDate.getFullYear();

  // Get landlord term and pronouns based on gender
  const landlordTerm = getLandlordTerm(landlord.gender);
  const landlordPronouns = getPronouns(landlord.gender);

  // Calculate notice period and expiry
  const noticePeriod = getNoticePeriodText(tenancy.paymentFrequency);
  const noticeExpiryDate = calculateNoticeExpiryDate(
    currentDate,
    tenancy.paymentFrequency
  );

  // Unit description
  const unitDescription = unit
    ? `${unit.name} (${formatUnitType(unit.type)})`
    : "the premises";

  // Solicitor display name (ALWAYS use Firm Settings for legal identity, fallback to generic if empty)
  const solicitorName = settings.solicitorName || "The Legal Practitioner";

  // Calculate expiry date parts for the body text
  const expiryDay = format(noticeExpiryDate, "do");
  const expiryMonth = format(noticeExpiryDate, "MMMM");
  const expiryYear = format(noticeExpiryDate, "yyyy");

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Court Header */}
        <View style={styles.courtHeader}>
          <Text style={styles.courtLine}>
            IN THE MAGISTRATES&apos; COURT OF {settings.state.toUpperCase()}{" "}
            STATE OF NIGERIA
          </Text>
          <Text style={styles.courtLine}>
            IN THE MAGISTRATES&apos; COURT OF {settings.city.toUpperCase()}{" "}
            MAGISTERIAL DISTRICT
          </Text>
          <Text style={styles.courtLine}>
            HOLDEN AT {settings.city.toUpperCase()}
          </Text>
        </View>

        {/* Suit Number */}
        <Text style={styles.suitNumber}>
          RP NO.: .................../{year}
        </Text>

        {/* Parties Section */}
        <View style={styles.partiesSection}>
          <Text style={{ fontFamily: "Times-Bold", marginBottom: 5 }}>
            BETWEEN
          </Text>

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Text style={[styles.partyLine, styles.partyName]}>
              {landlordName.toUpperCase()}
            </Text>
            <Text style={{ fontSize: 10, letterSpacing: 2 }}>
              *************
            </Text>
            <Text style={styles.partyRole}>{landlordTerm.toUpperCase()}</Text>
          </View>

          <Text style={styles.versus}>AND</Text>

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Text style={[styles.partyLine, styles.partyName]}>
              {tenancy.tenantName.toUpperCase()}
            </Text>
            <Text style={{ fontSize: 10, letterSpacing: 2 }}>
              *************
            </Text>
            <Text style={styles.partyRole}>TENANT</Text>
          </View>
        </View>

        {/* Document Title */}
        <Text style={styles.documentTitle}>NOTICE TO QUIT</Text>

        {/* Addressee */}
        <View style={styles.addressee}>
          <Text style={styles.addresseeLine}>
            TO: {tenancy.tenantName.toUpperCase()},
          </Text>
          <Text style={styles.addresseeLine}>
            {propertyAddress.toUpperCase()},
          </Text>
          <Text style={styles.addresseeLine}>{stateName}.</Text>
        </View>

        {/* Salutation */}
        <Text style={styles.salutation}>Sir,</Text>

        {/* Body Paragraph */}
        <Text style={styles.bodyParagraph}>
          I, <Text style={{ fontFamily: "Times-Bold" }}>{solicitorName}</Text>,
          hereby as legal practitioner for{" "}
          <Text style={{ fontFamily: "Times-Bold" }}>
            {landlordName.toUpperCase()}
          </Text>
          , your {landlordTerm} and on behalf of the {landlordTerm} give you{" "}
          <Text style={{ fontFamily: "Times-Bold" }}>{noticePeriod}</Text>{" "}
          Notice to Quit and to deliver up possession of{" "}
          <Text style={{ fontFamily: "Times-Bold" }}>{unitDescription}</Text>{" "}
          with appurtenances thereto situate at{" "}
          <Text style={{ fontFamily: "Times-Bold" }}>{propertyAddress}</Text>{" "}
          which you hold of {landlordPronouns.object} as a yearly tenant thereof
          on the <Text style={{ fontFamily: "Times-Bold" }}>{expiryDay}</Text>{" "}
          day of{" "}
          <Text style={{ fontFamily: "Times-Bold" }}>
            {expiryMonth}, {expiryYear}
          </Text>
          .
        </Text>

        {/* Date Section */}
        <View style={styles.dateSection}>
          <Text style={styles.dateLine}>
            Dated at{" "}
            {settings.city.charAt(0).toUpperCase() +
              settings.city.slice(1).toLowerCase()}{" "}
            this {format(currentDate, "do")} day of{" "}
            {format(currentDate, "MMMM")}, {format(currentDate, "yyyy")}.
          </Text>
        </View>

        <View style={styles.signatureSection}>
          <View style={styles.signatureBlock}>
            <Text style={styles.signatureLine}>
              ......................................................
            </Text>
            <Text style={styles.solicitorName}>{solicitorName}</Text>
            <Text style={styles.solicitorDetails}>{settings.firmName}</Text>
            <Text style={styles.solicitorDetails}>{settings.chambersName}</Text>
            <Text style={styles.solicitorDetails}>{settings.address}</Text>
            <Text style={styles.solicitorDetails}>
              {settings.solicitorTitle}
            </Text>
            <Text style={styles.solicitorDetails}>
              For Above Named {landlordTerm}.
            </Text>
          </View>
        </View>

        {/* Service Section matching image */}
        <View style={styles.serviceSection}>
          <Text style={styles.serviceTitle}>SERVICE ON:</Text>
          <Text style={styles.addresseeLine}>
            TO: {tenancy.tenantName.toUpperCase()},
          </Text>
          <Text style={styles.addresseeLine}>
            {propertyAddress.toUpperCase()},
          </Text>
          <Text style={styles.addresseeLine}>{stateName}.</Text>
        </View>
      </Page>
    </Document>
  );
};
