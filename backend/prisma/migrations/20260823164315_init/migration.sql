-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- CreateTable
CREATE TABLE "institutions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "institutions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "credentials" (
    "credential_id" UUID NOT NULL,
    "chain_index" INTEGER NOT NULL,
    "student_name" TEXT NOT NULL,
    "student_roll_no" TEXT NOT NULL,
    "course_name" TEXT NOT NULL,
    "grade" TEXT NOT NULL,
    "issue_date" TEXT NOT NULL,
    "institution_id" UUID NOT NULL,
    "institution_name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "revoked_at" TIMESTAMPTZ,
    "revoked_reason" TEXT,
    "prev_hash" TEXT NOT NULL,
    "data_hash" TEXT NOT NULL,
    "block_hash" TEXT NOT NULL,
    "block_timestamp" TIMESTAMPTZ NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "credentials_pkey" PRIMARY KEY ("credential_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "institutions_email_key" ON "institutions"("email");

-- CreateIndex
CREATE UNIQUE INDEX "credentials_chain_index_key" ON "credentials"("chain_index");

-- CreateIndex
CREATE INDEX "credentials_institution_id_idx" ON "credentials"("institution_id");

-- CreateIndex
CREATE INDEX "credentials_block_hash_idx" ON "credentials"("block_hash");

-- CreateIndex
CREATE UNIQUE INDEX "credentials_institution_id_student_roll_no_key" ON "credentials"("institution_id", "student_roll_no");

-- AddForeignKey
ALTER TABLE "credentials" ADD CONSTRAINT "credentials_institution_id_fkey" FOREIGN KEY ("institution_id") REFERENCES "institutions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
