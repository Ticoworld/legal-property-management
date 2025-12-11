-- CreateTable
CREATE TABLE "firm_settings" (
    "id" TEXT NOT NULL,
    "firmName" TEXT NOT NULL DEFAULT 'Ogodo, Ogodo & Co.',
    "chambersName" TEXT NOT NULL DEFAULT 'Beracah Chambers',
    "address" TEXT NOT NULL DEFAULT '14 Ojeawere Street, Abakaliki, Ebonyi State',
    "city" TEXT NOT NULL DEFAULT 'Abakaliki',
    "state" TEXT NOT NULL DEFAULT 'Ebonyi',
    "solicitorName" TEXT NOT NULL DEFAULT 'K. O. Ogboso, Esq.',
    "solicitorTitle" TEXT NOT NULL DEFAULT 'Legal Practitioner',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "firm_settings_pkey" PRIMARY KEY ("id")
);
