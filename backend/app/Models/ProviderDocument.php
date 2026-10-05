<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProviderDocument extends Model
{
    protected $fillable = [
        'provider_id',
        'document_type',
        'document_number',
        'document_file',
        'status',
        'rejection_reason',
        'verified_at',
        'verified_by',
    ];

    protected $casts = [
        'verified_at' => 'datetime',
    ];

    public function provider(): BelongsTo
    {
        return $this->belongsTo(Provider::class);
    }

    public function verifier(): BelongsTo
    {
        return $this->belongsTo(
            User::class,
            'verified_by'
        );
    }
}