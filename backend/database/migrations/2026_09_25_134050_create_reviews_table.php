<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('reviews', function (Blueprint $table) {
            $table->id();

            // The completed service request
            $table->foreignId('service_request_id')
                ->constrained('service_requests')
                ->cascadeOnDelete();

            // User who gives the review
            $table->foreignId('reviewer_id')
                ->constrained('users')
                ->cascadeOnDelete();

            // User who receives the review
            $table->foreignId('reviewee_id')
                ->constrained('users')
                ->cascadeOnDelete();

            // customer or provider
            $table->enum('reviewer_role', [
                'customer',
                'provider',
            ]);

            // 1 to 5 stars
            $table->unsignedTinyInteger('rating');

            // Optional review text
            $table->text('comment')->nullable();

            $table->timestamps();

            /*
            |--------------------------------------------------------------------------
            | Prevent duplicate reviews
            |--------------------------------------------------------------------------
            |
            | One customer can review a provider once per service request.
            | One provider can review a customer once per service request.
            |
            */
            $table->unique([
                'service_request_id',
                'reviewer_id',
                'reviewer_role',
            ], 'unique_service_reviewer');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reviews');
    }
};