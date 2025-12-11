import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { format } from "date-fns";
import type { PaymentFrequency, Gender } from "@prisma/client";
import type { FirmSettings } from "@/server/actions/settings";
import {
  getLandlordTerm,
  getPronouns,
  formatNameWithTitle,
} from "@/lib/legal-helpers";

// Reusing styles from Notice to Quit for consistency
const styles = StyleSheet.create({
  page: {
    paddingTop: 36, // 0.5 inch margins
    paddingBottom: 36,
    paddingLeft: 40,
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
    fontSize: 16, // Slightly smaller than Notice to Quit because title is long
    fontFamily: "Times-Bold",
    textDecoration: "underline",
    marginTop: 5,
    marginBottom: 5,
    paddingLeft: 20,
    paddingRight: 20,
  },
  addressee: {
    marginBottom: 2,
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
    marginTop: 5, // Reduced to pull signature up
    alignItems: "flex-end",
    marginRight: 0,
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
    fontSize: 12,
    fontFamily: "Times-Bold",
    marginTop: 1,
  },
  serviceSection: {
    marginTop: 10,
    paddingTop: 5,
  },
  serviceTitle: {
    textDecoration: "underline",
    fontFamily: "Times-Bold",
    marginBottom: 2,
    fontSize: 13,
  },
});

export type NoticeOfIntentionTenancy = {
  id: string;
  tenantName: string;
  paymentFrequency: PaymentFrequency | null;
  expiryDate: Date | string; // This acts as the "Date of Notice to Quit" determiner
};

export type NoticeOfIntentionProperty = {
  address: string;
  city: string;
  state: string;
};

export type NoticeOfIntentionUnit = {
  name: string;
  type: string;
} | null;

export type NoticeOfIntentionSolicitor = {
  name: string | null;
};

export type NoticeOfIntentionLandlord = {
  firstName: string;
  lastName: string;
  title?: string | null;
  gender?: Gender | null;
};

type NoticeOfIntentionPDFProps = {
  tenancy: NoticeOfIntentionTenancy;
  property: NoticeOfIntentionProperty;
  unit: NoticeOfIntentionUnit;
  solicitor: NoticeOfIntentionSolicitor;
  landlord: NoticeOfIntentionLandlord;
  settings: FirmSettings;
  currentDate?: Date;
};

function formatUnitType(type: string): string {
  return type
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

export const NoticeOfIntentionPDFDocument: React.FC<
  NoticeOfIntentionPDFProps
> = ({
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

  // Calculate Quit Notice determination date (tenancy expiry)
  const quitDateObj = new Date(tenancy.expiryDate);
  const quitDay = format(quitDateObj, "do");
  const quitMonth = format(quitDateObj, "MMMM");
  const quitYear = format(quitDateObj, "yyyy");

  // Unit description
  const unitDescription = unit
    ? `${unit.name} (${formatUnitType(unit.type)})`
    : "the premises";

  // Solicitor display name (ALWAYS use Firm Settings for legal identity, fallback to generic if empty)
  const solicitorName = settings.solicitorName || "The Legal Practitioner";

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
        <Text style={styles.documentTitle}>
          NOTICE OF OWNER&apos;S INTENTION TO APPLY TO COURT TO RECOVER
          POSSESSION
        </Text>

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
        <Text style={styles.salutation}>Dear Sir,</Text>

        {/* Body Paragraph */}
        <Text style={styles.bodyParagraph}>
          I, <Text style={{ fontFamily: "Times-Bold" }}>{solicitorName}</Text>,
          hereby as legal practitioner for{" "}
          <Text style={{ fontFamily: "Times-Bold" }}>
            {landlordName.toUpperCase()}
          </Text>
          , the owner of the property where you are occupying, do hereby give
          you notice that unless peaceable possession of{" "}
          <Text style={{ fontFamily: "Times-Bold" }}>{unitDescription}</Text>{" "}
          and premises with appurtenances thereto situate at{" "}
          <Text style={{ fontFamily: "Times-Bold" }}>{propertyAddress}</Text>{" "}
          which was held of the said owner as a yearly tenant which tenancy was
          determined by a Notice to Quit on{" "}
          <Text style={{ fontFamily: "Times-Bold" }}>{quitDay}</Text> Day of{" "}
          <Text style={{ fontFamily: "Times-Bold" }}>
            {quitMonth}, {quitYear}
          </Text>{" "}
          and which premises are now held and detained from the owner{" "}
          <Text style={{ fontFamily: "Times-Bold" }}>
            {landlordName.toUpperCase()}
          </Text>
          , be given to {landlordPronouns.object} on or before the expiration of{" "}
          <Text style={{ fontFamily: "Times-Bold" }}>SEVEN CLEAR DAYS</Text>{" "}
          from the date of service of this notice on you. I,{" "}
          <Text style={{ fontFamily: "Times-Bold" }}>{solicitorName}</Text>,
          shall apply to the court to issue warrant directing an appropriate
          person to enter and take possession of the said{" "}
          <Text style={{ fontFamily: "Times-Bold" }}>{unitDescription}</Text>{" "}
          and premises with appurtenances thereto situate at{" "}
          <Text style={{ fontFamily: "Times-Bold" }}>{propertyAddress}</Text>{" "}
          and to eject any person therefrom.
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
          <Text style={styles.serviceTitle}>FOR SERVICE:</Text>
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
