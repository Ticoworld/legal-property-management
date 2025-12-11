import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { format } from "date-fns";
import type { FirmSettings } from "@/server/actions/settings";

// Professional black & white receipt styles
const styles = StyleSheet.create({
  page: {
    padding: 50,
    fontFamily: "Times-Roman",
    fontSize: 11,
    lineHeight: 1.5,
    color: "#000000",
    backgroundColor: "#FFFFFF",
  },
  header: {
    textAlign: "center",
    marginBottom: 25,
    paddingBottom: 15,
    borderBottom: "2 solid #000000",
  },
  companyName: {
    fontSize: 18,
    fontFamily: "Times-Bold",
    letterSpacing: 1,
    marginBottom: 5,
  },
  subHeader: {
    fontSize: 10,
    color: "#333333",
  },
  receiptTitle: {
    textAlign: "center",
    fontSize: 16,
    fontFamily: "Times-Bold",
    marginTop: 20,
    marginBottom: 20,
    textDecoration: "underline",
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 10,
    color: "#555555",
    width: "30%",
  },
  infoValue: {
    fontSize: 11,
    fontFamily: "Times-Bold",
    width: "70%",
    textAlign: "right",
  },
  section: {
    marginTop: 20,
    marginBottom: 15,
    padding: 15,
    border: "1 solid #CCCCCC",
  },
  fieldRow: {
    flexDirection: "row",
    marginBottom: 12,
  },
  fieldLabel: {
    fontSize: 11,
    width: "35%",
    color: "#333333",
  },
  fieldValue: {
    fontSize: 11,
    fontFamily: "Times-Bold",
    width: "65%",
  },
  amountSection: {
    marginTop: 15,
    padding: 15,
    backgroundColor: "#F5F5F5",
    border: "2 solid #000000",
  },
  amountLabel: {
    fontSize: 12,
    marginBottom: 5,
  },
  amountValue: {
    fontSize: 18,
    fontFamily: "Times-Bold",
  },
  amountWords: {
    fontSize: 10,
    fontStyle: "italic",
    marginTop: 5,
    color: "#555555",
  },
  signatureSection: {
    marginTop: 50,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  signatureBlock: {
    width: "45%",
  },
  signatureLine: {
    borderTop: "1 solid #000000",
    marginBottom: 5,
    marginTop: 40,
  },
  signatureLabel: {
    fontSize: 10,
    textAlign: "center",
    color: "#555555",
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 50,
    right: 50,
    textAlign: "center",
    fontSize: 8,
    color: "#888888",
    borderTop: "1 solid #CCCCCC",
    paddingTop: 10,
  },
  disclaimer: {
    fontSize: 9,
    fontStyle: "italic",
    marginBottom: 3,
  },
});

// Convert number to words (for Nigerian Naira)
function numberToWords(num: number): string {
  const ones = [
    "",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
  ];
  const tens = [
    "",
    "",
    "Twenty",
    "Thirty",
    "Forty",
    "Fifty",
    "Sixty",
    "Seventy",
    "Eighty",
    "Ninety",
  ];

  if (num === 0) return "Zero";
  if (num < 0) return "Negative " + numberToWords(Math.abs(num));

  let words = "";

  // Handle billions
  if (Math.floor(num / 1000000000) > 0) {
    words += numberToWords(Math.floor(num / 1000000000)) + " Billion ";
    num %= 1000000000;
  }

  // Handle millions
  if (Math.floor(num / 1000000) > 0) {
    words += numberToWords(Math.floor(num / 1000000)) + " Million ";
    num %= 1000000;
  }

  // Handle thousands
  if (Math.floor(num / 1000) > 0) {
    words += numberToWords(Math.floor(num / 1000)) + " Thousand ";
    num %= 1000;
  }

  // Handle hundreds
  if (Math.floor(num / 100) > 0) {
    words += ones[Math.floor(num / 100)] + " Hundred ";
    num %= 100;
  }

  // Handle tens and ones
  if (num > 0) {
    if (words !== "") words += "and ";
    if (num < 20) {
      words += ones[num];
    } else {
      words += tens[Math.floor(num / 10)];
      if (num % 10 > 0) {
        words += "-" + ones[num % 10];
      }
    }
  }

  return words.trim();
}

function amountToWords(amount: number): string {
  const naira = Math.floor(amount);
  const kobo = Math.round((amount - naira) * 100);

  let result = numberToWords(naira) + " Naira";
  if (kobo > 0) {
    result += " and " + numberToWords(kobo) + " Kobo";
  }
  result += " Only";

  return result;
}

// Format currency with NGN prefix (safe for PDF rendering)
function formatCurrency(amount: number): string {
  return `NGN ${amount.toLocaleString("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export type ReceiptPayment = {
  id: string;
  date: Date | string;
  amount: number | string;
  type: string;
  method: string;
  reference?: string | null;
};

export type ReceiptTenancy = {
  id: string;
  tenantName: string;
  tenantPhone?: string;
  tenantEmail?: string | null;
};

export type ReceiptProperty = {
  address: string;
  city?: string;
};

type ReceiptPDFProps = {
  payment: ReceiptPayment;
  tenancy: ReceiptTenancy;
  property: ReceiptProperty;
  settings: FirmSettings;
  currentDate?: Date;
};

export const ReceiptPDFDocument: React.FC<ReceiptPDFProps> = ({
  payment,
  tenancy,
  property,
  settings,
  currentDate = new Date(),
}) => {
  const paymentDate =
    typeof payment.date === "string" ? new Date(payment.date) : payment.date;
  const amount =
    typeof payment.amount === "string"
      ? parseFloat(payment.amount)
      : payment.amount;

  const propertyAddress = property.city
    ? `${property.address}, ${property.city}`
    : property.address;

  // Format payment type for display (e.g., "RENT" -> "Rent", "SECURITY_DEPOSIT" -> "Security Deposit")
  const formatPaymentType = (type: string): string => {
    return type
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  };

  // Get payment year for description
  const paymentYear = format(paymentDate, "yyyy");

  // Short receipt number (last 8 chars of payment ID)
  const receiptNumber = payment.id.slice(-8).toUpperCase();

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.companyName}>
            {settings.firmName.toUpperCase()}
          </Text>
          <Text style={styles.subHeader}>{settings.chambersName}</Text>
        </View>

        {/* Receipt Title */}
        <Text style={styles.receiptTitle}>PAYMENT RECEIPT</Text>

        {/* Receipt Info */}
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Receipt No:</Text>
          <Text style={styles.infoValue}>{receiptNumber}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Date:</Text>
          <Text style={styles.infoValue}>
            {format(paymentDate, "MMMM dd, yyyy")}
          </Text>
        </View>

        {/* Payment Details Section */}
        <View style={styles.section}>
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Received From:</Text>
            <Text style={styles.fieldValue}>{tenancy.tenantName}</Text>
          </View>

          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Being Payment For:</Text>
            <Text style={styles.fieldValue}>
              {propertyAddress} - {formatPaymentType(payment.type)}{" "}
              {paymentYear}
            </Text>
          </View>

          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Payment Method:</Text>
            <Text style={styles.fieldValue}>
              {formatPaymentType(payment.method)}
            </Text>
          </View>

          {payment.reference && (
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>Reference:</Text>
              <Text style={styles.fieldValue}>{payment.reference}</Text>
            </View>
          )}
        </View>

        {/* Amount Section */}
        <View style={styles.amountSection}>
          <Text style={styles.amountLabel}>The Sum Of:</Text>
          <Text style={styles.amountValue}>{formatCurrency(amount)}</Text>
          <Text style={styles.amountWords}>({amountToWords(amount)})</Text>
        </View>

        {/* Signature Section */}
        <View style={styles.signatureSection}>
          <View style={styles.signatureBlock}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>Received By</Text>
          </View>
          <View style={styles.signatureBlock}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>{settings.solicitorName}</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.disclaimer}>
            This receipt is valid only when payment has been confirmed and
            cleared.
          </Text>
          <Text>
            Generated on {format(currentDate, "dd/MM/yyyy 'at' HH:mm")}
          </Text>
        </View>
      </Page>
    </Document>
  );
};
