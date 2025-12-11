"use client";

import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
  Image,
} from "@react-pdf/renderer";
import { format } from "date-fns";

// Register fonts if needed (using default Helvetica for now)
// Font.register({ family: 'Inter', src: '...' });

const styles = StyleSheet.create({
  page: {
    flexDirection: "column",
    backgroundColor: "#FFFFFF",
    padding: 40,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: "#333333",
  },
  header: {
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
    paddingBottom: 20,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  headerLeft: {
    flexDirection: "column",
  },
  firmName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#0F172A", // Slate 900
    marginBottom: 4,
  },
  firmDetails: {
    fontSize: 9,
    color: "#64748B", // Slate 500
    marginBottom: 2,
  },
  headerRight: {
    alignItems: "flex-end",
    justifyContent: "center",
  },
  reportTitle: {
    fontSize: 16,
    fontWeight: "bold",
    textTransform: "uppercase",
    color: "#0F172A",
  },
  reportSubtitle: {
    fontSize: 10,
    color: "#64748B",
    marginTop: 4,
  },
  clientSection: {
    marginBottom: 30,
    padding: 15,
    backgroundColor: "#F8FAFC", // Slate 50
    borderRadius: 4,
  },
  row: {
    flexDirection: "row",
    marginBottom: 4,
  },
  label: {
    width: 80,
    fontWeight: "bold",
    color: "#64748B",
  },
  value: {
    flex: 1,
    fontWeight: "medium",
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 10,
    marginTop: 20,
    color: "#0F172A",
    borderBottomWidth: 2,
    borderBottomColor: "#E2E8F0",
    paddingBottom: 5,
  },
  table: {
    width: "100%",
    marginBottom: 15,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#F1F5F9", // Slate 100
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#CBD5E1",
    fontWeight: "bold",
    fontSize: 9,
  },
  tableRow: {
    flexDirection: "row",
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    fontSize: 9,
  },
  // Columns
  colDate: { width: "15%" },
  colDesc: { width: "40%" },
  colRef: { width: "25%" },
  colAmount: { width: "20%", textAlign: "right" },

  // Summary
  summaryBox: {
    marginTop: 30,
    marginLeft: "auto",
    width: "40%",
    backgroundColor: "#F8FAFC",
    padding: 15,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 10,
    color: "#64748B",
  },
  summaryValue: {
    fontSize: 10,
    fontWeight: "bold",
  },
  netRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#CBD5E1",
  },
  netLabel: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#0F172A",
  },
  netValue: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#0F172A",
  },
  footer: {
    position: "absolute",
    bottom: 40,
    left: 40,
    right: 40,
    textAlign: "center",
    borderTopWidth: 1,
    borderTopColor: "#EEEEEE",
    paddingTop: 20,
  },
  certification: {
    fontSize: 8,
    color: "#94A3B8",
    fontStyle: "italic",
    marginBottom: 4,
  },
  solicitor: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#0F172A",
  },
});

// Helper for currency formatting
const formatCurrency = (amount: number) => {
  return `N${amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

type RemittanceReportPDFProps = {
  data: {
    client: any;
    firmSettings: any;
    payments: any[];
    expenses: any[];
    summary: {
      totalIncome: number;
      totalExpenses: number;
      netRemittance: number;
    };
    period: {
      start: Date;
      end: Date;
    };
  };
};

export const RemittanceReportPDF = ({ data }: RemittanceReportPDFProps) => {
  const { client, firmSettings, payments, expenses, summary, period } = data;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.firmName}>{firmSettings.firmName}</Text>
            <Text style={styles.firmDetails}>{firmSettings.address}</Text>
            <Text style={styles.firmDetails}>
              {firmSettings.city}, {firmSettings.state}
            </Text>
            <Text style={styles.firmDetails}>{firmSettings.chambersName}</Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.reportTitle}>Statement of Account</Text>
            <Text style={styles.reportSubtitle}>
              {format(new Date(), "MMMM d, yyyy")}
            </Text>
          </View>
        </View>

        {/* Client Info */}
        <View style={styles.clientSection}>
          <View style={styles.row}>
            <Text style={styles.label}>Prepared For:</Text>
            <Text style={styles.value}>
              {client.firstName} {client.lastName}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Address:</Text>
            <Text style={styles.value}>{client.address || "N/A"}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Period:</Text>
            <Text style={styles.value}>
              {format(new Date(period.start), "MMM d, yyyy")} -{" "}
              {format(new Date(period.end), "MMM d, yyyy")}
            </Text>
          </View>
        </View>

        {/* Income Table */}
        <Text style={styles.sectionTitle}>Income (Credits)</Text>
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.colDate}>Date</Text>
            <Text style={styles.colDesc}>Description / Tenant</Text>
            <Text style={styles.colRef}>Property</Text>
            <Text style={styles.colAmount}>Amount</Text>
          </View>
          {payments.length === 0 ? (
            <View style={styles.tableRow}>
              <Text
                style={{
                  ...styles.value,
                  textAlign: "center",
                  color: "#94A3B8",
                }}
              >
                No income recorded for this period
              </Text>
            </View>
          ) : (
            payments.map((payment: any) => (
              <View style={styles.tableRow} key={payment.id}>
                <Text style={styles.colDate}>
                  {format(new Date(payment.date), "dd/MM/yyyy")}
                </Text>
                <Text style={styles.colDesc}>
                  {payment.tenancy.include?.property?.address ? "" : ""}{" "}
                  {/* TS Hack to verify structure */}
                  Rent Received -{" "}
                  {payment.tenancy?.tenantName || "Unknown Tenant"}
                </Text>
                <Text style={styles.colRef}>
                  {payment.tenancy?.property?.address || "N/A"}
                </Text>
                <Text style={styles.colAmount}>
                  {formatCurrency(Number(payment.amount))}
                </Text>
              </View>
            ))
          )}
        </View>

        {/* Expenses Table */}
        <Text style={styles.sectionTitle}>Expenses (Debits)</Text>
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.colDate}>Date</Text>
            <Text style={styles.colDesc}>Description / Category</Text>
            <Text style={styles.colRef}>Property</Text>
            <Text style={styles.colAmount}>Amount</Text>
          </View>
          {expenses.length === 0 ? (
            <View style={styles.tableRow}>
              <Text
                style={{
                  ...styles.value,
                  textAlign: "center",
                  color: "#94A3B8",
                }}
              >
                No expenses recorded for this period
              </Text>
            </View>
          ) : (
            expenses.map((expense: any) => (
              <View style={styles.tableRow} key={expense.id}>
                <Text style={styles.colDate}>
                  {format(new Date(expense.date), "dd/MM/yyyy")}
                </Text>
                <Text style={styles.colDesc}>
                  {expense.category} - {expense.description || "No description"}
                </Text>
                <Text style={styles.colRef}>
                  {expense.property?.address || "N/A"}
                </Text>
                <Text style={styles.colAmount}>
                  ({formatCurrency(Number(expense.amount))})
                </Text>
              </View>
            ))
          )}
        </View>

        {/* Summary */}
        <View style={styles.summaryBox}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Collected:</Text>
            <Text style={styles.summaryValue}>
              {formatCurrency(summary.totalIncome)}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Less Expenses:</Text>
            <Text style={(styles.summaryValue, { color: "#DC2626" })}>
              ({formatCurrency(summary.totalExpenses)})
            </Text>
          </View>
          <View style={styles.netRow}>
            <Text style={styles.netLabel}>NET REMITTANCE:</Text>
            <Text style={styles.netValue}>
              {formatCurrency(summary.netRemittance)}
            </Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.certification}>
            Certified true and correct by
          </Text>
          <Text style={styles.solicitor}>
            {firmSettings.solicitorName} ({firmSettings.solicitorTitle})
          </Text>
          <Text style={{ fontSize: 8, color: "#CBD5E1", marginTop: 10 }}>
            Generated by Legal Property Management System
          </Text>
        </View>
      </Page>
    </Document>
  );
};
