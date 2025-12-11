import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { PaymentFrequency } from "@prisma/client";
import { formatLegalDate, formatFrequencyText } from "@/lib/legal-helpers";
import { FIRM_NAME } from "@/lib/branding";

// Professional legal document styles
const styles = StyleSheet.create({
  page: {
    padding: 72, // 1 inch margins
    fontFamily: "Times-Roman",
    fontSize: 12,
    lineHeight: 1.6,
    color: "#000000",
    backgroundColor: "#FFFFFF",
  },
  title: {
    fontSize: 16,
    fontFamily: "Times-Bold",
    textAlign: "center",
    marginBottom: 30,
    textDecoration: "underline",
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: "Times-Bold",
    marginTop: 20,
    marginBottom: 10,
    textDecoration: "underline",
  },
  paragraph: {
    fontSize: 12,
    textAlign: "justify",
    marginBottom: 12,
  },
  indentedParagraph: {
    fontSize: 12,
    textAlign: "justify",
    marginBottom: 12,
    paddingLeft: 20,
  },
  bold: {
    fontFamily: "Times-Bold",
  },
  covenantNumber: {
    fontFamily: "Times-Bold",
    marginRight: 5,
  },
  covenantItem: {
    flexDirection: "row",
    marginBottom: 8,
    paddingLeft: 20,
  },
  covenantText: {
    flex: 1,
    fontSize: 12,
    textAlign: "justify",
  },
  signatureSection: {
    marginTop: 40,
  },
  signatureRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 30,
  },
  signatureBlock: {
    width: "45%",
  },
  signatureLine: {
    borderTop: "1 solid #000000",
    marginBottom: 5,
    marginTop: 50,
  },
  signatureLabel: {
    fontSize: 11,
    textAlign: "center",
  },
  signatureName: {
    fontSize: 11,
    textAlign: "center",
    fontFamily: "Times-Bold",
    marginTop: 3,
  },
  witnessSection: {
    marginTop: 40,
  },
  witnessTitle: {
    fontSize: 12,
    fontFamily: "Times-Bold",
    marginBottom: 15,
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 72,
    right: 72,
    textAlign: "center",
    fontSize: 9,
    color: "#666666",
  },
  pageNumber: {
    fontSize: 10,
    textAlign: "center",
  },
});

// Type definitions
export type AgreementTenancy = {
  id: string;
  tenantName: string;
  tenantPhone: string;
  tenantEmail?: string | null;
  startDate: Date | string;
  expiryDate: Date | string;
  annualRent: number | string;
  paymentFrequency: PaymentFrequency | null;
  securityDeposit?: number | string | null;
};

export type AgreementProperty = {
  address: string;
  city: string;
  state: string;
};

export type AgreementUnit = {
  name: string;
  type: string;
} | null;

export type AgreementLandlord = {
  firstName: string;
  lastName: string;
};

type TenancyAgreementPDFProps = {
  tenancy: AgreementTenancy;
  property: AgreementProperty;
  unit: AgreementUnit;
  landlord: AgreementLandlord;
};

// Format currency
function formatCurrency(amount: number | string): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return `₦${num.toLocaleString("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

// Format unit type
function formatUnitType(type: string): string {
  return type
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

export const TenancyAgreementPDFDocument: React.FC<
  TenancyAgreementPDFProps
> = ({ tenancy, property, unit, landlord }) => {
  const landlordName = `${landlord.firstName} ${landlord.lastName}`;
  const propertyAddress = `${property.address}, ${
    property.city
  }, ${property.state.replace(/_/g, " ")} State`;
  const startDate =
    typeof tenancy.startDate === "string"
      ? new Date(tenancy.startDate)
      : tenancy.startDate;
  const expiryDate =
    typeof tenancy.expiryDate === "string"
      ? new Date(tenancy.expiryDate)
      : tenancy.expiryDate;
  const annualRent =
    typeof tenancy.annualRent === "string"
      ? parseFloat(tenancy.annualRent)
      : tenancy.annualRent;
  const frequencyText = formatFrequencyText(tenancy.paymentFrequency);
  const unitDescription = unit
    ? `${unit.name} (${formatUnitType(unit.type)})`
    : "the demised premises";

  return (
    <Document>
      {/* Page 1 - Main Agreement */}
      <Page size="A4" style={styles.page}>
        {/* Title */}
        <Text style={styles.title}>TENANCY AGREEMENT</Text>

        {/* Parties */}
        <Text style={styles.paragraph}>
          <Text style={styles.bold}>THIS AGREEMENT</Text> is made this{" "}
          <Text style={styles.bold}>{formatLegalDate(startDate)}</Text>
        </Text>

        <Text style={styles.paragraph}>
          <Text style={styles.bold}>BETWEEN</Text>
        </Text>

        <Text style={styles.indentedParagraph}>
          <Text style={styles.bold}>{landlordName.toUpperCase()}</Text> of{" "}
          {propertyAddress} (hereinafter called{" "}
          <Text style={styles.bold}>"THE LANDLORD"</Text> which expression shall
          where the context so admits include his heirs, executors,
          administrators and assigns) of the one part;
        </Text>

        <Text style={styles.paragraph}>
          <Text style={styles.bold}>AND</Text>
        </Text>

        <Text style={styles.indentedParagraph}>
          <Text style={styles.bold}>{tenancy.tenantName.toUpperCase()}</Text> of{" "}
          {tenancy.tenantPhone}
          {tenancy.tenantEmail ? `, ${tenancy.tenantEmail}` : ""} (hereinafter
          called <Text style={styles.bold}>"THE TENANT"</Text> which expression
          shall where the context so admits include his heirs, executors,
          administrators and assigns) of the other part.
        </Text>

        {/* Recitals */}
        <Text style={styles.sectionTitle}>RECITALS</Text>

        <Text style={styles.paragraph}>
          <Text style={styles.bold}>WHEREAS</Text> the Landlord is the absolute
          owner of the property known as and situate at{" "}
          <Text style={styles.bold}>{propertyAddress}</Text> and is desirous of
          letting out {unitDescription} to the Tenant upon the terms and
          conditions hereinafter contained.
        </Text>

        <Text style={styles.paragraph}>
          <Text style={styles.bold}>AND WHEREAS</Text> the Tenant is desirous of
          taking the said property on tenancy upon the said terms and
          conditions.
        </Text>

        {/* The Grant */}
        <Text style={styles.sectionTitle}>THE GRANT</Text>

        <Text style={styles.paragraph}>
          <Text style={styles.bold}>NOW THIS AGREEMENT WITNESSETH</Text> as
          follows:
        </Text>

        <Text style={styles.paragraph}>
          1. In consideration of the rent hereby reserved and the covenants on
          the part of the Tenant hereinafter contained, the Landlord hereby lets
          to the Tenant <Text style={styles.bold}>ALL THAT</Text> property known
          as <Text style={styles.bold}>{unitDescription}</Text> situate at{" "}
          <Text style={styles.bold}>{propertyAddress}</Text> together with all
          fixtures and fittings therein.
        </Text>

        {/* Terms */}
        <Text style={styles.sectionTitle}>TERMS OF TENANCY</Text>

        <Text style={styles.paragraph}>
          2. <Text style={styles.bold}>RENT:</Text> The Tenant shall pay to the
          Landlord the sum of{" "}
          <Text style={styles.bold}>{formatCurrency(annualRent)}</Text> (
          {annualRent.toLocaleString("en-NG")} Naira) per annum, payable{" "}
          <Text style={styles.bold}>{frequencyText}</Text> in advance.
        </Text>

        <Text style={styles.paragraph}>
          3. <Text style={styles.bold}>DURATION:</Text> This tenancy shall
          commence from the{" "}
          <Text style={styles.bold}>{formatLegalDate(startDate)}</Text> and
          shall expire on the{" "}
          <Text style={styles.bold}>{formatLegalDate(expiryDate)}</Text>.
        </Text>

        {tenancy.securityDeposit && Number(tenancy.securityDeposit) > 0 && (
          <Text style={styles.paragraph}>
            4. <Text style={styles.bold}>SECURITY DEPOSIT:</Text> The Tenant
            shall pay a security deposit of{" "}
            <Text style={styles.bold}>
              {formatCurrency(tenancy.securityDeposit)}
            </Text>{" "}
            which shall be refundable at the end of the tenancy subject to the
            Tenant fulfilling all obligations under this Agreement.
          </Text>
        )}

        {/* Page Number */}
        <Text
          style={styles.footer}
          render={({ pageNumber, totalPages }) =>
            `${FIRM_NAME} | Page ${pageNumber} of ${totalPages}`
          }
          fixed
        />
      </Page>

      {/* Page 2 - Covenants and Signatures */}
      <Page size="A4" style={styles.page}>
        {/* Tenant's Covenants */}
        <Text style={styles.sectionTitle}>TENANT'S COVENANTS</Text>

        <Text style={styles.paragraph}>
          The Tenant hereby covenants with the Landlord as follows:
        </Text>

        <View style={styles.covenantItem}>
          <Text style={styles.covenantNumber}>(a)</Text>
          <Text style={styles.covenantText}>
            To pay the rent hereby reserved on the days and in the manner
            aforesaid without any deduction whatsoever, the first of such
            payments to be made on the date of this Agreement.
          </Text>
        </View>

        <View style={styles.covenantItem}>
          <Text style={styles.covenantNumber}>(b)</Text>
          <Text style={styles.covenantText}>
            To keep the interior of the demised premises including all fixtures,
            fittings, doors, windows, glass, locks, fastenings, installations,
            and appurtenances in good and tenantable repair and condition
            (reasonable wear and tear excepted) and deliver up the same at the
            expiration or sooner determination of the tenancy.
          </Text>
        </View>

        <View style={styles.covenantItem}>
          <Text style={styles.covenantNumber}>(c)</Text>
          <Text style={styles.covenantText}>
            Not to assign, underlet, or part with possession of the demised
            premises or any part thereof without the prior written consent of
            the Landlord.
          </Text>
        </View>

        <View style={styles.covenantItem}>
          <Text style={styles.covenantNumber}>(d)</Text>
          <Text style={styles.covenantText}>
            To pay all charges for electricity (NEPA/PHCN), water, waste
            disposal, and other utilities consumed on or in respect of the
            demised premises during the tenancy.
          </Text>
        </View>

        <View style={styles.covenantItem}>
          <Text style={styles.covenantNumber}>(e)</Text>
          <Text style={styles.covenantText}>
            Not to use the demised premises for any purpose other than as a
            private residence and not to carry on any trade, business, or
            profession therein.
          </Text>
        </View>

        <View style={styles.covenantItem}>
          <Text style={styles.covenantNumber}>(f)</Text>
          <Text style={styles.covenantText}>
            To permit the Landlord or his agents at reasonable times upon giving
            reasonable notice to enter the demised premises to view the state
            and condition thereof.
          </Text>
        </View>

        {/* Landlord's Covenants */}
        <Text style={styles.sectionTitle}>LANDLORD'S COVENANTS</Text>

        <Text style={styles.paragraph}>
          The Landlord hereby covenants with the Tenant as follows:
        </Text>

        <View style={styles.covenantItem}>
          <Text style={styles.covenantNumber}>(a)</Text>
          <Text style={styles.covenantText}>
            That the Tenant paying the rent hereby reserved and performing and
            observing the covenants on his part herein contained shall peaceably
            hold and enjoy the demised premises during the term without any
            interruption by the Landlord or any person claiming under or in
            trust for him.
          </Text>
        </View>

        <View style={styles.covenantItem}>
          <Text style={styles.covenantNumber}>(b)</Text>
          <Text style={styles.covenantText}>
            To keep the structure and exterior of the demised premises in good
            repair.
          </Text>
        </View>

        {/* Page Number */}
        <Text
          style={styles.footer}
          render={({ pageNumber, totalPages }) =>
            `${FIRM_NAME} | Page ${pageNumber} of ${totalPages}`
          }
          fixed
        />
      </Page>

      {/* Page 3 - Signatures */}
      <Page size="A4" style={styles.page}>
        {/* Execution Clause */}
        <Text style={styles.paragraph}>
          <Text style={styles.bold}>IN WITNESS WHEREOF</Text> the parties hereto
          have executed this Agreement the day and year first above written.
        </Text>

        {/* Signature Section */}
        <View style={styles.signatureSection}>
          <View style={styles.signatureRow}>
            {/* Landlord Signature */}
            <View style={styles.signatureBlock}>
              <Text style={styles.signatureLabel}>SIGNED by the LANDLORD:</Text>
              <View style={styles.signatureLine} />
              <Text style={styles.signatureName}>
                {landlordName.toUpperCase()}
              </Text>
            </View>

            {/* Tenant Signature */}
            <View style={styles.signatureBlock}>
              <Text style={styles.signatureLabel}>SIGNED by the TENANT:</Text>
              <View style={styles.signatureLine} />
              <Text style={styles.signatureName}>
                {tenancy.tenantName.toUpperCase()}
              </Text>
            </View>
          </View>
        </View>

        {/* Witnesses Section */}
        <View style={styles.witnessSection}>
          <Text style={styles.witnessTitle}>WITNESSES:</Text>

          <View style={styles.signatureRow}>
            {/* Witness 1 */}
            <View style={styles.signatureBlock}>
              <Text style={styles.signatureLabel}>
                Name: _______________________
              </Text>
              <Text style={styles.signatureLabel}>
                Address: ____________________
              </Text>
              <Text style={styles.signatureLabel}>
                Occupation: _________________
              </Text>
              <View style={styles.signatureLine} />
              <Text style={styles.signatureLabel}>Signature</Text>
            </View>

            {/* Witness 2 */}
            <View style={styles.signatureBlock}>
              <Text style={styles.signatureLabel}>
                Name: _______________________
              </Text>
              <Text style={styles.signatureLabel}>
                Address: ____________________
              </Text>
              <Text style={styles.signatureLabel}>
                Occupation: _________________
              </Text>
              <View style={styles.signatureLine} />
              <Text style={styles.signatureLabel}>Signature</Text>
            </View>
          </View>
        </View>

        {/* Page Number */}
        <Text
          style={styles.footer}
          render={({ pageNumber, totalPages }) =>
            `${FIRM_NAME} | Page ${pageNumber} of ${totalPages}`
          }
          fixed
        />
      </Page>
    </Document>
  );
};
