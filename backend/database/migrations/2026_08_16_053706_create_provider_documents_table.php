<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('provider_documents', function (Blueprint $table) {
            $table->id();

            $table->foreignId('provider_id')
                ->constrained('providers')
                ->cascadeOnDelete();

            // Example:
            // government_id
            // service_license
            // certificate
            // business_registration
            $table->string('document_type');

            $table->string('document_number')->nullable();

            // Stored file path
            $table->string('document_file');

            $table->enum('status', [
                'pending',
                'approved',
                'rejected'
            ])->default('pending');

            $table->text('rejection_reason')->nullable();

            $table->timestamp('verified_at')->nullable();

            $table->foreignId('verified_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('provider_documents');
    }
};
