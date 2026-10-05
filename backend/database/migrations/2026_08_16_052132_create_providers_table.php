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
        Schema::create('providers', function (Blueprint $table) {
            $table->id();

            // User account
            $table->foreignId('user_id')
                ->constrained('users')
                ->cascadeOnDelete();

            // Provider information
            $table->string('phone')->nullable();
            $table->string('profile_image')->nullable();

            // Current provider location
            $table->decimal('latitude', 10, 7)->nullable();
            $table->decimal('longitude', 10, 7)->nullable();

            // Online / availability
            $table->boolean('is_online')->default(false);

            $table->enum('availability_status', [
                'offline',
                'available',
                'busy'
            ])->default('offline');

            // Verification
            $table->enum('verification_status', [
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

            // Rating / statistics
            $table->decimal('rating', 3, 2)->default(0);

            $table->unsignedInteger('total_jobs')->default(0);

            $table->timestamps();

            // One provider profile per user
            $table->unique('user_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('providers');
    }
};
