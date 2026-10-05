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
        Schema::table('service_requests', function (Blueprint $table) {

            $table->dropForeign([
                'provider_id'
            ]);

            $table->foreign('provider_id')
                ->references('id')
                ->on('providers')
                ->nullOnDelete()->after('customer_id');

        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        //
    }
};
