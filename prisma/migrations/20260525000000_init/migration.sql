-- CreateEnum
CREATE TYPE "GhgScope" AS ENUM ('SCOPE_1', 'SCOPE_2', 'SCOPE_3');

-- CreateTable
CREATE TABLE "countries" (
    "code" VARCHAR(2) NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "countries_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "companies" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "countryCode" VARCHAR(2) NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_types" (
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "scope" "GhgScope" NOT NULL,
    "category" TEXT,
    "defaultUnit" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "activity_types_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "activities" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "typeKey" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "description" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,
    "source" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "emission_factors" (
    "id" TEXT NOT NULL,
    "typeKey" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "numerator" TEXT NOT NULL,
    "denominator" TEXT NOT NULL,
    "source" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "emission_factors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "factor_versions" (
    "id" TEXT NOT NULL,
    "factorId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "validFrom" DATE NOT NULL,
    "validTo" DATE,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "factor_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "posts" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "resourceUid" TEXT NOT NULL,
    "dateTime" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "posts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "companies_countryCode_idx" ON "companies"("countryCode");

-- CreateIndex
CREATE INDEX "activities_companyId_date_idx" ON "activities"("companyId", "date");

-- CreateIndex
CREATE INDEX "activities_typeKey_date_idx" ON "activities"("typeKey", "date");

-- CreateIndex
CREATE UNIQUE INDEX "emission_factors_typeKey_key" ON "emission_factors"("typeKey");

-- CreateIndex
CREATE INDEX "factor_versions_factorId_validFrom_idx" ON "factor_versions"("factorId", "validFrom");

-- CreateIndex
CREATE UNIQUE INDEX "factor_versions_factorId_version_key" ON "factor_versions"("factorId", "version");

-- CreateIndex
CREATE INDEX "posts_resourceUid_dateTime_idx" ON "posts"("resourceUid", "dateTime");

-- AddForeignKey
ALTER TABLE "companies" ADD CONSTRAINT "companies_countryCode_fkey" FOREIGN KEY ("countryCode") REFERENCES "countries"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_typeKey_fkey" FOREIGN KEY ("typeKey") REFERENCES "activity_types"("key") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emission_factors" ADD CONSTRAINT "emission_factors_typeKey_fkey" FOREIGN KEY ("typeKey") REFERENCES "activity_types"("key") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factor_versions" ADD CONSTRAINT "factor_versions_factorId_fkey" FOREIGN KEY ("factorId") REFERENCES "emission_factors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "posts" ADD CONSTRAINT "posts_resourceUid_fkey" FOREIGN KEY ("resourceUid") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

