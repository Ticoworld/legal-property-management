import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";
import { format } from "date-fns";

// Register fonts (using built-in Times Roman for legal appearance)
const styles = StyleSheet.create({
  page: {
    padding: 60,
    fontFamily: "Times-Roman",
    fontSize: 12,
    lineHeight: 1.6,
    color: "#000000",
  },
  header: {
    textAlign: "center",
    marginBottom: 30,
    paddingBottom: 15,
    borderBottom: "2 solid #000000",
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: "Times-Bold",
    letterSpacing: 1,
  },
  headerSubtitle: {
    fontSize: 10,
    marginTop: 5,
    fontStyle: "italic",
  },
  section: {
    marginBottom: 15,
  },
  addressBlock: {
    marginBottom: 20,
    marginTop: 20,
  },
  addressLine: {
    fontSize: 12,
    marginBottom: 3,
  },
  salutation: {
    marginTop: 20,
    marginBottom: 15,
    fontSize: 12,
  },
  title: {
    textAlign: "center",
    fontSize: 14,
    fontFamily: "Times-Bold",
    textDecoration: "underline",
    marginBottom: 20,
    marginTop: 15,
  },
  body: {
    fontSize: 12,
    textAlign: "justify",
    marginBottom: 15,
    lineHeight: 1.8,
  },
  emphasis: {
    fontFamily: "Times-Bold",
  },
  dateBlock: {
    marginTop: 30,
    marginBottom: 40,
  },
  signatureBlock: {
    marginTop: 50,
    marginBottom: 20,
  },
  signatureLine: {
    borderTop: "1 solid #000000",
    width: 200,
    marginTop: 50,
    marginBottom: 5,
  },
  signatureText: {
    fontSize: 11,
    fontStyle: "italic",
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 60,
    right: 60,
    textAlign: "center",
    fontSize: 9,
    color: "#666666",
    borderTop: "1 solid #CCCCCC",
    paddingTop: 10,
  },
});

type NoticeToQuitProps = {
  tenantName: string;
  propertyAddress: string;
  expiryDate: Date;
  currentDate?: Date;
};

const formatLegalDate = (date: Date): string => {
  const day = format(date, "d");
  const suffix =
    day === "1" || day === "21" || day === "31"
      ? "st"
      : day === "2" || day === "22"
      ? "nd"
      : day === "3" || day === "23"
      ? "rd"
      : "th";
  return `${day}${suffix} day of ${format(date, "MMMM, yyyy")}`;
};

export const NoticeToQuitDocument: React.FC<NoticeToQuitProps> = ({
  tenantName,
  propertyAddress,
  expiryDate,
  currentDate = new Date(),
}) => {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>
            LEGAL PROPERTY MANAGEMENT CHAMBERS
          </Text>
          <Text style={styles.headerSubtitle}>
            Solicitors & Legal Practitioners
          </Text>
        </View>

        {/* Date */}
        <View style={styles.dateBlock}>
          <Text>Date: {formatLegalDate(currentDate)}</Text>
        </View>

        {/* Address Block */}
        <View style={styles.addressBlock}>
          <Text style={styles.addressLine}>To:</Text>
          <Text style={[styles.addressLine, styles.emphasis]}>
            {tenantName}
          </Text>
          <Text style={styles.addressLine}>{propertyAddress}</Text>
        </View>

        {/* Salutation */}
        <View style={styles.salutation}>
          <Text>SIR/MADAM,</Text>
        </View>

        {/* Title */}
        <Text style={styles.title}>NOTICE TO QUIT</Text>

        {/* Body */}
        <Text style={styles.body}>
          I hereby give you notice to quit and deliver up possession of the
          above-mentioned property which you hold as tenant, on or before the{" "}
          <Text style={styles.emphasis}>{formatLegalDate(expiryDate)}</Text>.
        </Text>

        <Text style={styles.body}>
          This notice is given in accordance with the terms of your tenancy
          agreement and the applicable laws of the Federal Republic of Nigeria.
        </Text>

        <Text style={styles.body}>
          You are required to vacate the said premises and deliver up possession
          thereof in good and tenantable condition, fair wear and tear excepted,
          on or before the date specified above.
        </Text>

        <Text style={styles.body}>
          Failure to comply with this notice may result in legal proceedings
          being instituted against you for recovery of possession and any
          outstanding rent or damages.
        </Text>

        <Text style={styles.body}>
          Take notice and govern yourself accordingly.
        </Text>

        {/* Signature Block */}
        <View style={styles.signatureBlock}>
          <Text style={styles.body}>Yours faithfully,</Text>
          <View style={styles.signatureLine} />
          <Text style={styles.signatureText}>
            For: Legal Property Management Chambers
          </Text>
          <Text style={styles.signatureText}>Solicitor</Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>
            This is a computer-generated document. No signature is required.
          </Text>
          <Text>
            Generated on {format(currentDate, "dd/MM/yyyy 'at' HH:mm")}
          </Text>
        </View>
      </Page>
    </Document>
  );
};
