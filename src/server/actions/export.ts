"use server";

import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth-helper';
import { jsonToCsvWithFormattedHeaders } from '@/lib/csv-exporter';
import { canExportData } from '@/lib/permissions';

export type ActionResult = {
  success: boolean;
  message: string;
  data?: string; // CSV string
  errors?: unknown;
};

/**
 * Export all properties to CSV
 * 
 * Security:
 * - RBAC: Only ADMIN can export properties
 * - Creates audit trail for export action
 * 
 * @returns ActionResult with CSV string containing property data
 */
export async function exportProperties(): Promise<ActionResult> {
  try {
    // 1. Authentication & Authorization
    const currentUser = await getCurrentUser();
    
    if (!canExportData(currentUser.role)) {
      return { 
        success: false, 
        message: 'Unauthorized. Only SUPER_ADMIN can export property data.' 
      };
    }

    // 2. Query all properties with related data
    const properties = await prisma.property.findMany({
      include: {
        owner: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        units: {
          select: {
            id: true,
          },
        },
        tenancies: {
          where: {
            status: 'ACTIVE',
          },
          select: {
            tenantName: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // 3. Transform data for CSV export
    const exportData = properties.map(property => ({
      address: property.address,
      city: property.city,
      state: property.state,
      ownerName: `${property.owner.firstName} ${property.owner.lastName}`,
      unitCount: property.units.length || 1, // Default to 1 for single-unit
      tenantNames: property.tenancies.map(t => t.tenantName).join('; ') || '—',
      structureType: property.structureType,
      registrationNumber: property.registrationNumber,
      createdAt: property.createdAt,
    }));

    // 4. Convert to CSV with formatted headers
    const headerMap = {
      address: 'Address',
      city: 'City',
      state: 'State',
      ownerName: 'Owner Name',
      unitCount: 'Unit Count',
      tenantNames: 'Active Tenants',
      structureType: 'Structure Type',
      registrationNumber: 'Reg. Number',
      createdAt: 'Date Added',
    };

    const csv = jsonToCsvWithFormattedHeaders(exportData, headerMap);

    // 5. Create audit log
    await prisma.auditLog.create({
      data: {
        action: 'EXPORT_PROPERTIES',
        entityType: 'Property',
        entityId: 'BULK_EXPORT',
        performedBy: currentUser.id,
        details: {
          recordCount: properties.length,
          exportedAt: new Date().toISOString(),
        },
      },
    });

    return {
      success: true,
      message: `Exported ${properties.length} properties successfully`,
      data: csv,
    };
  } catch (error) {
    console.error('exportProperties error:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to export properties',
    };
  }
}

/**
 * Export financial data (payments) for a specific year to CSV
 * 
 * Security:
 * - RBAC: Only ADMIN can export financial data
 * - Creates audit trail for export action
 * 
 * @param year - The year to export payments for
 * @returns ActionResult with CSV string containing payment data
 */
export async function exportFinancials(year: number): Promise<ActionResult> {
  try {
    // 1. Authentication & Authorization
    const currentUser = await getCurrentUser();
    
    if (!canExportData(currentUser.role)) {
      return { 
        success: false, 
        message: 'Unauthorized. Only SUPER_ADMIN can export financial data.' 
      };
    }

    // 2. Calculate date range for the year
    const startDate = new Date(year, 0, 1); // January 1st
    const endDate = new Date(year, 11, 31, 23, 59, 59); // December 31st

    // 3. Query all payments for the year with related data
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const payments = await (prisma as any).payment.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        tenancy: {
          include: {
            property: {
              select: {
                address: true,
                city: true,
              },
            },
          },
        },
        recordedByUser: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
    });

    // 4. Transform data for CSV export
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const exportData = payments.map((payment: any) => ({
      date: payment.date,
      amount: Number(payment.amount),
      type: payment.type,
      method: payment.method,
      reference: payment.reference || '—',
      tenantName: payment.tenancy.tenantName,
      propertyAddress: `${payment.tenancy.property.address}, ${payment.tenancy.property.city}`,
      recordedBy: payment.recordedByUser.name || 'Unknown',
    }));

    // 5. Convert to CSV with formatted headers
    const headerMap = {
      date: 'Date',
      amount: 'Amount (₦)',
      type: 'Payment Type',
      method: 'Payment Method',
      reference: 'Reference',
      tenantName: 'Tenant Name',
      propertyAddress: 'Property Address',
      recordedBy: 'Recorded By',
    };

    const csv = jsonToCsvWithFormattedHeaders(exportData, headerMap);

    // 6. Calculate totals for audit
    const totalAmount = exportData.reduce((sum: number, p: { amount: number }) => sum + p.amount, 0);

    // 7. Create audit log
    await prisma.auditLog.create({
      data: {
        action: 'EXPORT_FINANCIALS',
        entityType: 'Payment',
        entityId: 'BULK_EXPORT',
        performedBy: currentUser.id,
        details: {
          year,
          recordCount: payments.length,
          totalAmount: totalAmount.toFixed(2),
          exportedAt: new Date().toISOString(),
        },
      },
    });

    return {
      success: true,
      message: `Exported ${payments.length} payment records for ${year}`,
      data: csv,
    };
  } catch (error) {
    console.error('exportFinancials error:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to export financial data',
    };
  }
}

/**
 * Export all expenses to CSV
 * 
 * Security:
 * - RBAC: Only ADMIN can export expense data
 * - Creates audit trail for export action
 * 
 * @returns ActionResult with CSV string containing expense data
 */
export async function exportExpenses(): Promise<ActionResult> {
  try {
    // 1. Authentication & Authorization
    const currentUser = await getCurrentUser();
    
    if (!canExportData(currentUser.role)) {
      return { 
        success: false, 
        message: 'Unauthorized. Only SUPER_ADMIN can export expense data.' 
      };
    }

    // 2. Query all expenses with related data
    const expenses = await prisma.expense.findMany({
      include: {
        property: {
          select: {
            address: true,
            city: true,
          },
        },
        recordedByUser: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
    });

    // 3. Transform data for CSV export
    const exportData = expenses.map(expense => ({
      date: expense.date,
      amount: Number(expense.amount),
      category: expense.category,
      description: expense.description,
      propertyAddress: `${expense.property.address}, ${expense.property.city}`,
      recordedBy: expense.recordedByUser.name || 'Unknown',
    }));

    // 4. Convert to CSV with formatted headers
    const headerMap = {
      date: 'Date',
      amount: 'Amount (₦)',
      category: 'Category',
      description: 'Description',
      propertyAddress: 'Property Address',
      recordedBy: 'Recorded By',
    };

    const csv = jsonToCsvWithFormattedHeaders(exportData, headerMap);

    // 5. Calculate totals for audit
    const totalAmount = exportData.reduce((sum, e) => sum + e.amount, 0);

    // 6. Create audit log
    await prisma.auditLog.create({
      data: {
        action: 'EXPORT_EXPENSES',
        entityType: 'Expense',
        entityId: 'BULK_EXPORT',
        performedBy: currentUser.id,
        details: {
          recordCount: expenses.length,
          totalAmount: totalAmount.toFixed(2),
          exportedAt: new Date().toISOString(),
        },
      },
    });

    return {
      success: true,
      message: `Exported ${expenses.length} expense records`,
      data: csv,
    };
  } catch (error) {
    console.error('exportExpenses error:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to export expenses',
    };
  }
}
