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
        Schema::create('service_requests', function (Blueprint $table) {
            $table->id();

            // Customer who created the request
            $table->foreignId('customer_id')
                ->constrained('users')
                ->cascadeOnDelete();

            // Requested service
            $table->foreignId('service_id')
                ->constrained('services')
                ->restrictOnDelete();

            // Service location
            $table->string('address');

            $table->decimal('latitude', 10, 7);

            $table->decimal('longitude', 10, 7);

            // Customer's problem
            $table->text('problem_description')->nullable();

            // NOW or SCHEDULED
            $table->enum('request_type', ['now', 'scheduled'])
                ->default('now');

            // If scheduled
            $table->dateTime('scheduled_at')->nullable();

            // Current request status
            $table->enum('status', [
                'searching',
                'provider_assigned',
                'provider_on_the_way',
                'arrived',
                'service_started',
                'service_completed',
                'cancelled',
            ])->default('searching');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('service_requests');
    }
};
