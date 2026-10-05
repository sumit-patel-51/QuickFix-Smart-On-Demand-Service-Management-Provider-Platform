<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('service_requests', function (Blueprint $table) {
                // Booking ke time locked basic price
            $table->decimal('provider_service_price', 10, 2)
                ->nullable()
                ->after('service_id');

            // Provider ke additional charges
            $table->decimal('extra_charges', 10, 2)
                ->default(0)
                ->after('provider_service_price');

            // Basic price + extra charges
            $table->decimal('final_price', 10, 2)
                ->nullable()
                ->after('extra_charges');

            // Customer approval status
            $table->enum('price_status', [
                'pending',
                'approved',
                'rejected'
            ])
                ->default('pending')
                ->after('final_price');

        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('service_requests', function (Blueprint $table) {
            //
        });
    }
};
